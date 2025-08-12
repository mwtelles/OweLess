import { Elysia } from 'elysia'
import { db } from '../db/client'
import { debts, installments } from '../db/schema'
import { authMiddleware } from '../middlewares/auth'
import { and, eq, asc, desc, sql } from 'drizzle-orm'

export const debtSummaryRoutes = new Elysia({ prefix: '/debts' })
    .use(authMiddleware)
    .get('/:id/summary', async ({ params, userId, set }) => {
        const id = Number(params.id)
        if (!id) { set.status = 400; return { error: 'Invalid id' } }

        const [d] = await db
            .select()
            .from(debts)
            .where(and(eq(debts.id, id), eq(debts.userId, userId)))
            .limit(1)

        if (!d) { set.status = 404; return { error: 'Debt not found' } }

        const [aggr] = await db
            .select({
                totalExpected: sql<number>`COALESCE(SUM(${installments.expectedTotal}), 0)`,
                totalPaid: sql<number>`COALESCE(SUM(${installments.paidTotal}), 0)`,
                interestPaid: sql<number>`COALESCE(SUM(${installments.paidInterest}), 0)`,
                feesPaid: sql<number>`COALESCE(SUM(${installments.paidFees}), 0)`,
                principalPaid: sql<number>`COALESCE(SUM(${installments.paidPrincipal}), 0)`,
                overdueCount: sql<number>`COALESCE(SUM(CASE WHEN ${installments.status} = 'overdue' THEN 1 ELSE 0 END), 0)`
            })
            .from(installments)
            .where(eq(installments.debtId, id))

        const nextRows = await db
            .select({
                id: installments.id,
                number: installments.number,
                dueDate: installments.dueDate,
                expectedTotal: installments.expectedTotal,
                status: installments.status
            })
            .from(installments)
            .where(and(
                eq(installments.debtId, id),
                sql`(${installments.status} = 'pending' OR ${installments.status} = 'partially_paid')`
            ))
            .orderBy(asc(installments.dueDate), asc(installments.number))
            .limit(1)

        const [lastRem] = await db
            .select({ rem: installments.remainingPrincipalAfter })
            .from(installments)
            .where(eq(installments.debtId, id))
            .orderBy(desc(installments.number))
            .limit(1)

        const remainingPrincipal = lastRem?.rem ?? d.principal

        return {
            debt: {
                id: d.id,
                title: d.title,
                type: d.type,
                principal: Number(d.principal),
                rateType: d.rateType,
                nominalRate: d.nominalRate ? Number(d.nominalRate) : null,
                amortizationSystem: d.amortizationSystem,
                termMonths: d.termMonths,
                startDate: d.startDate,
                monthlyFees: Number(d.monthlyFees)
            },
            kpis: {
                totalExpected: Number(aggr.totalExpected ?? 0),
                totalPaid: Number(aggr.totalPaid ?? 0),
                interestPaid: Number(aggr.interestPaid ?? 0),
                feesPaid: Number(aggr.feesPaid ?? 0),
                principalPaid: Number(aggr.principalPaid ?? 0),
                remainingPrincipal: Number(remainingPrincipal ?? 0),
                overdueCount: Number(aggr.overdueCount ?? 0),
                nextDue: nextRows[0] ?? null
            }
        }
    })
