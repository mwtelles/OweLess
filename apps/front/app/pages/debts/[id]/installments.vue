<script setup lang="ts">
definePageMeta({ layout: 'app', middleware: 'auth-client' })

import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import Toast from 'primevue/toast'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputNumber from 'primevue/inputnumber'
import Calendar from 'primevue/calendar'

type Installment = {
    id: number
    debtId: number
    number: number
    dueDate: string
    expectedInterest: string | number
    expectedPrincipal: string | number
    expectedFees: string | number
    expectedTotal: string | number
    paidInterest: string | number
    paidPrincipal: string | number
    paidFees: string | number
    paidTotal: string | number
    remainingPrincipalAfter: string | number
    status: 'pending' | 'paid' | 'overdue' | 'partially_paid'
}

const route = useRoute()
const debtId = Number(route.params.id)
const { $api, $t } = useNuxtApp()
const toast = useToast()

const loading = ref(false)
const rows = ref<Installment[]>([])
const page = ref(1)
const pageSize = ref(50)
const totalItems = ref(0)

const showPay = ref(false)
const payingInst = ref<Installment | null>(null)
const payForm = ref<{ amount: number | null; paidAt: Date | null; isExtraAmortization: boolean }>({
    amount: null,
    paidAt: new Date(),
    isExtraAmortization: false
})

async function loadInstallments() {
    loading.value = true
    try {
        const res = await $api.get('/installments', {
            params: { debtId, page: page.value, pageSize: pageSize.value, order: 'asc' }
        })
        const data = res.data
        rows.value = (data?.items ?? []).map((i: Installment) => ({
            ...i,
            expectedInterest: num(i.expectedInterest),
            expectedPrincipal: num(i.expectedPrincipal),
            expectedFees: num(i.expectedFees),
            expectedTotal: num(i.expectedTotal),
            paidInterest: num(i.paidInterest),
            paidPrincipal: num(i.paidPrincipal),
            paidFees: num(i.paidFees),
            paidTotal: num(i.paidTotal),
            remainingPrincipalAfter: num(i.remainingPrincipalAfter)
        }))
        totalItems.value = data?.totalItems ?? rows.value.length
    } catch (e: any) {
        toast.add({
            severity: 'error',
            summary: $t('installments.title'),
            detail: e?.response?.data?.error || $t('errors.failedLoadInstallments')
        })
    } finally {
        loading.value = false
    }
}

function num(v: any) {
    if (typeof v === 'number') return v
    if (typeof v === 'string') return parseFloat(v)
    return 0
}

function openPay(inst: Installment) {
    payingInst.value = inst
    payForm.value = { amount: null, paidAt: new Date(), isExtraAmortization: false }
    showPay.value = true
}

async function submitPayment() {
    if (!payForm.value.amount) {
        toast.add({
            severity: 'warn',
            summary: $t('validation.title'),
            detail: $t('validation.amountRequired')
        })
        return
    }
    try {
        await $api.post('/payments', {
            debtId,
            installmentId: payingInst.value?.id,
            amount: payForm.value.amount,
            paidAt: payForm.value.paidAt?.toISOString(),
            isExtraAmortization: payForm.value.isExtraAmortization
        })
        toast.add({
            severity: 'success',
            summary: $t('payments.single'),
            detail: $t('payments.registered')
        })
        showPay.value = false
        await loadInstallments()
    } catch (e: any) {
        toast.add({
            severity: 'error',
            summary: $t('payments.single'),
            detail: e?.response?.data?.error || $t('errors.failedRegisterPayment')
        })
    }
}

const statusLabel = computed(() => ({
    pending: $t('status.pending'),
    paid: $t('status.paid'),
    overdue: $t('status.overdue'),
    partially_paid: $t('status.partially_paid')
}))


function back() { navigateTo('/debts') }

onMounted(loadInstallments)
</script>

<template>
    <div class="page">
        <Toast />
        <header class="page-header">
            <h1>{{ $t('installments.title') }} — {{ $t('debts.single') }} #{{ debtId }}</h1>
            <div class="actions">
                <Button :label="$t('common.back')" severity="secondary" @click="back" />
            </div>
        </header>

        <DataTable :value="rows" :loading="loading" dataKey="id" class="w-100">
            <Column field="number" header="#" />
            <Column field="dueDate" :header="$t('installments.due')"
                :body="({ data }: { data: Installment }) => new Date(data.dueDate).toLocaleDateString()" />
            <Column field="expectedTotal" :header="$t('installments.expected')"
                :body="({ data }: { data: Installment }) => (data.expectedTotal as number).toLocaleString()" />
            <Column field="paidTotal" :header="$t('installments.paid')"
                :body="({ data }: { data: Installment }) => (data.paidTotal as number).toLocaleString()" />
            <Column field="status" :header="$t('installments.status')"
                :body="({ data }: { data: Installment }) => statusLabel[data.status]" />

            <Column field="remainingPrincipalAfter" :header="$t('installments.remainingAfter')"
                :body="({ data }: { data: Installment }) => (data.remainingPrincipalAfter as number).toLocaleString()" />
            <Column :header="$t('common.actions')">
                <template #body="{ data }">
                    <Button :label="$t('payments.pay')" @click="openPay(data)" />
                </template>
            </Column>
        </DataTable>

        <Dialog v-model:visible="showPay" :header="$t('payments.registerPayment')" modal :style="{ width: '420px' }">
            <div class="form-row">
                <label>{{ $t('payments.amount') }}</label>
                <InputNumber v-model="payForm.amount" class="w-100" mode="currency" currency="USD" locale="en-US"
                    :min="0" />
            </div>
            <div class="form-row">
                <label>{{ $t('payments.paidAt') }}</label>
                <Calendar v-model="payForm.paidAt" class="w-100" showTime hourFormat="24" dateFormat="yy-mm-dd" />
            </div>
            <div class="form-row">
                <label>
                    <input type="checkbox" v-model="payForm.isExtraAmortization" />
                    {{ $t('payments.extraAmort') }}
                </label>
            </div>
            <template #footer>
                <Button :label="$t('common.cancel')" severity="secondary" @click="showPay = false" />
                <Button :label="$t('payments.register')" @click="submitPayment" />
            </template>
        </Dialog>
    </div>
</template>

<style scoped>
.page {
    max-width: 900px;
    margin: 0 auto;
    padding: 1rem;
}

.page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;
    gap: 1rem;
}

.actions {
    display: flex;
    gap: .5rem;
}

.form-row {
    margin-top: .75rem;
    display: grid;
    gap: .35rem;
}

.w-100 {
    width: 100%;
}
</style>
