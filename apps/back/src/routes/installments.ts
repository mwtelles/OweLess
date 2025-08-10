import { Elysia, t } from 'elysia'
import { z } from 'zod'
import { db } from '../db/client'
import { installments, debts } from '../db/schema'
import { authMiddleware } from '../middlewares/auth'
import { eq, and } from 'drizzle-orm'

const CreateInstallmentSchema = z.object({
    debtId: z.number().int().positive(),
    dueDate: z.string().datetime(),
    amount: z.number().positive()
})

export const installmentRoutes = new Elysia({ prefix: '/installments' })
    .use(authMiddleware)

    .post('/', async ({ body, userId, set }) => {
        const parsed = CreateInstallmentSchema.safeParse(body)
        if (!parsed.success) {
            set.status = 400
            return { error: 'Invalid payload', details: parsed.error.flatten() }
        }
        const { debtId, dueDate, amount } = parsed.data

        // ownership check: debt must belong to user
        const [ownerDebt] = await db.select().from(debts).where(and(eq(debts.id, debtId), eq(debts.userId, userId)))
        if (!ownerDebt) {
            set.status = 403
            return { error: 'Forbidden: debt not found or not owned by user' }
        }

        const [row] = await db.insert(installments).values({
            debtId,
            dueDate: new Date(dueDate),
            amount: amount.toString()
        }).returning()
        return { installment: row }
    }, {
        body: t.Object({
            debtId: t.Number(),
            dueDate: t.String(),
            amount: t.Number()
        })
    })

    .get('/', async ({ query, userId, set }) => {
        // require debtId to list, and check ownership
        const debtId = Number((query as any)?.debtId ?? 0)
        if (!debtId) {
            set.status = 400
            return { error: 'Missing query param: debtId' }
        }
        const [ownerDebt] = await db.select().from(debts).where(and(eq(debts.id, debtId), eq(debts.userId, userId)))
        if (!ownerDebt) {
            set.status = 403
            return { error: 'Forbidden: debt not found or not owned by user' }
        }
        const rows = await db.select().from(installments).where(eq(installments.debtId, debtId))
        return { installments: rows }
    })
