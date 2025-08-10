<script setup lang="ts">
definePageMeta({ middleware: 'auth-client' })

import { ref, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import Toast from 'primevue/toast'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Calendar from 'primevue/calendar'

type Debt = {
    id: number
    title: string
    principal: string | number
    interestRateYear: string | number
    startDate: string
    createdAt?: string
    isClosed?: boolean
}

const { $api } = useNuxtApp()
const toast = useToast()

const loading = ref(false)
const debts = ref<Debt[]>([])

const showCreate = ref(false)
const form = ref<{ title: string; principal: number | null; interestRateYear: number | null; startDate: Date | null }>({
    title: '',
    principal: null,
    interestRateYear: 0.14, // 14%/ano como default
    startDate: new Date()
})

async function loadDebts() {
    loading.value = true
    try {
        const res = await $api.get('/debts')
        debts.value = (res.data?.debts ?? []).map((d: Debt) => ({
            ...d,
            principal: typeof d.principal === 'string' ? parseFloat(d.principal) : d.principal,
            interestRateYear: typeof d.interestRateYear === 'string' ? parseFloat(d.interestRateYear) : d.interestRateYear
        }))
    } catch (e: any) {
        toast.add({ severity: 'error', summary: 'Debts', detail: e?.response?.data?.error || 'Failed to load debts' })
    } finally {
        loading.value = false
    }
}

async function createDebt() {
    if (!form.value.title || !form.value.principal || !form.value.interestRateYear || !form.value.startDate) {
        toast.add({ severity: 'warn', summary: 'Validation', detail: 'Fill all fields.' })
        return
    }
    try {
        await $api.post('/debts', {
            title: form.value.title,
            principal: form.value.principal,
            interestRateYear: form.value.interestRateYear, // ex.: 0.145
            startDate: form.value.startDate.toISOString()
        })
        showCreate.value = false
        toast.add({ severity: 'success', summary: 'Debt', detail: 'Debt created' })
        await loadDebts()
        // reset
        form.value = { title: '', principal: null, interestRateYear: 0.14, startDate: new Date() }
    } catch (e: any) {
        toast.add({ severity: 'error', summary: 'Debt', detail: e?.response?.data?.error || 'Failed to create debt' })
    }
}

function goInstallments(row: Debt) {
    navigateTo(`/debts/${row.id}/installments`)
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
            <Column field="principal" header="Principal"
                :body="({ data }: { data: Debt }) => (typeof data.principal === 'number' ? data.principal.toLocaleString() : data.principal)" />
            <Column field="interestRateYear" header="Interest / year"
                :body="({ data }: { data: Debt }) => (typeof data.interestRateYear === 'number' ? (data.interestRateYear * 100).toFixed(2) + '%' : data.interestRateYear)" />
            <Column field="startDate" header="Start"
                :body="({ data }: { data: Debt }) => new Date(data.startDate).toLocaleDateString()" />
            <Column header="Actions">
                <template #body="{ data }">
                    <Button label="Installments" @click="goInstallments(data)" />
                </template>
            </Column>

        </DataTable>

        <Dialog v-model:visible="showCreate" header="Create Debt" modal :style="{ width: '440px' }">
            <div class="form-row">
                <label>Title</label>
                <InputText v-model="form.title" class="w-100" />
            </div>

            <div class="form-row">
                <label>Principal</label>
                <InputNumber v-model="form.principal" class="w-100" inputId="principal" :min="0" mode="currency"
                    currency="USD" locale="en-US" />
            </div>

            <div class="form-row">
                <label>Interest / year</label>
                <InputNumber v-model="form.interestRateYear" class="w-100" :min="0" :max="1" :step="0.005"
                    suffix=" (fraction)" />
                <small>Ex.: 0.145 = 14.5%/year</small>
            </div>

            <div class="form-row">
                <label>Start date</label>
                <Calendar v-model="form.startDate" class="w-100" dateFormat="yy-mm-dd" />
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
</style>
