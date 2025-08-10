import { Elysia, t } from 'elysia'
import { z } from 'zod'
import { db } from '../db/client'
import { debts } from '../db/schema'
import { authMiddleware } from '../middlewares/auth'
import { eq, and } from 'drizzle-orm'

const CreateDebtSchema = z.object({
    title: z.string().min(1).max(120),
    principal: z.number().positive(),
    interestRateYear: z.number().min(0).max(1),
    startDate: z.string().datetime()
})

export const debtRoutes = new Elysia({ prefix: '/debts' })
    .use(authMiddleware)

    .post('/', async ({ body, userId, set }) => {
        const parsed = CreateDebtSchema.safeParse(body)
        if (!parsed.success) {
            set.status = 400
            return { error: 'Invalid payload', details: parsed.error.flatten() }
        }
        const { title, principal, interestRateYear, startDate } = parsed.data
        const [row] = await db.insert(debts).values({
            userId,
            title,
            principal: principal.toString(),
            interestRateYear: interestRateYear.toString(),
            startDate: new Date(startDate)
        }).returning()
        return { debt: row }
    }, {
        body: t.Object({
            title: t.String(),
            principal: t.Number(),
            interestRateYear: t.Number(),
            startDate: t.String()
        })
    })

    .get('/', async ({ userId }) => {
        // list only user's debts
        const rows = await db.select().from(debts).where(eq(debts.userId, userId))
        return { debts: rows }
    })
