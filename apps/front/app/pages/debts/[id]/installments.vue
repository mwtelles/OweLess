<script setup lang="ts">
definePageMeta({ middleware: 'auth-client' })

import { ref, onMounted } from 'vue'
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
    dueDate: string
    amount: string | number
    paidAt?: string | null
    createdAt?: string
}

const route = useRoute()
const debtId = Number(route.params.id)
const { $api } = useNuxtApp()
const toast = useToast()

const loading = ref(false)
const rows = ref<Installment[]>([])

const showCreate = ref(false)
const form = ref<{ dueDate: Date | null; amount: number | null }>({
    dueDate: new Date(),
    amount: null
})

async function loadInstallments() {
    loading.value = true
    try {
        const res = await $api.get('/installments', { params: { debtId } })
        rows.value = (res.data?.installments ?? []).map((i: Installment) => ({
            ...i,
            amount: typeof i.amount === 'string' ? parseFloat(i.amount) : i.amount
        }))
    } catch (e: any) {
        toast.add({ severity: 'error', summary: 'Installments', detail: e?.response?.data?.error || 'Failed to load installments' })
    } finally {
        loading.value = false
    }
}

async function createInstallment() {
    if (!form.value.dueDate || !form.value.amount) {
        toast.add({ severity: 'warn', summary: 'Validation', detail: 'Fill all fields.' })
        return
    }
    try {
        await $api.post('/installments', {
            debtId,
            dueDate: form.value.dueDate.toISOString(),
            amount: form.value.amount
        })
        showCreate.value = false
        toast.add({ severity: 'success', summary: 'Installment', detail: 'Installment created' })
        await loadInstallments()
        form.value = { dueDate: new Date(), amount: null }
    } catch (e: any) {
        toast.add({ severity: 'error', summary: 'Installment', detail: e?.response?.data?.error || 'Failed to create installment' })
    }
}

function back() {
    navigateTo('/debts')
}

onMounted(loadInstallments)
</script>

<template>
    <div class="page">
        <Toast />
        <header class="page-header">
            <h1>Installments — Debt #{{ debtId }}</h1>
            <div class="actions">
                <Button label="New Installment" @click="showCreate = true" />
                <Button label="Back" severity="secondary" @click="back" />
            </div>
        </header>

        <DataTable :value="rows" :loading="loading" dataKey="id" class="w-100">
            <Column field="id" header="#" />
            <Column header="Due"
                :body="({ data }: { data: Installment }) => new Date(data.dueDate).toLocaleDateString()" />
            <Column header="Amount"
                :body="({ data }: { data: Installment }) => (typeof data.amount === 'number' ? data.amount.toLocaleString() : data.amount)" />
            <Column header="Paid at"
                :body="({ data }: { data: Installment }) => data.paidAt ? new Date(data.paidAt).toLocaleString() : '-'" />
        </DataTable>

        <Dialog v-model:visible="showCreate" header="Create Installment" modal :style="{ width: '420px' }">
            <div class="form-row">
                <label>Due date</label>
                <Calendar v-model="form.dueDate" class="w-100" dateFormat="yy-mm-dd" />
            </div>
            <div class="form-row">
                <label>Amount</label>
                <InputNumber v-model="form.amount" class="w-100" mode="currency" currency="USD" locale="en-US"
                    :min="0" />
            </div>
            <template #footer>
                <Button label="Cancel" severity="secondary" @click="showCreate = false" />
                <Button label="Create" @click="createInstallment" />
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
