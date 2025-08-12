// src/routes/debt-summary.ts
import { Elysia, t } from 'elysia'
import { db } from '../db/client'
import { debts, installments } from '../db/schema'
import { authMiddleware } from '../middlewares/auth'
import { and, eq, asc, desc, inArray, sql } from 'drizzle-orm'

const IS_PROD = (process.env.NODE_ENV ?? 'development') === 'production'
const DEBUG_SUMMARY = process.env.DEBUG_SUMMARY === 'true'

// Tipo padrão de erro
type ErrorBody = {
    error: {
        code: string
        message: string // PT-BR
        message_en: string // EN
        details?: Record<string, unknown>
        requestId?: string
    }
}

// helper para padronizar erros
function sendError(
    set: any,
    status: number,
    code: string,
    messagePt: string,
    messageEn: string,
    details?: Record<string, unknown>,
    requestId?: string
): ErrorBody {
    set.status = status
    return {
        error: { code, message: messagePt, message_en: messageEn, details, requestId }
    }
}

export const debtSummaryRoutes = new Elysia({ prefix: '/debts' })
    .use(authMiddleware)
    .get(
        '/:id/summary',
        async ({ params, userId, set, request }) => {
            const requestId =
                request.headers.get('x-railway-request-id') ??
                request.headers.get('x-request-id') ??
                undefined

            if (!userId) {
                return sendError(
                    set,
                    401,
                    'UNAUTHORIZED',
                    'Não autorizado.',
                    'Unauthorized.',
                    undefined,
                    requestId
                )
            }

            const rawId = Number(params.id)
            const id = Number.isInteger(rawId) && rawId > 0 ? rawId : NaN
            if (!Number.isFinite(id)) {
                return sendError(
                    set,
                    400,
                    'INVALID_ID',
                    'Parâmetro "id" inválido. Use um inteiro positivo.',
                    'Invalid "id" parameter. Use a positive integer.',
                    { param: params.id },
                    requestId
                )
            }

            try {
                const [d] = await db
                    .select()
                    .from(debts)
                    .where(and(eq(debts.id, id), eq(debts.userId, userId)))
                    .limit(1)

                if (!d) {
                    return sendError(
                        set,
                        404,
                        'DEBT_NOT_FOUND',
                        'Dívida não encontrada para este usuário.',
                        'Debt not found for this user.',
                        { debtId: id },
                        requestId
                    )
                }

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
                    .where(
                        and(
                            eq(installments.debtId, id),
                            inArray(installments.status, ['pending', 'partially_paid'] as const)
                        )
                    )
                    .orderBy(asc(installments.dueDate), asc(installments.number))
                    .limit(1)

                const [lastRem] = await db
                    .select({ rem: installments.remainingPrincipalAfter })
                    .from(installments)
                    .where(eq(installments.debtId, id))
                    .orderBy(desc(installments.number))
                    .limit(1)

                const remainingPrincipal = lastRem?.rem ?? d.principal

                if ((IS_PROD || DEBUG_SUMMARY) && Number(aggr.totalExpected) === 0 && !nextRows[0]) {
                    try {
                        const [cnt] = await db.execute(
                            sql`SELECT COUNT(*)::int AS c FROM ${installments} WHERE ${installments.debtId} = ${id}`
                        )

                        const sample = await db
                            .select({
                                id: installments.id,
                                number: installments.number,
                                status: installments.status,
                                dueDate: installments.dueDate,
                                expectedTotal: installments.expectedTotal
                            })
                            .from(installments)
                            .where(eq(installments.debtId, id))
                            .orderBy(desc(installments.number))
                            .limit(3)

                        console.warn('[SUMMARY DEBUG]', {
                            route: '/debts/:id/summary',
                            requestId,
                            userId,
                            debtId: id,
                            count: Number((cnt as any)?.c ?? 0),
                            sample
                        })

                        if (Number((cnt as any)?.c ?? 0) === 0) {
                            return sendError(
                                set,
                                422,
                                'MISSING_INSTALLMENTS',
                                'Dívida encontrada, porém sem parcelas vinculadas.',
                                'Debt found, but no installments attached.',
                                { debtId: id },
                                requestId
                            )
                        }
                    } catch (e) {
                        console.error('[SUMMARY DEBUG] failed to inspect installments', {
                            route: '/debts/:id/summary',
                            requestId,
                            userId,
                            debtId: id,
                            error: (e as Error).message
                        })
                    }
                }

                set.status = 200
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
            } catch (e) {
                console.error('[SUMMARY ERROR]', {
                    route: '/debts/:id/summary',
                    requestId,
                    userId,
                    debtId: id,
                    error: (e as Error).message
                })

                return sendError(
                    set,
                    500,
                    'INTERNAL_ERROR',
                    'Erro interno ao calcular o resumo da dívida.',
                    'Internal error while computing debt summary.',
                    undefined,
                    requestId
                )
            }
        },
        {
            params: t.Object({ id: t.String() })
        }
    )
