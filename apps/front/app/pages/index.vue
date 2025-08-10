<script setup lang="ts">
definePageMeta({ middleware: 'auth-client' })

import { ref, onMounted, computed } from 'vue'
import { useToast } from 'primevue/usetoast'
import Toast from 'primevue/toast'
import Card from 'primevue/card'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Chart from 'primevue/chart'

type Upcoming = {
    debtId: number
    debtTitle: string
    id: number
    number: number
    dueDate: string
    expectedTotal: number
    status: 'pending' | 'partially_paid' | 'paid' | 'overdue'
}
type DebtAgg = {
    id: number
    title: string
    totalExpected: number
    totalPaid: number
    remainingPrincipal: number
    overdueCount: number
    nextDue: Upcoming | null
}
type SummaryResp = {
    kpis: {
        totalExpected: number
        totalPaid: number
        remainingPrincipal: number
        overdueCount: number
        paidBreakdown: { principal: number; interest: number; fees: number }
    }
    debts: DebtAgg[]
    upcomingDues: Upcoming[]
}

const { $api } = useNuxtApp()
const toast = useToast()

const loading = ref(false)
const data = ref<SummaryResp | null>(null)

// helpers
const fmtMoney = (n: number) => n.toLocaleString(undefined, { style: 'currency', currency: 'USD' })

// charts
const chartOpts = ref<any>({
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'top' }, tooltip: { mode: 'index', intersect: false } },
    scales: { x: { ticks: { autoSkip: true } }, y: { beginAtZero: true } }
})

const chPaidBreakdown = computed(() => {
    const b = data.value?.kpis.paidBreakdown ?? { principal: 0, interest: 0, fees: 0 }
    return {
        labels: ['Principal paid', 'Interest paid', 'Fees paid'],
        datasets: [{ data: [b.principal, b.interest, b.fees] }]
    }
})

const chRemainingByDebt = computed(() => {
    const top = [...(data.value?.debts ?? [])]
        .sort((a, b) => b.remainingPrincipal - a.remainingPrincipal)
        .slice(0, 10)
    return {
        labels: top.map(d => d.title),
        datasets: [{ type: 'bar', label: 'Remaining', data: top.map(d => d.remainingPrincipal) }]
    }
})

const chExpectedPaidByDebt = computed(() => {
    const top = [...(data.value?.debts ?? [])]
        .sort((a, b) => (b.totalExpected - b.totalPaid) - (a.totalExpected - a.totalPaid))
        .slice(0, 10)
    return {
        labels: top.map(d => d.title),
        datasets: [
            { type: 'bar', label: 'Expected', data: top.map(d => d.totalExpected) },
            { type: 'bar', label: 'Paid', data: top.map(d => d.totalPaid) }
        ]
    }
})

const upcoming = computed<Upcoming[]>(() => data.value?.upcomingDues ?? [])
const k = computed(() => data.value?.kpis ?? {
    totalExpected: 0, totalPaid: 0, remainingPrincipal: 0, overdueCount: 0,
    paidBreakdown: { principal: 0, interest: 0, fees: 0 }
})

function gotoDebt(id: number) { navigateTo(`/debts/${id}/summary`) }

async function loadDashboard() {
    loading.value = true
    try {
        const res = await $api.get('/dashboard/summary', { params: { limitDebts: 50, upcomingLimit: 10 } })
        // normaliza números (se vierem como string)
        const body = res.data as SummaryResp
        body.kpis.totalExpected = Number(body.kpis.totalExpected ?? 0)
        body.kpis.totalPaid = Number(body.kpis.totalPaid ?? 0)
        body.kpis.remainingPrincipal = Number(body.kpis.remainingPrincipal ?? 0)
        body.kpis.overdueCount = Number(body.kpis.overdueCount ?? 0)
        body.kpis.paidBreakdown.principal = Number(body.kpis.paidBreakdown.principal ?? 0)
        body.kpis.paidBreakdown.interest = Number(body.kpis.paidBreakdown.interest ?? 0)
        body.kpis.paidBreakdown.fees = Number(body.kpis.paidBreakdown.fees ?? 0)
        body.debts = body.debts.map(d => ({
            ...d,
            totalExpected: Number(d.totalExpected ?? 0),
            totalPaid: Number(d.totalPaid ?? 0),
            remainingPrincipal: Number(d.remainingPrincipal ?? 0),
            overdueCount: Number(d.overdueCount ?? 0)
        }))
        body.upcomingDues = body.upcomingDues.map(u => ({
            ...u,
            expectedTotal: Number(u.expectedTotal ?? 0)
        }))
        data.value = body
    } catch (e: any) {
        toast.add({ severity: 'error', summary: 'Dashboard', detail: e?.response?.data?.error || 'Failed to load' })
    } finally {
        loading.value = false
    }
}

