<script setup lang="ts">
definePageMeta({ layout: 'app', middleware: 'auth-client' })

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

const { $api, $t } = useNuxtApp()
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

const rateTypeOptions = computed(() => ([
    { label: $t('debts.rateTypeFixedYear'), value: 'fixed_nominal_year' },
    { label: $t('debts.rateTypeFixedMonth'), value: 'fixed_nominal_month' },
    { label: $t('debts.rateTypeIndexed'), value: 'indexed_variable' }
]))

const amortOptions = computed(() => ([
    { label: 'PRICE', value: 'PRICE' },
    { label: 'SAC', value: 'SAC' }
]))

const showYearRate = computed(() => form.value.rateType === 'fixed_nominal_year')
const showMonthRate = computed(() => form.value.rateType === 'fixed_nominal_month')
const showSpread = computed(() => form.value.rateType === 'indexed_variable')
const showDelete = ref(false)
const deleting = ref(false)
const selectedDebt = ref<Debt | null>(null)

function askDelete(row: Debt) {
    selectedDebt.value = row
    showDelete.value = true
}

async function confirmDelete() {
    if (!selectedDebt.value) return
    deleting.value = true
    try {
        await $api.delete(`/debts/${selectedDebt.value.id}`)
        toast.add({ severity: 'success', summary: $t('debts.single'), detail: $t('debts.deleted') })
        showDelete.value = false
        selectedDebt.value = null
        await loadDebts()
    } catch (e: any) {
        toast.add({
            severity: 'error',
            summary: $t('debts.single'),
            detail: e?.response?.data?.error || $t('errors.failedDeleteDebt')
        })
    } finally {
        deleting.value = false
    }
}

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
        toast.add({
            severity: 'error',
            summary: $t('debts.title'),
            detail: e?.response?.data?.error || $t('errors.failedLoadDebts')
        })
    } finally {
        loading.value = false
    }
}

async function createDebt() {
    const f = form.value
    if (!f.title || !f.principal || !f.termMonths || !f.startDate) {
        toast.add({ severity: 'warn', summary: $t('validation.title'), detail: $t('validation.requiredFields') })
        return
    }

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
        toast.add({ severity: 'success', summary: $t('debts.single'), detail: $t('debts.created') })
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
        toast.add({
            severity: 'error',
            summary: $t('debts.single'),
            detail: e?.response?.data?.error || $t('errors.failedCreateDebt')
        })
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
            <h1>{{ $t('debts.title') }}</h1>
            <Button :label="$t('debts.newDebt')" @click="showCreate = true" />
        </header>

        <DataTable :value="debts" :loading="loading" dataKey="id" class="w-100">
            <Column field="title" :header="$t('common.title')" />
            <Column field="principal" :header="$t('debts.principal')" :body="({ data }: { data: Debt }) =>
                (typeof data.principal === 'number' ? data.principal.toLocaleString() : data.principal)" />
            <Column field="amortizationSystem" :header="$t('debts.amortization')" />
            <Column field="termMonths" :header="$t('debts.termMonths')" />
            <Column field="startDate" :header="$t('debts.startDate')"
                :body="({ data }: { data: Debt }) => new Date(data.startDate).toLocaleDateString()" />
            <Column :header="$t('common.actions')">
                <template #body="{ data }">
                    <Button class="mr" :label="$t('debts.summary')" @click="goSummary(data)" />
                    <Button class="mr" :label="$t('debts.installments')" @click="goInstallments(data)" />
                    <Button class="mr" :label="$t('common.delete')" severity="danger" @click="askDelete(data)" />
                </template>
            </Column>

        </DataTable>

        <Dialog v-model:visible="showCreate" :header="$t('debts.createDebt')" modal :style="{ width: '520px' }">
            <div class="form-row">
                <label>{{ $t('common.title') }} *</label>
                <InputText v-model="form.title" class="w-100" />
            </div>

            <div class="form-row">
                <label>{{ $t('debts.principal') }} *</label>
                <InputNumber v-model="form.principal" class="w-100" :min="0" mode="currency" currency="USD"
                    locale="en-US" />
            </div>

            <div class="form-row">
                <label>{{ $t('debts.rateType') }} *</label>
                <Dropdown v-model="form.rateType" :options="rateTypeOptions" optionLabel="label" optionValue="value"
                    class="w-100" />
            </div>

            <div class="form-row" v-if="showYearRate">
                <label>{{ $t('debts.nominalYear') }}</label>
                <InputNumber v-model="form.nominalRateYear" :min="0" :max="1" :step="0.001" suffix=" (fraction)"
                    class="w-100" />
                <small>{{ $t('debts.examples.nominalYear') }}</small>
            </div>

            <div class="form-row" v-if="showMonthRate">
                <label>{{ $t('debts.nominalMonth') }}</label>
                <InputNumber v-model="form.nominalRateMonth" :min="0" :max="1" :step="0.001" suffix=" (fraction)"
                    class="w-100" />
                <small>{{ $t('debts.examples.nominalMonth') }}</small>
            </div>

            <div class="form-row" v-if="showSpread">
                <label>{{ $t('debts.spread') }}</label>
                <InputNumber v-model="form.spreadRate" :min="0" :max="1" :step="0.001" suffix=" (fraction)"
                    class="w-100" />
                <small>{{ $t('debts.examples.spread') }}</small>
            </div>

            <div class="form-row">
                <label>{{ $t('debts.amortization') }} *</label>
                <SelectButton v-model="form.amortizationSystem" :options="amortOptions" optionLabel="label"
                    optionValue="value" />
            </div>

            <div class="form-row">
                <label>{{ $t('debts.termMonths') }} *</label>
                <InputNumber v-model="form.termMonths" class="w-100" :min="1" :max="600" />
            </div>

            <div class="form-row">
                <label>{{ $t('debts.paymentDay') }}</label>
                <InputNumber v-model="form.paymentDay" class="w-100" :min="1" :max="28" />
            </div>

            <div class="form-row">
                <label>{{ $t('debts.startDate') }} *</label>
                <Calendar v-model="form.startDate" class="w-100" dateFormat="yy-mm-dd" />
            </div>

            <div class="form-row">
                <label>{{ $t('debts.graceMonths') }}</label>
                <InputNumber v-model="form.graceMonths" class="w-100" :min="0" :max="60" />
            </div>

            <div class="form-row">
                <label>{{ $t('debts.monthlyFees') }}</label>
                <InputNumber v-model="form.monthlyFees" class="w-100" mode="currency" currency="USD" locale="en-US"
                    :min="0" />
            </div>

            <template #footer>
                <Button :label="$t('common.cancel')" severity="secondary" @click="showCreate = false" />
                <Button :label="$t('common.saveCreate')" @click="createDebt" />
            </template>
        </Dialog>

        <Dialog v-model:visible="showDelete" :header="$t('debts.deleteConfirmTitle')" modal :style="{ width: '460px' }">
            <p style="margin-bottom: .5rem;">
                {{ $t('debts.deleteConfirmMessage') }}
            </p>
            <p v-if="selectedDebt" style="font-weight: 600;">
                “{{ selectedDebt.title }}”
            </p>

            <template #footer>
                <Button :label="$t('common.cancel')" severity="secondary" :disabled="deleting"
                    @click="showDelete = false" />
                <Button :label="$t('common.delete')" severity="danger" :loading="deleting" @click="confirmDelete" />
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
