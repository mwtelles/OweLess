<script setup lang="ts">
definePageMeta({ middleware: 'auth-client' })

import { ref, onMounted, computed } from 'vue'
import { useToast } from 'primevue/usetoast'
import Toast from 'primevue/toast'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Calendar from 'primevue/calendar'
import Dropdown from 'primevue/dropdown'
import SelectButton from 'primevue/selectbutton'

type Debt = {
    id: number
    title: string
    type: 'loan' | 'financing' | 'student' | 'credit_card' | 'other'
    principal: string | number
    rateType: 'fixed_nominal_year' | 'fixed_nominal_month' | 'indexed_variable'
    nominalRate?: string | number | null
    amortizationSystem: 'PRICE' | 'SAC'
    termMonths: number
    paymentDay?: number | null
    startDate: string
    graceMonths: number
    monthlyFees: string | number
    createdAt?: string
    isClosed?: boolean
}

const { $api } = useNuxtApp()
const toast = useToast()

const loading = ref(false)
const debts = ref<Debt[]>([])

const showCreate = ref(false)
type RateType = 'fixed_nominal_year' | 'fixed_nominal_month' | 'indexed_variable'
type AmortSys = 'PRICE' | 'SAC'

const form = ref<{
    title: string
    principal: number | null
    rateType: RateType
    nominalRateYear: number | null
    nominalRateMonth: number | null
    spreadRate: number | null
    amortizationSystem: AmortSys
    termMonths: number | null
    paymentDay: number | null
    startDate: Date | null
    graceMonths: number
    monthlyFees: number
}>({
    title: '',
    principal: null,
    rateType: 'fixed_nominal_year',
    nominalRateYear: 0.145,
    nominalRateMonth: null,
    spreadRate: null,
    amortizationSystem: 'PRICE',
    termMonths: 48,
    paymentDay: 5,
    startDate: new Date(),
    graceMonths: 0,
    monthlyFees: 0
})

const rateTypeOptions = [
    { label: 'Fixed (year)', value: 'fixed_nominal_year' },
    { label: 'Fixed (month)', value: 'fixed_nominal_month' },
    { label: 'Indexed', value: 'indexed_variable' }
]

const amortOptions = [
    { label: 'PRICE', value: 'PRICE' },
    { label: 'SAC', value: 'SAC' }
]

const showYearRate = computed(() => form.value.rateType === 'fixed_nominal_year')
const showMonthRate = computed(() => form.value.rateType === 'fixed_nominal_month')
const showSpread = computed(() => form.value.rateType === 'indexed_variable')

async function loadDebts() {
    loading.value = true
    try {
        const res = await $api.get('/debts')
        debts.value = (res.data?.debts ?? []).map((d: Debt) => ({
            ...d,
            principal: typeof d.principal === 'string' ? parseFloat(d.principal) : d.principal,
            monthlyFees: typeof d.monthlyFees === 'string' ? parseFloat(d.monthlyFees) : d.monthlyFees
        }))
    } catch (e: any) {
        toast.add({ severity: 'error', summary: 'Debts', detail: e?.response?.data?.error || 'Failed to load debts' })
    } finally {
        loading.value = false
    }
}

async function createDebt() {
    const f = form.value
    if (!f.title || !f.principal || !f.termMonths || !f.startDate) {
        toast.add({ severity: 'warn', summary: 'Validation', detail: 'Fill required fields.' })
        return
    }

    // monta payload conforme rateType
    const payload: any = {
        title: f.title,
        principal: f.principal,
        rateType: f.rateType,
        amortizationSystem: f.amortizationSystem,
        monthlyFees: f.monthlyFees ?? 0,
        termMonths: f.termMonths,
        startDate: f.startDate.toISOString(),
        paymentDay: f.paymentDay ?? undefined,
        graceMonths: f.graceMonths ?? 0
    }
    if (f.rateType === 'fixed_nominal_year') payload.nominalRateYear = f.nominalRateYear
    if (f.rateType === 'fixed_nominal_month') payload.nominalRateMonth = f.nominalRateMonth
    if (f.rateType === 'indexed_variable') payload.spreadRate = f.spreadRate

    try {
        await $api.post('/debts', payload)
        showCreate.value = false
        toast.add({ severity: 'success', summary: 'Debt', detail: 'Debt created' })
        await loadDebts()
        // reset
        form.value = {
            title: '',
            principal: null,
            rateType: 'fixed_nominal_year',
            nominalRateYear: 0.145,
            nominalRateMonth: null,
            spreadRate: null,
            amortizationSystem: 'PRICE',
            termMonths: 48,
            paymentDay: 5,
            startDate: new Date(),
            graceMonths: 0,
            monthlyFees: 0
        }
    } catch (e: any) {
        toast.add({ severity: 'error', summary: 'Debt', detail: e?.response?.data?.error || 'Failed to create debt' })
    }
}

