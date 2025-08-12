import Decimal from 'decimal.js-light'
import { addMonths } from 'date-fns'               // OK, vamos tomar cuidado com UTC
import { lastDayOfMonth } from 'date-fns'          // para “clamp” do dia do mês

type BuildScheduleInput = {
    principal: Decimal
    nominalRateYear?: Decimal
    nominalRateMonth?: Decimal
    spreadRate?: Decimal
    amortizationSystem: 'PRICE' | 'SAC'
    monthlyFees: Decimal
    termMonths: number
    startDate: Date              // esperado em qualquer tz, normalizaremos para UTC
    paymentDay?: number
    graceMonths: number
    getMonthlyRate?: (dueDate: Date) => Decimal
}

export type InstallmentCalc = {
    number: number
    dueDate: Date                // sempre UTC 12:00:00 para evitar shift
    interest: Decimal
    principal: Decimal
    fees: Decimal
    total: Decimal
    remainingAfter: Decimal
}

// (1 + r_year)^(1/12) - 1
const toMonthlyRate = (yearRate: Decimal) =>
    new Decimal(1).plus(yearRate).pow(new Decimal(1).div(12)).minus(1)

// helper: cria um Date em UTC às 12:00:00 (evita problemas de DST)
function makeUtcDate(year: number, month0: number, day: number) {
    return new Date(Date.UTC(year, month0, day, 12, 0, 0, 0))
}

// helper: adiciona meses mantendo UTC e fixando horário
function addMonthsUtc(d: Date, months: number) {
    // usa campos UTC para evitar conversões locais
    const y = d.getUTCFullYear()
    const m = d.getUTCMonth()
    const target = new Date(Date.UTC(y, m + months, 1, 12, 0, 0, 0))
    const last = lastDayOfMonth(target).getUTCDate()
    const day = Math.min(d.getUTCDate(), last)
    return makeUtcDate(target.getUTCFullYear(), target.getUTCMonth(), day)
}

export function buildSchedule(input: BuildScheduleInput): InstallmentCalc[] {
    const {
        principal,
        amortizationSystem,
        monthlyFees,
        termMonths,
        startDate,
        paymentDay,                     // usamos se vier, senão o dia “real” do start
        graceMonths,
    } = input

    // normaliza o start para UTC 12:00 (fixo)
    const startUTC = makeUtcDate(
        startDate.getUTCFullYear(),
        startDate.getUTCMonth(),
        startDate.getUTCDate()
    )

    let balance = principal
    const rows: InstallmentCalc[] = []

    // dia desejado
    const desiredDay = paymentDay ?? startUTC.getUTCDate()

    // 1º vencimento = mês seguinte ao start, usando desiredDay “clampado” ao fim do mês
    const nextMonth = addMonthsUtc(startUTC, 1)
    const lastDay = lastDayOfMonth(nextMonth).getUTCDate()
    const firstDue = makeUtcDate(
        nextMonth.getUTCFullYear(),
        nextMonth.getUTCMonth(),
        Math.min(desiredDay, lastDay)
    )

    for (let n = 1; n <= termMonths; n++) {
        const dueDate = n === 1 ? firstDue : addMonthsUtc(firstDue, n - 1)

        // taxa mensal do período
        let iMonth: Decimal
        if (input.getMonthlyRate) iMonth = input.getMonthlyRate(dueDate)
        else if (input.nominalRateMonth) iMonth = input.nominalRateMonth
        else if (input.nominalRateYear) iMonth = toMonthlyRate(input.nominalRateYear)
        else iMonth = new Decimal(0)

        const inGrace = n <= graceMonths

        const interest = balance.times(iMonth)

        let principalPart = new Decimal(0)
        let total: Decimal

        if (amortizationSystem === 'SAC') {
            const amortBase = principal.div(termMonths)
            principalPart = inGrace ? new Decimal(0) : amortBase
            total = principalPart.plus(interest).plus(monthlyFees)
        } else {
            // PRICE
            const i = iMonth
            let annuity: Decimal
            if (i.isZero()) {
                annuity = principal.div(termMonths)
            } else {
                const onePlusI = new Decimal(1).plus(i)
                annuity = principal.times(i).div(new Decimal(1).minus(onePlusI.pow(-termMonths)))
            }
            principalPart = inGrace ? new Decimal(0) : annuity.minus(interest)
            if (principalPart.isNegative()) principalPart = new Decimal(0)
            total = (inGrace ? interest : annuity).plus(monthlyFees)
        }

        let remainingAfter = balance.minus(principalPart)
        if (remainingAfter.isNegative()) remainingAfter = new Decimal(0)

        rows.push({
            number: n,
            dueDate, // sempre UTC 12:00
            interest: interest.todp(2),
            principal: principalPart.todp(2),
            fees: monthlyFees.todp(2),
            total: total.todp(2),
            remainingAfter: remainingAfter.todp(2),
        })

        balance = remainingAfter
    }

    return rows
}
