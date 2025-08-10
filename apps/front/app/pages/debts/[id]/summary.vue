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

const route = useRoute()
const debtId = Number(route.params.id)
const { $api } = useNuxtApp()
const toast = useToast()

const loading = ref(false)
const data = ref<SummaryResp | null>(null)

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
    loading.value = true
    try {
        const res = await $api.get(`/debts/${debtId}/summary`)
        const body = res.data as SummaryResp
        // normalize numbers that may come as strings
        body.debt.principal = Number(body.debt.principal)
        body.debt.monthlyFees = Number(body.debt.monthlyFees)
        if (body.debt.nominalRate != null) body.debt.nominalRate = Number(body.debt.nominalRate)
        if (body.kpis.nextDue && typeof body.kpis.nextDue.expectedTotal === 'string') {
            body.kpis.nextDue.expectedTotal = Number(body.kpis.nextDue.expectedTotal)
        }
        data.value = body
    } catch (e: any) {
        toast.add({ severity: 'error', summary: 'Summary', detail: e?.response?.data?.error || 'Failed to load summary' })
    } finally {
        loading.value = false
    }
}

function toInstallments() {
    navigateTo(`/debts/${debtId}/installments`)
}
function back() {
    navigateTo('/debts')
}

onMounted(loadSummary)
</script>

<template>
    <div class="page">
        <Toast />
        <header class="page-header">
            <h1>Debt Summary #{{ debtId }}</h1>
            <div class="actions">
                <Button label="Installments" @click="toInstallments" />
                <Button label="Back" severity="secondary" @click="back" />
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
                <template #title>Interest Paid</template>
                <template #content>
                    <div class="kpi">{{ fmtMoney(data.kpis.interestPaid) }}</div>
                </template>
            </Card>

            <Card class="card">
                <template #title>Fees Paid</template>
                <template #content>
                    <div class="kpi">{{ fmtMoney(data.kpis.feesPaid) }}</div>
                </template>
            </Card>

            <Card class="card">
                <template #title>Principal Paid</template>
                <template #content>
                    <div class="kpi">{{ fmtMoney(data.kpis.principalPaid) }}</div>
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

            <!-- (Optional) mini table -->
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

/* grid */
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

/* info blocks */
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
}
</style>
