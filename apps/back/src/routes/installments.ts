import { Elysia, t } from 'elysia'
import { z } from 'zod'
import { db } from '../db/client'
import { installments, debts } from '../db/schema'
import { authMiddleware } from '../middlewares/auth'
import { and, eq, desc, asc, sql, inArray } from 'drizzle-orm'

// Filtro de status aceitos (mesmo enum do schema)
const StatusEnum = z.enum(['pending', 'paid', 'overdue', 'partially_paid'])

const ListQuerySchema = z.object({
    debtId: z.coerce.number().int().positive(),
    status: z.preprocess((v) => (Array.isArray(v) ? v : v ? [v] : []), z.array(StatusEnum)).optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(200).default(50),
    order: z.enum(['asc', 'desc']).default('asc')
})

const PatchInstallmentSchema = z.object({
    status: StatusEnum.optional(),
    // campos pagos são numéricos; mandamos como number e gravamos como string (numeric)
    paidInterest: z.number().min(0).optional(),
    paidPrincipal: z.number().min(0).optional(),
    paidFees: z.number().min(0).optional(),
    paidTotal: z.number().min(0).optional()
})

export const installmentRoutes = new Elysia({ prefix: '/installments' })
    .use(authMiddleware)

    // LIST with filters + pagination + totals
    .get('/', async ({ query, userId, set }) => {
        const parsed = ListQuerySchema.safeParse(query)
        if (!parsed.success) {
            set.status = 400
            return { error: 'Invalid query', details: parsed.error.flatten() }
        }
        const { debtId, status, page, pageSize, order } = parsed.data

        // ownership check
        const [ownerDebt] = await db.select().from(debts)
            .where(and(eq(debts.id, debtId), eq(debts.userId, userId)))
            .limit(1)
        if (!ownerDebt) {
            set.status = 403
            return { error: 'Forbidden: debt not found or not owned by user' }
        }

        // where clause
        const whereClauses = [eq(installments.debtId, debtId)]
        if (status && status.length) {
            whereClauses.push(inArray(installments.status, status as any))
        }

        // totals (simples): soma de expected/pagos
        const [totals] = await db
            .select({
                count: sql<number>`count(*)`,
                sumExpectedTotal: sql<string | null>`sum(${installments.expectedTotal})`,
                sumPaidTotal: sql<string | null>`sum(${installments.paidTotal})`
            })
            .from(installments)
            .where(and(...whereClauses))

        // pagination
        const offset = (page - 1) * pageSize

        const rows = await db
            .select()
            .from(installments)
            .where(and(...whereClauses))
            .orderBy(order === 'asc' ? asc(installments.number) : desc(installments.number))
            .limit(pageSize)
            .offset(offset)

        return {
            items: rows,
            page,
            pageSize,
            totalItems: Number(totals?.count ?? 0),
            totals: {
                expectedTotal: totals?.sumExpectedTotal ? Number(totals.sumExpectedTotal) : 0,
                paidTotal: totals?.sumPaidTotal ? Number(totals.sumPaidTotal) : 0
            }
        }
    }, {
        query: t.Object({
            debtId: t.Numeric(),
            status: t.Optional(t.Union([t.String(), t.Array(t.String())])),
            page: t.Optional(t.Numeric()),
            pageSize: t.Optional(t.Numeric()),
            order: t.Optional(t.Union([t.Literal('asc'), t.Literal('desc')]))
        })
    })

    // DETAIL
    .get('/:id', async ({ params, userId, set }) => {
        const id = Number(params.id)
        if (!id) { set.status = 400; return { error: 'Invalid id' } }

        const [row] = await db.select().from(installments).where(eq(installments.id, id))
        if (!row) { set.status = 404; return { error: 'Installment not found' } }

        // ownership via debt
        const [ownerDebt] = await db.select().from(debts)
            .where(and(eq(debts.id, row.debtId), eq(debts.userId, userId)))
            .limit(1)
        if (!ownerDebt) { set.status = 403; return { error: 'Forbidden' } }

        return { installment: row }
    })

    // ADMIN/PATCH (opcional): atualizar status/valores pagos (ajuste manual)
    // Observação: pagamentos normais devem ir para /payments.
    .patch('/:id', async ({ params, body, userId, set }) => {
        const id = Number(params.id)
        if (!id) { set.status = 400; return { error: 'Invalid id' } }

        const parsed = PatchInstallmentSchema.safeParse(body)
        if (!parsed.success) {
            set.status = 400
            return { error: 'Invalid payload', details: parsed.error.flatten() }
        }

        const [row] = await db.select().from(installments).where(eq(installments.id, id))
        if (!row) { set.status = 404; return { error: 'Installment not found' } }

        const [ownerDebt] = await db.select().from(debts)
            .where(and(eq(debts.id, row.debtId), eq(debts.userId, userId)))
            .limit(1)
        if (!ownerDebt) { set.status = 403; return { error: 'Forbidden' } }

        const payload: any = {}
        if (parsed.data.status) payload.status = parsed.data.status
        if (parsed.data.paidInterest !== undefined) payload.paidInterest = parsed.data.paidInterest.toFixed(2)
        if (parsed.data.paidPrincipal !== undefined) payload.paidPrincipal = parsed.data.paidPrincipal.toFixed(2)
        if (parsed.data.paidFees !== undefined) payload.paidFees = parsed.data.paidFees.toFixed(2)
        if (parsed.data.paidTotal !== undefined) payload.paidTotal = parsed.data.paidTotal.toFixed(2)

        const [updated] = await db.update(installments).set(payload).where(eq(installments.id, id)).returning()
        return { installment: updated }
    }, {
        body: t.Object({
            status: t.Optional(t.Enum({ pending: 'pending', paid: 'paid', overdue: 'overdue', partially_paid: 'partially_paid' })),
            paidInterest: t.Optional(t.Number()),
            paidPrincipal: t.Optional(t.Number()),
            paidFees: t.Optional(t.Number()),
            paidTotal: t.Optional(t.Number())
        })
    })
