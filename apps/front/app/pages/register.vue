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
const confirmPassword = ref('')
const acceptTerms = ref(false)
const loading = ref(false)
const triedSubmit = ref(false)

/* Inline validation */
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
const confirmError = computed(() => {
    if (!triedSubmit.value) return ''
    if (!confirmPassword.value) return $t('validation.required') as string
    if (confirmPassword.value !== password.value) return $t('validation.passwordsNotMatch') as string
    return ''
})
const termsError = computed(() => {
    if (!triedSubmit.value) return ''
    if (!acceptTerms.value) return $t('validation.acceptTermsRequired') as string
    return ''
})

const onSubmit = async () => {
    triedSubmit.value = true
    if (emailError.value || passwordError.value || confirmError.value || termsError.value) return

    loading.value = true
    try {
        await auth.register({ email: email.value, password: password.value })
        toast.add({
            severity: 'success',
            summary: 'Registration',
            detail: $t('auth.registerSuccess') as string,
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

<template>
    <div class="card">
        <Toast />
        <header class="head">
            <h1 class="title">{{ $t('auth.createAccount') }}</h1>
            <p class="subtitle">{{ $t('auth.registerDescription') }}</p>
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
                <Password id="password" v-model="password" :feedback="true" toggleMask
                    :placeholder="$t('auth.placeholders.password')" autocomplete="new-password" required fluid
                    :inputProps="{ 'aria-invalid': !!passwordError }" @keydown.enter.prevent="onSubmit" />
            </span>
            <small v-if="passwordError" class="error">{{ passwordError }}</small>

            <!-- Confirm Password -->
            <label class="label" for="confirm">{{ $t('auth.confirmPassword') }}</label>
            <span class="p-input-icon-left w-full">
                <i class="pi pi-check-circle" aria-hidden="true" />
                <Password id="confirm" v-model="confirmPassword" :feedback="false" toggleMask
                    :placeholder="$t('auth.placeholders.confirmPassword')" autocomplete="new-password" required fluid
                    :inputProps="{ 'aria-invalid': !!confirmError }" @keydown.enter.prevent="onSubmit" />
            </span>
            <small v-if="confirmError" class="error">{{ confirmError }}</small>

            <!-- Terms -->
            <div class="row-between mt-2">
                <label class="agree">
                    <Checkbox inputId="terms" v-model="acceptTerms" :binary="true" />
                    <span>
                        {{ $t('auth.iAgree') }}
                        <NuxtLink class="link" to="/terms">{{ $t('auth.termsAndPrivacy') }}</NuxtLink>
                    </span>
                </label>
            </div>
            <small v-if="termsError" class="error">{{ termsError }}</small>

            <Button type="submit" class="mt-3" :loading="loading" :disabled="loading" :label="$t('auth.createAccount')"
                fluid />

            <p class="hint">
                {{ $t('auth.alreadyHaveAccount') }}
                <NuxtLink class="link" to="/login">{{ $t('auth.login') }}</NuxtLink>
            </p>
        </form>
    </div>
</template>

<style scoped>
/* Same glass card aesthetics as login */
.card {
    position: relative;
    border-radius: 18px;
    padding: 20px 18px 16px;
    backdrop-filter: blur(14px) saturate(120%);
    -webkit-backdrop-filter: blur(14px) saturate(120%);
    background: rgba(10, 15, 18, .55);
    border: 1px solid rgba(148, 163, 184, .16);
    box-shadow:
        0 24px 60px rgba(0, 0, 0, .45),
        inset 0 1px 0 rgba(255, 255, 255, .05);
    animation: pop .24s ease-out;
}

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

.p-input-icon-left>i {
    left: .65rem;
    color: #93a1b1;
}

.p-input-icon-left :deep(.p-inputtext),
.p-input-icon-left :deep(.p-password input) {
    padding-left: 2.2rem;
}

.error {
    color: #f87171;
    font-size: .82rem;
    margin-top: .25rem;
}

.row-between {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: .75rem;
}

.agree {
    display: inline-flex;
    align-items: center;
    gap: .5rem;
    color: #cbd5e1;
}

.mt-2 {
    margin-top: .6rem;
}

.mt-3 {
    margin-top: 1rem;
}

.hint {
    margin-top: 1rem;
    font-size: .92rem;
    color: #d1d5db;
}

.link {
    text-underline-offset: 3px;
}

:deep(input):focus-visible,
:deep(.p-password input):focus-visible,
:deep(.p-button):focus-visible {
    outline: 2px solid rgba(16, 185, 129, .55);
    outline-offset: 2px;
    border-radius: 10px;
}

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
