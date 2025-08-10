// apps/back/src/services/reconcile.ts
import Decimal from 'decimal.js-light'
import { db } from '../db/client'
import { debts, installments, paymentEvents } from '../db/schema'
import { and, eq, asc } from 'drizzle-orm'

type InstallmentRow = typeof installments.$inferSelect
type PaymentRow = typeof paymentEvents.$inferSelect
type DebtRow = typeof debts.$inferSelect

export type ReconcileResult = {
    updatedCount: number
    remainingPrincipal: string
}

function toDec(x: string | number | null | undefined) {
    if (x === null || x === undefined) return new Decimal(0)
    return new Decimal(x as any)
}

export async function reconcileDebt(debtId: number): Promise<ReconcileResult> {
    // Load data
    const [debt] = await db.select().from(debts).where(eq(debts.id, debtId)).limit(1)
    if (!debt) throw new Error('Debt not found')

    const rows = await db
        .select()
        .from(installments)
        .where(eq(installments.debtId, debtId))
        .orderBy(asc(installments.number))

    const events = await db
        .select()
        .from(paymentEvents)
        .where(eq(paymentEvents.debtId, debtId))
        .orderBy(asc(paymentEvents.paidAt), asc(paymentEvents.id))

    // Start from the planned schedule
    let balance = toDec(debt.principal)
    let updatedCount = 0

    // Reset paid aggregates before recompute (optional: only future? here we reset all)
    // (You could optimize with diffing; for clarity we recompute.)
    for (const inst of rows) {
        inst.paidInterest = '0'
        inst.paidPrincipal = '0'
        inst.paidFees = '0'
        inst.paidTotal = '0'
        inst.status = 'pending'
        // remainingPrincipalAfter will be recomputed
    }

    // Helper to update a single installment paid fields (in-memory)
    function addToInstallment(inst: InstallmentRow, key: 'paidFees' | 'paidInterest' | 'paidPrincipal', amt: Decimal) {
        const prev = toDec(inst[key])
        const next = prev.plus(amt).todp(2)
        inst[key] = next.toString()
        const pTot = toDec(inst.paidTotal).plus(amt).todp(2)
        inst.paidTotal = pTot.toString()
    }

    // Find next pending installment index
    function findNextPending(startIdx = 0) {
        for (let i = startIdx; i < rows.length; i++) {
            if (rows[i].status === 'pending' || rows[i].status === 'partially_paid' || rows[i].status === 'overdue') {
                return i
            }
        }
        return -1
    }

    // Allocate event amount against an installment (fees->interest->principal)
    function allocateAgainstInstallment(inst: InstallmentRow, amount: Decimal): Decimal {
        let remaining = amount

        // Fees
        const needFees = toDec(inst.expectedFees).minus(toDec(inst.paidFees))
        if (needFees.gt(0) && remaining.gt(0)) {
            const take = needFees.lt(remaining) ? needFees : remaining
            addToInstallment(inst, 'paidFees', take)
            remaining = remaining.minus(take)
        }

        // Interest
        const needInt = toDec(inst.expectedInterest).minus(toDec(inst.paidInterest))
        if (needInt.gt(0) && remaining.gt(0)) {
            const take = needInt.lt(remaining) ? needInt : remaining
            addToInstallment(inst, 'paidInterest', take)
            remaining = remaining.minus(take)
        }

        // Principal
        const needPrin = toDec(inst.expectedPrincipal).minus(toDec(inst.paidPrincipal))
        if (needPrin.gt(0) && remaining.gt(0)) {
            const take = needPrin.lt(remaining) ? needPrin : remaining
            addToInstallment(inst, 'paidPrincipal', take)
            remaining = remaining.minus(take)
        }

        // Update status
        const fullyPaid =
            toDec(inst.paidFees).gte(toDec(inst.expectedFees)) &&
            toDec(inst.paidInterest).gte(toDec(inst.expectedInterest)) &&
            toDec(inst.paidPrincipal).gte(toDec(inst.expectedPrincipal))

        inst.status = fullyPaid
            ? 'paid'
            : toDec(inst.paidTotal).gt(0)
                ? 'partially_paid'
                : inst.status // keep pending/overdue (overdue rule could be time-based elsewhere)

        return remaining
    }

    // Apply events
    let idx = 0
    for (const ev of events) {
        let amount = toDec(ev.amount)

        if (ev.installmentId) {
            const instIndex = rows.findIndex(r => r.id === ev.installmentId)
            if (instIndex >= 0) {
                amount = allocateAgainstInstallment(rows[instIndex], amount)
                // If extra amortization has leftover, reduce balance directly
                if (ev.isExtraAmortization && amount.gt(0)) {
                    balance = balance.minus(amount)
                    if (balance.lt(0)) balance = new Decimal(0)

                    amount = new Decimal(0)
                }
            } else {
                // fallback to next pending if not found
                idx = Math.max(0, findNextPending(idx))
            }
        }

        // If no installmentId or leftover amount, allocate sequentially
        while (amount.gt(0)) {
            if (idx < 0) idx = 0
            if (idx >= rows.length) {
                // nothing else to allocate to; if extra amortization, reduce balance
                if (ev.isExtraAmortization) {
                    balance = balance.minus(amount)
                    if (balance.lt(0)) balance = new Decimal(0)

                }
                amount = new Decimal(0)
                break
            }
            amount = allocateAgainstInstallment(rows[idx], amount)
            // Move to next if current is fully paid
            const inst = rows[idx]
            const fullyPaid =
                toDec(inst.paidFees).gte(toDec(inst.expectedFees)) &&
                toDec(inst.paidInterest).gte(toDec(inst.expectedInterest)) &&
                toDec(inst.paidPrincipal).gte(toDec(inst.expectedPrincipal))
            if (fullyPaid) idx++
            else break
        }

        // Extra amortization leftover already handled above
    }

    // Recompute remainingPrincipalAfter by rolling over principal paid
    let rollingBalance = toDec(debt.principal)
    for (const inst of rows) {
        const prinPaid = toDec(inst.paidPrincipal)
        // planned principal for status, but remaining should use planned - paid?
        const plannedPrin = toDec(inst.expectedPrincipal)
        // remaining after this installment (planned schedule baseline minus actual paid principal)
        rollingBalance = rollingBalance.minus(prinPaid)
        if (rollingBalance.lt(0)) rollingBalance = new Decimal(0)
        inst.remainingPrincipalAfter = rollingBalance.todp(2).toString()
    }

    // Persist updates (batch)
    for (const r of rows) {
        await db.update(installments)
            .set({
                paidInterest: r.paidInterest,
                paidPrincipal: r.paidPrincipal,
                paidFees: r.paidFees,
                paidTotal: r.paidTotal,
                status: r.status,
                remainingPrincipalAfter: r.remainingPrincipalAfter
            })
            .where(eq(installments.id, r.id))
        updatedCount++
    }

    return { updatedCount, remainingPrincipal: rollingBalance.todp(2).toString() }
}
