import { Elysia, t } from 'elysia'
import { authMiddleware } from '../middlewares/auth'
import { db } from '../db/client'
import { debts, installments } from '../db/schema'
import { and, eq, sql, asc, desc } from 'drizzle-orm'

export const dashboardRoutes = new Elysia({ prefix: '/dashboard' })
    .use(authMiddleware)
    .get('/summary', async ({ userId, query }) => {
        // Params opcionais
        const limitDebts = Number((query as any)?.limitDebts ?? 50)  // top-N por remaining
        const upcomingLimit = Number((query as any)?.upcomingLimit ?? 10)

        // --- 1) Agregados globais (todas as dívidas do usuário)
        const [globals] = await db
            .select({
                totalExpected: sql<string | null>`sum(${installments.expectedTotal})`,
                totalPaid: sql<string | null>`sum(${installments.paidTotal})`,
                interestPaid: sql<string | null>`sum(${installments.paidInterest})`,
                feesPaid: sql<string | null>`sum(${installments.paidFees})`,
                principalPaid: sql<string | null>`sum(${installments.paidPrincipal})`,
                overdueCount: sql<number>`sum(case when ${installments.status} = 'overdue' then 1 else 0 end)`
            })
            .from(installments)
            .innerJoin(debts, eq(installments.debtId, debts.id))
            .where(eq(debts.userId, userId))

        // remaining global = soma do último remaining por dívida (ou principal - principalPaid)
        // estratégia: pegar a última remainingPrincipalAfter por dívida
        const lastRem = await db.execute(sql`
      SELECT i.debt_id, i.remaining_principal_after
      FROM installments i
      JOIN debts d ON d.id = i.debt_id
      WHERE d.user_id = ${userId}
      AND i.number = (
        SELECT max(i2.number) FROM installments i2 WHERE i2.debt_id = i.debt_id
      )
    `)

        const remainingPrincipal = (lastRem as any[]).reduce((acc, r) => acc + Number(r.remaining_principal_after ?? 0), 0)

        // --- 2) Agregados por dívida
        const perDebt = await db.execute(sql`
      SELECT
        d.id,
        d.title,
        COALESCE(SUM(i.expected_total),0) AS total_expected,
        COALESCE(SUM(i.paid_total),0)     AS total_paid,
        COALESCE(SUM(CASE WHEN i.status='overdue' THEN 1 ELSE 0 END),0) AS overdue_count
      FROM debts d
      LEFT JOIN installments i ON i.debt_id = d.id
      WHERE d.user_id = ${userId}
      GROUP BY d.id, d.title
    `)

        // map -> adicionar remaining (último remaining da dívida) e nextDue (distinct on)
        const remainingByDebt = await db.execute(sql`
      SELECT x.debt_id, x.remaining_principal_after
      FROM (
        SELECT i.debt_id, i.number, i.remaining_principal_after,
               ROW_NUMBER() OVER (PARTITION BY i.debt_id ORDER BY i.number DESC) AS rn
        FROM installments i
        JOIN debts d ON d.id = i.debt_id
        WHERE d.user_id = ${userId}
      ) x
      WHERE x.rn = 1
    `)

        const nextDueByDebt = await db.execute(sql`
      SELECT DISTINCT ON (i.debt_id)
        i.debt_id,
        i.id,
        i.number,
        i.due_date,
        i.expected_total,
        i.status
      FROM installments i
      JOIN debts d ON d.id = i.debt_id
      WHERE d.user_id = ${userId}
        AND (i.status = 'pending' OR i.status = 'partially_paid')
      ORDER BY i.debt_id, i.due_date ASC
    `)

        const remMap = new Map<number, number>()
        for (const r of (remainingByDebt as any[])) remMap.set(Number(r.debt_id), Number(r.remaining_principal_after ?? 0))

        const nextMap = new Map<number, any>()
        for (const n of (nextDueByDebt as any[])) {
            nextMap.set(Number(n.debt_id), {
                id: Number(n.id),
                number: Number(n.number),
                dueDate: n.due_date,
                expectedTotal: Number(n.expected_total ?? 0),
                status: n.status
            })
        }

        let debtsAgg = (perDebt as any[]).map(r => ({
            id: Number(r.id),
            title: r.title as string,
            totalExpected: Number(r.total_expected ?? 0),
            totalPaid: Number(r.total_paid ?? 0),
            overdueCount: Number(r.overdue_count ?? 0),
            remainingPrincipal: remMap.get(Number(r.id)) ?? 0,
            nextDue: nextMap.get(Number(r.id)) ?? null
        }))

        // ordenar por maior saldo remanescente (desc) e limitar
        debtsAgg.sort((a, b) => b.remainingPrincipal - a.remainingPrincipal)
        if (Number.isFinite(limitDebts) && limitDebts > 0) debtsAgg = debtsAgg.slice(0, limitDebts)

        // --- 3) Próximos vencimentos globais (top N pela data)
        const upcoming = await db.execute(sql`
      SELECT
        d.id AS debt_id,
        d.title AS debt_title,
        i.id,
        i.number,
        i.due_date,
        i.expected_total,
        i.status
      FROM installments i
      JOIN debts d ON d.id = i.debt_id
      WHERE d.user_id = ${userId}
        AND (i.status = 'pending' OR i.status = 'partially_paid')
      ORDER BY i.due_date ASC
      LIMIT ${upcomingLimit}
    `)

        return {
            kpis: {
                totalExpected: globals?.totalExpected ? Number(globals.totalExpected) : 0,
                totalPaid: globals?.totalPaid ? Number(globals.totalPaid) : 0,
                remainingPrincipal,
                overdueCount: Number(globals?.overdueCount ?? 0),
                paidBreakdown: {
                    principal: globals?.principalPaid ? Number(globals.principalPaid) : 0,
                    interest: globals?.interestPaid ? Number(globals.interestPaid) : 0,
                    fees: globals?.feesPaid ? Number(globals.feesPaid) : 0
                }
            },
            debts: debtsAgg,
            upcomingDues: (upcoming as any[]).map(u => ({
                debtId: Number(u.debt_id),
                debtTitle: u.debt_title as string,
                id: Number(u.id),
                number: Number(u.number),
                dueDate: u.due_date,
                expectedTotal: Number(u.expected_total ?? 0),
                status: u.status
            }))
        }
    }, {
        query: t.Object({
            limitDebts: t.Optional(t.Numeric()),
            upcomingLimit: t.Optional(t.Numeric())
        })
    })
