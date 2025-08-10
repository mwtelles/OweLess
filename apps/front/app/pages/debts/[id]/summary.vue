<script setup lang="ts">
definePageMeta({ middleware: 'auth-client' })

import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import Toast from 'primevue/toast'
import Card from 'primevue/card'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Chart from 'primevue/chart'

type Debt = {
    id: number
    title: string
    type: 'loan' | 'financing' | 'student' | 'credit_card' | 'other'
    principal: number | string
    rateType: 'fixed_nominal_year' | 'fixed_nominal_month' | 'indexed_variable'
    nominalRate?: number | string | null
    amortizationSystem: 'PRICE' | 'SAC'
    termMonths: number
    startDate: string
    monthlyFees: number | string
}
type NextDue = {
    id: number
    number: number
    dueDate: string
    expectedTotal: number | string
    status: 'pending' | 'partially_paid' | 'paid' | 'overdue'
}
type SummaryResp = {
    debt: Debt
    kpis: {
        totalExpected: number
        totalPaid: number
        interestPaid: number
        feesPaid: number
        principalPaid: number
        remainingPrincipal: number
        overdueCount: number
        nextDue: NextDue | null
    }
}
type Installment = {
    id: number
    number: number
    dueDate: string
    expectedInterest: number | string
    expectedPrincipal: number | string
    expectedFees: number | string
    expectedTotal: number | string
    paidTotal: number | string
    remainingPrincipalAfter: number | string
    status: 'pending' | 'paid' | 'overdue' | 'partially_paid'
}

const route = useRoute()
const debtId = Number(route.params.id)
const { $api, $t } = useNuxtApp()
const toast = useToast()

const loading = ref(false)
const data = ref<SummaryResp | null>(null)
const installments = ref<Installment[]>([])

// charts
const chRemaining = ref<any>(null)
const chPaidExpected = ref<any>(null)
const chIP = ref<any>(null)
const chOptions = ref<any>({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: { position: 'top' },
        tooltip: { mode: 'index', intersect: false }
    },
    scales: { x: { ticks: { autoSkip: true } }, y: { beginAtZero: true } }
})

const fmtMoney = (v: any) => {
    const n = typeof v === 'number' ? v : parseFloat(v ?? 0)
    return n.toLocaleString(undefined, { style: 'currency', currency: 'USD' })
}
const fmtPct = (num: number, den: number) => {
    if (!den || den <= 0) return '0%'
    const p = (num / den) * 100
    return `${p.toFixed(1)}%`
}
const paidPct = computed(() => {
    const k = data.value?.kpis
    return k ? fmtPct(k.totalPaid, k.totalExpected) : '0%'
})

async function loadSummary() {
    const res = await $api.get(`/debts/${debtId}/summary`)
    const body = res.data as SummaryResp
    // normalize
    body.debt.principal = Number(body.debt.principal)
    body.debt.monthlyFees = Number(body.debt.monthlyFees)
    if (body.debt.nominalRate != null) body.debt.nominalRate = Number(body.debt.nominalRate)
    if (body.kpis.nextDue && typeof body.kpis.nextDue.expectedTotal === 'string') {
        body.kpis.nextDue.expectedTotal = Number(body.kpis.nextDue.expectedTotal)
    }
    data.value = body
}

async function loadInstallmentsForCharts() {
    // pega bastante para cobrir a série inteira
    const res = await $api.get('/installments', { params: { debtId, page: 1, pageSize: 200, order: 'asc' } })
    const items = (res.data?.items ?? []) as Installment[]
    installments.value = items.map((i) => ({
        ...i,
        expectedInterest: num(i.expectedInterest),
        expectedPrincipal: num(i.expectedPrincipal),
        expectedFees: num(i.expectedFees),
        expectedTotal: num(i.expectedTotal),
        paidTotal: num(i.paidTotal),
        remainingPrincipalAfter: num(i.remainingPrincipalAfter)
    }))
}

function num(v: any) {
    if (typeof v === 'number') return v
    if (typeof v === 'string') return parseFloat(v)
    return 0
}

