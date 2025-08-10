<template>
    <div class="card">
        <Toast />
        <h2>Create account</h2>
        <form @submit.prevent="onSubmit">
            <label>Email</label>
            <input v-model="email" type="email" required />
            <label>Password</label>
            <input v-model="password" type="password" required />
            <button :disabled="loading" type="submit">
                {{ loading ? 'Creating...' : 'Create account' }}
            </button>
            <p class="hint">
                Already have an account?
                <NuxtLink to="/login">Login</NuxtLink>
            </p>
        </form>
    </div>
</template>

<script setup lang="ts">
import Toast from 'primevue/toast'
import { useToast } from 'primevue/usetoast'
import { useAuthStore } from '~/stores/auth'
const auth = useAuthStore()
const email = ref('')
const password = ref('')
const loading = ref(false)
const toast = useToast()

const onSubmit = async () => {
    loading.value = true
    try {
        await auth.register({ email: email.value, password: password.value })
        toast.add({
            severity: 'success',
            summary: 'Registration',
            detail: 'Account created successfully. You can now log in.',
            life: 3500
        })
        await navigateTo('/login')
    } catch (e: any) {
        toast.add({
            severity: 'error',
            summary: 'Registration',
            detail: e?.response?.data?.error || 'Registration failed',
            life: 3500
        })
    } finally {
        loading.value = false
    }
}
</script>

<style scoped>
.card {
    max-width: 360px;
    margin: 5rem auto;
    padding: 1.5rem;
    border: 1px solid #ddd;
    border-radius: 12px;
}

label {
    display: block;
    margin-top: .75rem;
}

input {
    width: 100%;
    padding: .5rem;
    margin-top: .25rem;
}

button {
    margin-top: 1rem;
    width: 100%;
    padding: .6rem;
}

.hint {
    margin-top: .75rem;
    font-size: .9rem;
}
</style>
