import { Elysia, t } from 'elysia'
import { z } from 'zod'
import Decimal from 'decimal.js-light'
import { db } from '../db/client'
import { debts, installments } from '../db/schema'
import { authMiddleware } from '../middlewares/auth'
import { buildSchedule } from '../services/schedule'
import { eq, and } from 'drizzle-orm'

const CreateDebtSchema = z.object({
    title: z.string().min(1),
    type: z.enum(['loan', 'financing', 'student', 'credit_card', 'other']).optional(),
    principal: z.number().positive(),
    rateType: z.enum(['fixed_nominal_year', 'fixed_nominal_month', 'indexed_variable']),
    nominalRate: z.number().min(0).optional(),
    spreadRate: z.number().min(0).optional(),
    amortizationSystem: z.enum(['PRICE', 'SAC']),
    termMonths: z.number().int().positive(),
    paymentDay: z.number().int().min(1).max(28).optional(),
    startDate: z.string().datetime(),
    graceMonths: z.number().int().min(0).default(0),
    monthlyFees: z.number().min(0).default(0)
})

export const debtRoutes = new Elysia({ prefix: '/debts' })
    .use(authMiddleware)

    .post('/', async ({ body, userId, set }) => {
        const parsed = CreateDebtSchema.safeParse(body)
        if (!parsed.success) {
            set.status = 400; return { error: 'Invalid payload', details: parsed.error.flatten() }
        }
        const dto = parsed.data

        const [debt] = await db.insert(debts).values({
            userId,
            title: dto.title,
            type: dto.type ?? 'loan',
            principal: dto.principal.toString(),
            rateType: dto.rateType,
            nominalRate: dto.nominalRate?.toString(),
            spreadRate: dto.spreadRate?.toString(),
            amortizationSystem: dto.amortizationSystem,
            termMonths: dto.termMonths,
            paymentDay: dto.paymentDay ?? undefined,
            startDate: new Date(dto.startDate),
            graceMonths: dto.graceMonths,
            monthlyFees: dto.monthlyFees.toString()
        }).returning()

        const schedule = buildSchedule({
            principal: new Decimal(dto.principal),
            amortizationSystem: dto.amortizationSystem,
            monthlyFees: new Decimal(dto.monthlyFees),
            termMonths: dto.termMonths,
            startDate: new Date(dto.startDate),
            paymentDay: dto.paymentDay ?? undefined,
            graceMonths: dto.graceMonths,
            nominalRateYear: dto.rateType === 'fixed_nominal_year' && dto.nominalRate !== undefined
                ? new Decimal(dto.nominalRate) : undefined,
            nominalRateMonth: dto.rateType === 'fixed_nominal_month' && dto.nominalRate !== undefined
                ? new Decimal(dto.nominalRate) : undefined
            // indexed_variable: futuro -> getMonthlyRate por dueDate
        })

        await db.insert(installments).values(schedule.map(r => ({
            debtId: debt.id,
            number: r.number,
            dueDate: r.dueDate,
            expectedInterest: r.interest.toString(),
            expectedPrincipal: r.principal.toString(),
            expectedFees: r.fees.toString(),
            expectedTotal: r.total.toString(),
            remainingPrincipalAfter: r.remainingAfter.toString()
        })))

        return { debt }
    }, {
        body: t.Object({
            title: t.String(),
            principal: t.Number(),
            rateType: t.Enum({
                fixed_nominal_year: 'fixed_nominal_year',
                fixed_nominal_month: 'fixed_nominal_month',
                indexed_variable: 'indexed_variable'
            }),
            nominalRate: t.Optional(t.Number()),
            spreadRate: t.Optional(t.Number()),
            amortizationSystem: t.Enum({ PRICE: 'PRICE', SAC: 'SAC' }),
            termMonths: t.Number(),
            paymentDay: t.Optional(t.Number()),
            startDate: t.String(),
            graceMonths: t.Optional(t.Number()),
            monthlyFees: t.Optional(t.Number())
        })
    })

    .get('/', async ({ userId }) => {
        const rows = await db.select().from(debts).where(eq(debts.userId, userId))
        // (opcional) somar pagos/abertos com queries adicionais
        return { debts: rows }
    })

    .delete('/:id', async ({ params, userId, set }) => {
        const debtId = Number(params.id);
        if (!Number.isFinite(debtId)) {
            set.status = 400;
            return { error: 'Invalid debt id' };
        }

        const found = await db.select({ id: debts.id })
            .from(debts)
            .where(and(eq(debts.id, debtId), eq(debts.userId, userId)))
            .then(rows => rows[0]);

        if (!found) {
            set.status = 404;
            return {
                error: 'Debt not found for this user',
                code: 'DEBT_NOT_FOUND'
            };
        }

        await db.delete(debts).where(and(eq(debts.id, debtId), eq(debts.userId, userId)));

        set.status = 204;
        return null;
    }, {
        params: t.Object({ id: t.Numeric() })
    });