function prepareCharts() {
    const labs = installments.value.map(i => `#${i.number}`)

    // 1) Remaining Principal
    const remaining = installments.value.map(i => num(i.remainingPrincipalAfter))
    chRemaining.value = {
        labels: labs,
        datasets: [
            { label: 'Remaining Principal', data: remaining, fill: false, tension: 0.2 }
        ]
    }

    // 2) Expected vs Paid (cumulative)
    let cumExpected = 0
    let cumPaid = 0
    const seriesExpected: number[] = []
    const seriesPaid: number[] = []
    installments.value.forEach(i => {
        cumExpected += num(i.expectedTotal)
        cumPaid += num(i.paidTotal)
        seriesExpected.push(cumExpected)
        seriesPaid.push(cumPaid)
    })
    chPaidExpected.value = {
        labels: labs,
        datasets: [
            { label: 'Expected (cum.)', data: seriesExpected, fill: false, tension: 0.2 },
            { label: 'Paid (cum.)', data: seriesPaid, fill: false, tension: 0.2 }
        ]
    }

    // 3) Interest vs Principal (stacked bars) — recorte as primeiras 24 parcelas p/ leitura
    const slice = installments.value.slice(0, 24)
    const labsIP = slice.map(i => `#${i.number}`)
    const seriesInt = slice.map(i => num(i.expectedInterest))
    const seriesPrin = slice.map(i => num(i.expectedPrincipal))
    chIP.value = {
        labels: labsIP,
        datasets: [
            { type: 'bar', label: 'Interest', data: seriesInt, stack: 'ip' },
            { type: 'bar', label: 'Principal', data: seriesPrin, stack: 'ip' }
        ]
    }
}

function toInstallments() { navigateTo(`/debts/${debtId}/installments`) }
function back() { navigateTo('/debts') }

onMounted(async () => {
    const t = toast
    try {
        loading.value = true
        await loadSummary()
        await loadInstallmentsForCharts()
        prepareCharts()
    } catch (e: any) {
        t.add({ severity: 'error', summary: 'Summary', detail: e?.response?.data?.error || 'Failed to load data' })
    } finally {
        loading.value = false
    }
})
</script>

