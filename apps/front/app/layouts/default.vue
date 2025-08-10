<template>
    <div class="container">
        <header class="header">
            <NuxtLink to="/">OweLess</NuxtLink>
            <nav>
                <NuxtLink to="/" v-if="auth.isAuthenticated">Dashboard</NuxtLink>
                <NuxtLink to="/debts" v-if="auth.isAuthenticated">Debts</NuxtLink>
            </nav>
            <div>
                <button v-if="!auth.isAuthenticated" @click="goLogin">{{ $t('auth.login') }}</button>
                <button v-if="auth.isAuthenticated" @click="logout">{{ $t('auth.logout') }}</button>
            </div>
            <strong>{{ $t('common.appName') }}</strong>
            <div class="spacer" />
            <Dropdown v-model="settings.locale" :options="locales" optionLabel="label" optionValue="value" class="mr" />
            <Dropdown v-model="settings.currency" :options="currencies" optionLabel="label" optionValue="value" />
        </header>
        <main>
            <slot />
        </main>
    </div>
</template>

<script setup lang="ts">
import Dropdown from 'primevue/dropdown'
import { useSettingsStore } from '~/stores/settings'
import { useAuthStore } from '~/stores/auth'
const settings = useSettingsStore()
const locales = [{ label: 'English', value: 'en-US' }, { label: 'Português (Brasil)', value: 'pt-BR' }]
const currencies = [{ label: 'USD', value: 'USD' }, { label: 'BRL', value: 'BRL' }, { label: 'EUR', value: 'EUR' }]
const { $t } = useNuxtApp()
const auth = useAuthStore()
const goLogin = () => navigateTo('/login')
const logout = () => {
    auth.logout()
    navigateTo('/login')
}
</script>

<style scoped>
.container {
    max-width: 1040px;
    margin: 0 auto;
    padding: 1rem;
}

.header {
    display: flex;
    gap: 1rem;
    align-items: center;
    justify-content: space-between;
}

nav a {
    margin-right: .75rem;
}
</style>
