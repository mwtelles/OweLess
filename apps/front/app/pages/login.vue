<!-- apps/front/pages/login.vue -->
<template>
    <div class="card">
        <Toast />
        <h2>Login</h2>

        <form @submit.prevent="onSubmit">
            <label>Email</label>
            <InputText v-model="email" type="email" required fluid />

            <label>Password</label>
            <Password v-model="password" :feedback="false" toggleMask fluid required />

            <Button type="submit" :loading="loading" label="Sign in" fluid class="mt-4" />

            <p class="hint">
                No account?
                <NuxtLink to="/register">Register</NuxtLink>
            </p>
        </form>
    </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import Toast from 'primevue/toast'
import { useToast } from 'primevue/usetoast'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'

const auth = useAuthStore()
const toast = useToast()

const email = ref('')
const password = ref('')
const loading = ref(false)

const onSubmit = async () => {
    loading.value = true
    try {
        await auth.login({ email: email.value, password: password.value })
        await navigateTo('/')
    } catch (e: any) {
        const msg = e?.response?.data?.error || e?.response?.data?.message || 'Login failed'
        toast.add({ severity: 'error', summary: 'Authentication', detail: msg, life: 3500 })
    } finally {
        loading.value = false
    }
}
</script>

<style scoped>
.card {
    max-width: 380px;
    margin: 5rem auto;
    padding: 1.5rem;
    border: 1px solid #ddd;
    border-radius: 12px;
}

label {
    display: block;
    margin-top: .75rem;
}

.w-100 {
    width: 100%;
}

.mt-4 {
    margin-top: 1rem;
}

.hint {
    margin-top: .75rem;
    font-size: .9rem;
}
</style>
