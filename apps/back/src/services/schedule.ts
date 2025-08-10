import Decimal from 'decimal.js-light'
import { addMonths, set } from 'date-fns'

type BuildScheduleInput = {
    principal: Decimal
    nominalRateYear?: Decimal        // fixed per year
    nominalRateMonth?: Decimal       // fixed per month
    spreadRate?: Decimal             // (for indexed; not used here yet)
    amortizationSystem: 'PRICE' | 'SAC'
    monthlyFees: Decimal
    termMonths: number
    startDate: Date
    paymentDay?: number
    graceMonths: number              // months paying interest+fees only
    // for indexed: provide a function to get monthly rate per dueDate
    getMonthlyRate?: (dueDate: Date) => Decimal
}

export type InstallmentCalc = {
    number: number
    dueDate: Date
    interest: Decimal
    principal: Decimal
    fees: Decimal
    total: Decimal
    remainingAfter: Decimal
}

// (1 + r_year)^(1/12) - 1
const toMonthlyRate = (yearRate: Decimal) =>
    new Decimal(1).plus(yearRate).pow(new Decimal(1).div(12)).minus(1)

export function buildSchedule(input: BuildScheduleInput): InstallmentCalc[] {
    const {
        principal,
        amortizationSystem,
        monthlyFees,
        termMonths,
        startDate,
        paymentDay = startDate.getUTCDate(),
        graceMonths
    } = input

    let balance = principal
    const rows: InstallmentCalc[] = []

    // 1º vencimento: mês seguinte ao startDate (sem pular a carência)
    // A carência será tratada dentro do loop com (n <= graceMonths)
    const firstDue = set(addMonths(startDate, 1), { date: paymentDay })

    for (let n = 1; n <= termMonths; n++) {
        const dueDate = addMonths(firstDue, n - 1)

        // taxa mensal do período
        let iMonth: Decimal
        if (input.getMonthlyRate) {
            iMonth = input.getMonthlyRate(dueDate)
        } else if (input.nominalRateMonth) {
            iMonth = input.nominalRateMonth
        } else if (input.nominalRateYear) {
            iMonth = toMonthlyRate(input.nominalRateYear)
        } else {
            iMonth = new Decimal(0)
        }

        const inGrace = n <= graceMonths

        // juros do mês sobre o saldo
        let interest = balance.times(iMonth)

        let principalPart = new Decimal(0)
        let total: Decimal

        if (amortizationSystem === 'SAC') {
            const amortBase = principal.div(termMonths) // parcela fixa de principal
            principalPart = inGrace ? new Decimal(0) : amortBase
            total = principalPart.plus(interest).plus(monthlyFees)
        } else {
            // PRICE: PMT = P * i / (1 - (1+i)^-N)
            const i = iMonth
            let annuity: Decimal
            if (i.isZero()) {
                annuity = principal.div(termMonths)
            } else {
                const onePlusI = new Decimal(1).plus(i)
                annuity = principal.times(i).div(new Decimal(1).minus(onePlusI.pow(-termMonths)))
            }
            principalPart = inGrace ? new Decimal(0) : annuity.minus(interest)
            // evita principal negativo por arredondamentos
            if (principalPart.isNegative()) principalPart = new Decimal(0)
            total = (inGrace ? interest : annuity).plus(monthlyFees)
        }

        // saldo remanescente
        let remainingAfter = balance.minus(principalPart)
        if (remainingAfter.isNegative()) remainingAfter = new Decimal(0)

        // arredonda apenas na saída (2 casas)
        rows.push({
            number: n,
            dueDate,
            interest: interest.todp(2),
            principal: principalPart.todp(2),
            fees: monthlyFees.todp(2),
            total: total.todp(2),
            remainingAfter: remainingAfter.todp(2)
        })

        balance = remainingAfter
    }

    return rows
}