onMounted(loadDashboard)
</script>

<template>
    <div class="page">
        <Toast />
        <header class="page-header">
            <h1>{{ $t('dashboard.title') }}</h1>
            <div class="actions">
                <Button label="{{ $t('debts.newDebt') }}" @click="navigateTo('/debts')" />
            </div>
        </header>

        <div v-if="loading">{{ $t('common.loading') }}</div>
        <div v-else-if="!data">{{ $t('common.noData') }}</div>

        <div v-else class="grid">
            <!-- KPIs -->
            <Card class="card">
                <template #title>{{ $t('summary.totalExpected') }}</template>
                <template #content>
                    <div class="kpi">{{ fmtMoney(k.totalExpected) }}</div>
                </template>
            </Card>
            <Card class="card">
                <template #title>{{ $t('summary.totalPaid') }}</template>
                <template #content>
                    <div class="kpi">{{ fmtMoney(k.totalPaid) }}</div>
                </template>
            </Card>
            <Card class="card">
                <template #title>{{ $t('summary.remainingPrincipal') }}</template>
                <template #content>
                    <div class="kpi">{{ fmtMoney(k.remainingPrincipal) }}</div>
                </template>
            </Card>
            <Card class="card">
                <template #title>{{ $t('summary.overdueCount') }}</template>
                <template #content>
                    <div class="kpi">{{ k.overdueCount }}</div>
                </template>
            </Card>

            <!-- Doughnut: paid breakdown -->
            <Card class="card span-2">
                <template #title>{{ $t('dashboard.paidBreakdown') }}</template>
                <template #content>
                    <div class="chart-box">
                        <Chart type="doughnut" :data="chPaidBreakdown" :options="chartOpts" />
                    </div>
                </template>
            </Card>

            <!-- Bar: remaining by debt -->
            <Card class="card span-2">
                <template #title>{{ $t('dashboard.remainingByDebt') }}</template>
                <template #content>
                    <div class="chart-box">
                        <Chart type="bar" :data="chRemainingByDebt" :options="chartOpts" />
                    </div>
                </template>
            </Card>

            <!-- Bar: expected vs paid by debt -->
            <Card class="card span-2">
                <template #title>{{ $t('dashboard.expectedVsPaid') }}</template>
                <template #content>
                    <div class="chart-box">
                        <Chart type="bar" :data="chExpectedPaidByDebt" :options="chartOpts" />
                    </div>
                </template>
            </Card>

            <!-- Upcoming dues -->
            <Card class="card span-2">
                <template #title>{{ $t('dashboard.upcomingDues') }}</template>
                <template #content>
                    <DataTable :value="upcoming">
                        <Column field="debtTitle" header="{{ $t('debts.title') }}" />
                        <Column field="number" header="#" />
                        <Column field="dueDate" header="{{ $t('summary.nextDue') }}"
                            :body="({ data }: { data: Upcoming }) => new Date(data.dueDate).toLocaleDateString()" />
                        <Column field="expectedTotal" header="{{ $t('payments.amount') }}"
                            :body="({ data }: { data: Upcoming }) => fmtMoney(data.expectedTotal)" />
                        <Column header="{{ $t('common.actions') }}">
                            <template #body="{ data }">
                                <Button label="{{ $t('common.open') }}" @click="gotoDebt(data.debtId)" />
                            </template>
                        </Column>
                    </DataTable>
                </template>
            </Card>
        </div>
    </div>
</template>

<style scoped>
.page {
    max-width: 1200px;
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

.kpi {
    font-size: 1.25rem;
    font-weight: 700;
}

.chart-box {
    height: auto;
}

@media (max-width: 900px) {
    .grid {
        grid-template-columns: 1fr;
    }

    .span-2 {
        grid-column: auto;
    }

    .chart-box {
        height: 220px;
    }
}
</style>
