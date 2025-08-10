// apps/back/src/routes/payments.ts
import { Elysia, t } from 'elysia'
import { z } from 'zod'
import { db } from '../db/client'
import { debts, installments, paymentEvents } from '../db/schema'
import { authMiddleware } from '../middlewares/auth'
import { and, eq } from 'drizzle-orm'
import { reconcileDebt } from '../services/reconcile'

const PaymentSchema = z.object({
    debtId: z.number().int().positive(),
    installmentId: z.number().int().positive().optional(),
    amount: z.number().positive(),
    paidAt: z.string().datetime().optional(),
    isExtraAmortization: z.boolean().default(false),
    note: z.string().max(300).optional()
})

export const paymentRoutes = new Elysia({ prefix: '/payments' })
    .use(authMiddleware)
    .post('/', async ({ body, userId, set }) => {
        const parsed = PaymentSchema.safeParse(body)
        if (!parsed.success) { set.status = 400; return { error: 'Invalid payload', details: parsed.error.flatten() } }
        const p = parsed.data

        // ownership
        const [d] = await db.select().from(debts).where(and(eq(debts.id, p.debtId), eq(debts.userId, userId)))
        if (!d) { set.status = 403; return { error: 'Forbidden' } }

        // Optional: validate installment ownership
        if (p.installmentId) {
            const [inst] = await db.select().from(installments).where(and(eq(installments.id, p.installmentId), eq(installments.debtId, p.debtId)))
            if (!inst) { set.status = 400; return { error: 'Invalid installmentId for this debt' } }
        }

        const [event] = await db.insert(paymentEvents).values({
            debtId: p.debtId,
            installmentId: p.installmentId,
            amount: p.amount.toFixed(2),
            paidAt: p.paidAt ? new Date(p.paidAt) : new Date(),
            isExtraAmortization: p.isExtraAmortization,
            note: p.note
        }).returning()

        // Reconcile/rebuild aggregates
        const result = await reconcileDebt(p.debtId)

        return { payment: event, reconcile: result }
    }, {
        body: t.Object({
            debtId: t.Number(),
            installmentId: t.Optional(t.Number()),
            amount: t.Number(),
            paidAt: t.Optional(t.String()),
            isExtraAmortization: t.Optional(t.Boolean()),
            note: t.Optional(t.String())
        })
    })