function goInstallments(row: Debt) {
    navigateTo(`/debts/${row.id}/installments`)
}
function goSummary(row: Debt) {
    navigateTo(`/debts/${row.id}/summary`)
}

onMounted(loadDebts)
</script>

<template>
    <div class="page">
        <Toast />
        <header class="page-header">
            <h1>Debts</h1>
            <Button label="New Debt" @click="showCreate = true" />
        </header>

        <DataTable :value="debts" :loading="loading" dataKey="id" class="w-100">
            <Column field="title" header="Title" />
            <Column field="principal" header="Principal" :body="({ data }: { data: Debt }) =>
                (typeof data.principal === 'number' ? data.principal.toLocaleString() : data.principal)" />
            <Column field="amortizationSystem" header="System" />
            <Column field="termMonths" header="Term (mo)" />
            <Column field="startDate" header="Start"
                :body="({ data }: { data: Debt }) => new Date(data.startDate).toLocaleDateString()" />
            <Column header="Actions">
                <template #body="{ data }">
                    <Button label="Summary" class="mr" @click="goSummary(data)" />
                    <Button label="Installments" @click="goInstallments(data)" />
                </template>
            </Column>
        </DataTable>

        <Dialog v-model:visible="showCreate" header="Create Debt" modal :style="{ width: '520px' }">
            <div class="form-row">
                <label>Title *</label>
                <InputText v-model="form.title" class="w-100" />
            </div>

            <div class="form-row">
                <label>Principal *</label>
                <InputNumber v-model="form.principal" class="w-100" :min="0" mode="currency" currency="USD"
                    locale="en-US" />
            </div>

            <div class="form-row">
                <label>Rate type *</label>
                <Dropdown v-model="form.rateType" :options="rateTypeOptions" optionLabel="label" optionValue="value"
                    class="w-100" />
            </div>

            <div class="form-row" v-if="showYearRate">
                <label>Nominal rate (year)</label>
                <InputNumber v-model="form.nominalRateYear" :min="0" :max="1" :step="0.001" suffix=" (fraction)"
                    class="w-100" />
                <small>Ex.: 0.145 = 14.5%/year</small>
            </div>
            <div class="form-row" v-if="showMonthRate">
                <label>Nominal rate (month)</label>
                <InputNumber v-model="form.nominalRateMonth" :min="0" :max="1" :step="0.001" suffix=" (fraction)"
                    class="w-100" />
                <small>Ex.: 0.012 = 1.2%/month</small>
            </div>
            <div class="form-row" v-if="showSpread">
                <label>Spread (indexed)</label>
                <InputNumber v-model="form.spreadRate" :min="0" :max="1" :step="0.001" suffix=" (fraction)"
                    class="w-100" />
                <small>Ex.: 0.03 = +3% over index</small>
            </div>

            <div class="form-row">
                <label>Amortization *</label>
                <SelectButton v-model="form.amortizationSystem" :options="amortOptions" optionLabel="label"
                    optionValue="value" />
            </div>

            <div class="form-row">
                <label>Term (months) *</label>
                <InputNumber v-model="form.termMonths" class="w-100" :min="1" :max="600" />
            </div>

            <div class="form-row">
                <label>Payment day</label>
                <InputNumber v-model="form.paymentDay" class="w-100" :min="1" :max="28" />
            </div>

            <div class="form-row">
                <label>Start date *</label>
                <Calendar v-model="form.startDate" class="w-100" dateFormat="yy-mm-dd" />
            </div>

            <div class="form-row">
                <label>Grace (months)</label>
                <InputNumber v-model="form.graceMonths" class="w-100" :min="0" :max="60" />
            </div>

            <div class="form-row">
                <label>Monthly fees</label>
                <InputNumber v-model="form.monthlyFees" class="w-100" mode="currency" currency="USD" locale="en-US"
                    :min="0" />
            </div>

            <template #footer>
                <Button label="Cancel" severity="secondary" @click="showCreate = false" />
                <Button label="Create" @click="createDebt" />
            </template>
        </Dialog>
    </div>
</template>

<style scoped>
.page {
    max-width: 1000px;
    margin: 0 auto;
    padding: 1rem;
}

.page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;
}

.form-row {
    margin-top: .75rem;
    display: grid;
    gap: .35rem;
}

.w-100 {
    width: 100%;
}

.mr {
    margin-right: .5rem;
}
</style>
