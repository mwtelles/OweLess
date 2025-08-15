<template>
    <div class="layout-container">
        <div class="layout-wrapper">
            <!-- Sidebar -->
            <aside class="layout-sidebar">
                <Sidebar :open="mobileOpen || isDesktop" @close="mobileOpen = false" @logout="logout" />
            </aside>

            <!-- Main -->
            <div class="layout-main">
                <header class="layout-header">
                    <button class="icon-btn md-hidden" @click="mobileOpen = true">
                        <span class="bar" /><span class="bar" /><span class="bar" />
                    </button>

                    <div class="crumbs">
                        <strong class="brand-name">OweLess</strong>
                        <span class="brand-tag">{{ $t('common.appName') }}</span>
                    </div>

                    <div class="spacer" />

                    <div class="settings">
                        <button class="btn ghost" @click="settingsOpen = !settingsOpen">
                            <i class="pi pi-sliders-h" />
                            <span class="hide-sm">{{ $t('nav.settings') }}</span>
                        </button>
                        <div v-if="settingsOpen" class="popover">
                            <div class="popover-group">
                                <label>{{ $t('settings.language') }}</label>
                                <Dropdown v-model="settings.locale" :options="locales" optionLabel="label"
                                    optionValue="value" />
                            </div>
                            <div class="popover-group">
                                <label>{{ $t('settings.currency') }}</label>
                                <Dropdown :options="currencies" optionLabel="label" optionValue="value" />
                            </div>
                        </div>
                    </div>

                    <div class="user-menu" v-if="auth.isAuthenticated">
                        <button class="btn ghost" @click="userOpen = !userOpen">
                            <i class="pi pi-user" />
                            <span class="hide-sm">{{ auth.user?.email || 'User' }}</span>
                        </button>
                        <div v-if="userOpen" class="popover">
                            <NuxtLink to="/" class="menu-item">{{ $t('nav.dashboard') }}</NuxtLink>
                            <NuxtLink to="/debts" class="menu-item">{{ $t('nav.debts') }}</NuxtLink>
                            <hr />
                            <button class="menu-item danger" @click="logout">{{ $t('auth.logout') }}</button>
                        </div>
                    </div>
                </header>

                <main class="layout-content">
                    <slot />
                </main>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import Dropdown from 'primevue/dropdown'
import Sidebar from '~/components/Sidebar.vue'
import { useSettingsStore } from '~/stores/settings'
import { useAuthStore } from '~/stores/auth'

const { $t } = useNuxtApp()
const auth = useAuthStore()
const settings = useSettingsStore()

const mobileOpen = ref(false)
const settingsOpen = ref(false)
const userOpen = ref(false)
const isDesktop = ref(false)

const locales = [
    { label: 'English', value: 'en-US' },
    { label: 'Português (Brasil)', value: 'pt-BR' }
]
const currencies = [
    { label: 'USD', value: 'USD' },
    { label: 'BRL', value: 'BRL' },
    { label: 'EUR', value: 'EUR' }
]

const logout = () => {
    auth.logout()
    navigateTo('/login')
}

const onResize = () => { isDesktop.value = window.innerWidth >= 900 }
onMounted(() => { onResize(); window.addEventListener('resize', onResize) })
onBeforeUnmount(() => { window.removeEventListener('resize', onResize) })
</script>