<template>
    <div class="page">
        <Toast />
        <header class="page-header">
            <h1>Debt Summary #{{ debtId }}</h1>
            <div class="actions">
                <Button label="Installments" @click="toInstallments" />
                <Button :label="$t('common.back')" severity="secondary" @click="back" />
            </div>
        </header>

        <div v-if="loading">Loading...</div>
        <div v-else-if="!data">No data</div>
        <div v-else class="grid">
            <!-- Debt info -->
            <Card class="card span-2">
                <template #title>{{ data.debt.title }}</template>
                <template #subtitle>
                    {{ data.debt.type.toUpperCase() }} • {{ data.debt.amortizationSystem }} • Term: {{
                        data.debt.termMonths }} mo
                </template>
                <template #content>
                    <div class="info-grid">
                        <div>
                            <div class="label">Principal</div>
                            <div class="value">{{ fmtMoney(data.debt.principal) }}</div>
                        </div>
                        <div>
                            <div class="label">Rate type</div>
                            <div class="value">{{ data.debt.rateType }}</div>
                        </div>
                        <div v-if="data.debt.nominalRate != null">
                            <div class="label">Nominal rate</div>
                            <div class="value">{{ (Number(data.debt.nominalRate) * 100).toFixed(2) }}%</div>
                        </div>
                        <div>
                            <div class="label">Monthly fees</div>
                            <div class="value">{{ fmtMoney(data.debt.monthlyFees) }}</div>
                        </div>
                        <div>
                            <div class="label">Start date</div>
                            <div class="value">{{ new Date(data.debt.startDate).toLocaleDateString() }}</div>
                        </div>
                    </div>
                </template>
            </Card>

            <!-- KPIs -->
            <Card class="card">
                <template #title>Total Expected</template>
                <template #content>
                    <div class="kpi">{{ fmtMoney(data.kpis.totalExpected) }}</div>
                </template>
            </Card>

            <Card class="card">
                <template #title>Total Paid</template>
                <template #content>
                    <div class="kpi">{{ fmtMoney(data.kpis.totalPaid) }}</div>
                    <div class="muted">{{ paidPct }} of expected</div>
                </template>
            </Card>

            <Card class="card">
                <template #title>Remaining Principal</template>
                <template #content>
                    <div class="kpi">{{ fmtMoney(data.kpis.remainingPrincipal) }}</div>
                </template>
            </Card>

            <Card class="card">
                <template #title>Overdue Count</template>
                <template #content>
                    <div class="kpi">{{ data.kpis.overdueCount }}</div>
                </template>
            </Card>

            <!-- Next due -->
            <Card class="card span-2" v-if="data.kpis.nextDue">
                <template #title>Next Due</template>
                <template #content>
                    <div class="next-grid">
                        <div>
                            <div class="label">#</div>
                            <div class="value">#{{ data.kpis.nextDue.number }}</div>
                        </div>
                        <div>
                            <div class="label">Due date</div>
                            <div class="value">{{ new Date(data.kpis.nextDue.dueDate).toLocaleDateString() }}</div>
                        </div>
                        <div>
                            <div class="label">Amount</div>
                            <div class="value">{{ fmtMoney(data.kpis.nextDue.expectedTotal) }}</div>
                        </div>
                        <div>
                            <div class="label">Status</div>
                            <div class="value">{{ data.kpis.nextDue.status }}</div>
                        </div>
                    </div>
                    <div class="mt">
                        <Button label="Go pay" @click="toInstallments" />
                    </div>
                </template>
            </Card>

            <!-- Charts -->
            <Card class="card span-2">
                <template #title>Remaining Principal over time</template>
                <template #content>
                    <div class="chart-box">
                        <Chart type="line" :data="chRemaining" :options="chOptions" />
                    </div>
                </template>
            </Card>

            <Card class="card span-2">
                <template #title>Cumulative Expected vs Paid</template>
                <template #content>
                    <div class="chart-box">
                        <Chart type="line" :data="chPaidExpected" :options="chOptions" />
                    </div>
                </template>
            </Card>

            <Card class="card span-2">
                <template #title>Interest vs Principal (first 24)</template>
                <template #content>
                    <div class="chart-box">
                        <Chart type="bar" :data="chIP"
                            :options="{ ...chOptions, scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true } } }" />
                    </div>
                </template>
            </Card>

            <!-- Snapshot table -->
            <Card class="card span-2">
                <template #title>Snapshot</template>
                <template #content>
                    <DataTable :value="[data.kpis]">
                        <Column field="totalExpected" header="Expected"
                            :body="({ data }: { data: any }) => fmtMoney(data.totalExpected)" />
                        <Column field="totalPaid" header="Paid"
                            :body="({ data }: { data: any }) => fmtMoney(data.totalPaid)" />
                        <Column field="remainingPrincipal" header="Remaining"
                            :body="({ data }: { data: any }) => fmtMoney(data.remainingPrincipal)" />
                        <Column field="overdueCount" header="Overdue"
                            :body="({ data }: { data: any }) => data.overdueCount" />
                    </DataTable>
                </template>
            </Card>
        </div>
    </div>
</template>

<style scoped>
.page {
    max-width: 1100px;
    margin: 0 auto;
    padding: 1rem;
}

.page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;
}

.actions {
    display: flex;
    gap: .5rem;
}

.grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1rem;
}

.card {
    width: 100%;
}

.span-2 {
    grid-column: span 2;
}

.info-grid,
.next-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: .75rem;
}

.label {
    font-size: .8rem;
    color: #666;
}

.value {
    font-weight: 600;
}

.kpi {
    font-size: 1.25rem;
    font-weight: 700;
}

.muted {
    color: #777;
    margin-top: .25rem;
}

.mt {
    margin-top: .75rem;
}

.chart-box {
    height: auto;
}

@media (max-width: 800px) {
    .grid {
        grid-template-columns: 1fr;
    }

    .span-2 {
        grid-column: auto;
    }

    .info-grid,
    .next-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .chart-box {
        height: auto;
    }
}
</style>
