<script setup lang="ts">
definePageMeta({ layout: 'auth-centered', middleware: ['guest-only'] })

import Toast from 'primevue/toast'
import { useToast } from 'primevue/usetoast'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'
import Checkbox from 'primevue/checkbox'
import { useAuthStore } from '~/stores/auth'

const { $t } = useNuxtApp()
const toast = useToast()
const auth = useAuthStore()

const email = ref('')
const password = ref('')
const rememberMe = ref(false)
const loading = ref(false)
const triedSubmit = ref(false)

const emailError = computed(() => {
    if (!triedSubmit.value) return ''
    if (!email.value) return $t('validation.required') as string
    if (!email.value.includes('@')) return $t('validation.invalidEmail') as string
    return ''
})
const passwordError = computed(() => {
    if (!triedSubmit.value) return ''
    if (!password.value) return $t('validation.required') as string
    if (password.value.length < 6) return $t('validation.minChars', { n: 6 } as any) as string
    return ''
})

onMounted(() => {
    try {
        const remembered = localStorage.getItem('oweless_remember_me') === 'true'
        const savedEmail = localStorage.getItem('oweless_login_email') || ''
        rememberMe.value = remembered
        if (rememberMe.value && savedEmail) email.value = savedEmail
    } catch { }
})

watch(rememberMe, (val) => {
    try {
        localStorage.setItem('oweless_remember_me', String(val))
        if (!val) localStorage.removeItem('oweless_login_email')
    } catch { }
})

const onSubmit = async () => {
    triedSubmit.value = true
    if (emailError.value || passwordError.value) return
    loading.value = true
    try {
        await auth.login({ email: email.value, password: password.value })
        if (rememberMe.value) localStorage.setItem('oweless_login_email', email.value)
        await navigateTo('/')
    } catch (e: any) {
        const msg = e?.response?.data?.error || e?.response?.data?.message || 'Login failed'
        toast.add({ severity: 'error', summary: 'Authentication', detail: msg, life: 3500 })
    } finally {
        loading.value = false
    }
}
</script>

<template>
    <div class="card">
        <Toast />
        <header class="head">
            <h1 class="title">{{ $t('auth.login') }}</h1>
            <p class="subtitle">{{ $t('auth.loginDescription') }}</p>
        </header>

        <form @submit.prevent="onSubmit" novalidate class="form">
            <!-- Email -->
            <label class="label" for="email">{{ $t('auth.email') }}</label>
            <span class="p-input-icon-left w-full">
                <i class="pi pi-envelope" aria-hidden="true" />
                <InputText id="email" v-model="email" type="email" :placeholder="$t('auth.placeholders.email')"
                    autocomplete="email" required fluid :aria-invalid="!!emailError"
                    @keydown.enter.prevent="onSubmit" />
            </span>
            <small v-if="emailError" class="error">{{ emailError }}</small>

            <!-- Password -->
            <label class="label" for="password">{{ $t('auth.password') }}</label>
            <span class="p-input-icon-left w-full">
                <i class="pi pi-lock" aria-hidden="true" />
                <Password id="password" v-model="password" :feedback="false" toggleMask
                    :placeholder="$t('auth.placeholders.password')" autocomplete="current-password" required fluid
                    :inputProps="{ 'aria-invalid': !!passwordError }" @keydown.enter.prevent="onSubmit" />
            </span>
            <small v-if="passwordError" class="error">{{ passwordError }}</small>

            <div class="row-between">
                <label class="remember">
                    <Checkbox inputId="remember" v-model="rememberMe" :binary="true" />
                    <span>{{ $t('auth.rememberMe') }}</span>
                </label>
                <NuxtLink class="muted link" to="/forgot-password">
                    {{ $t('auth.forgotPassword') }}
                </NuxtLink>
            </div>

            <Button type="submit" class="mt-3" :loading="loading" :disabled="loading" :label="$t('auth.login')" fluid />

            <p class="hint">
                {{ $t('auth.noAccount') }}
                <NuxtLink class="link" to="/register">{{ $t('auth.register') }}</NuxtLink>
            </p>
        </form>
    </div>
</template>

<style scoped>
/* Glass effect card */
.card {
    position: relative;
    border-radius: 18px;
    padding: 20px 18px 16px;
    backdrop-filter: blur(14px) saturate(120%);
    -webkit-backdrop-filter: blur(14px) saturate(120%);
    background: rgba(10, 15, 18, .55);
    /* translucent dark */
    border: 1px solid rgba(148, 163, 184, .16);
    box-shadow:
        0 24px 60px rgba(0, 0, 0, .45),
        inset 0 1px 0 rgba(255, 255, 255, .05);
    animation: pop .24s ease-out;
}

/* Subtle gradient rim / glow */
.card::after {
    content: "";
    position: absolute;
    inset: -1px;
    z-index: -1;
    border-radius: 20px;
    background: radial-gradient(500px 220px at 90% 110%, rgba(16, 185, 129, .25), transparent 60%);
    filter: blur(14px);
    opacity: .7;
}

.head {
    margin-bottom: .5rem;
}

.title {
    margin: 0 0 .2rem;
    font-weight: 800;
    font-size: 1.5rem;
    letter-spacing: .2px;
    color: #e5e7eb;
}

.subtitle {
    margin: 0;
    opacity: .75;
    color: #cbd5e1;
}

.form {
    margin-top: .35rem;
}

.label {
    display: block;
    margin-top: .8rem;
    margin-bottom: .3rem;
    font-size: .9rem;
    opacity: .9;
    color: #d1d5db;
}

/* PrimeVue input with icons */
.p-input-icon-left>i {
    left: .65rem;
    color: #93a1b1;
}

.p-input-icon-left :deep(.p-inputtext),
.p-input-icon-left :deep(.p-password input) {
    padding-left: 2.2rem;
}

/* Errors */
.error {
    color: #f87171;
    font-size: .82rem;
    margin-top: .25rem;
}

/* Row + links */
.row-between {
    margin-top: .7rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: .75rem;
}

.remember {
    display: inline-flex;
    align-items: center;
    gap: .5rem;
    color: #cbd5e1;
}

.muted {
    opacity: .85;
    color: #cbd5e1;
}

.link {
    text-underline-offset: 3px;
}

.mt-3 {
    margin-top: 1rem;
}

.hint {
    margin-top: 1rem;
    font-size: .92rem;
    color: #d1d5db;
}

/* Focus rings */
:deep(input):focus-visible,
:deep(.p-password input):focus-visible,
:deep(.p-button):focus-visible {
    outline: 2px solid rgba(16, 185, 129, .55);
    outline-offset: 2px;
    border-radius: 10px;
}

/* Anim */
@keyframes pop {
    from {
        opacity: 0;
        transform: translateY(6px) scale(.985);
    }

    to {
        opacity: 1;
        transform: none;
    }
}
</style>
