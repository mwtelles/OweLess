<!-- layouts/default.vue -->
<template>
    <div class="app-shell">
        <!-- Top Navbar -->
        <header class="navbar" role="banner">
            <!-- Left: Brand + Mobile menu -->
            <div class="nav-left">
                <button class="icon-btn md-hidden" :aria-label="$t('common.openMenu')" @click="mobileOpen = true">
                    <!-- simple hamburger -->
                    <span class="bar" />
                    <span class="bar" />
                    <span class="bar" />
                </button>

                <NuxtLink to="/" class="brand" aria-label="Go to home">
                    <strong class="brand-name">OweLess</strong>
                    <span class="brand-tag">{{ $t('common.appName') }}</span>
                </NuxtLink>
            </div>

            <!-- Center: Primary nav (desktop only) -->
            <nav class="nav-center sm-hidden" role="navigation" aria-label="Primary">
                <NuxtLink v-if="auth.isAuthenticated" to="/" :class="['nav-link', { active: route.path === '/' }]">
                    {{ $t('nav.dashboard') }}
                </NuxtLink>
                <NuxtLink v-if="auth.isAuthenticated" to="/debts"
                    :class="['nav-link', { active: route.path.startsWith('/debts') }]">
                    {{ $t('nav.debts') }}
                </NuxtLink>
            </nav>

            <!-- Right: Actions -->
            <div class="nav-right">
                <!-- Settings dropdown -->
                <div class="settings">
                    <button class="btn ghost" :aria-expanded="settingsOpen ? 'true' : 'false'"
                        :aria-controls="'settings-popover'" @click="settingsOpen = !settingsOpen">
                        {{ $t('nav.settings') }}
                    </button>
                    <div v-if="settingsOpen" id="settings-popover" class="popover" @keydown.esc="settingsOpen = false">
                        <div class="popover-group">
                            <label for="locale">{{ $t('settings.language') }}</label>
                            <Dropdown id="locale" v-model="settings.locale" :options="locales" optionLabel="label"
                                optionValue="value" class="w-full" :aria-label="$t('settings.language')" />
                        </div>

                        <div class="popover-group">
                            <label for="currency">{{ $t('settings.currency') }}</label>
                            <Dropdown id="currency" v-model="settings.currency" :options="currencies"
                                optionLabel="label" optionValue="value" class="w-full"
                                :aria-label="$t('settings.currency')" />
                        </div>
                    </div>
                </div>

                <!-- Auth area -->
                <div class="auth">
                    <button v-if="!auth.isAuthenticated" class="btn primary" @click="goLogin">
                        {{ $t('auth.login') }}
                    </button>

                    <div v-else class="user-menu">
                        <button class="btn ghost" @click="userOpen = !userOpen"
                            :aria-expanded="userOpen ? 'true' : 'false'">
                            {{ auth.user?.email || 'User' }}
                        </button>
                        <div v-if="userOpen" class="popover" @keydown.esc="userOpen = false">
                            <NuxtLink to="/" class="menu-item">{{ $t('nav.dashboard') }}</NuxtLink>
                            <NuxtLink to="/debts" class="menu-item">{{ $t('nav.debts') }}</NuxtLink>
                            <hr />
                            <button class="menu-item danger" @click="logout">{{ $t('auth.logout') }}</button>
                        </div>
                    </div>
                </div>
            </div>
        </header>

        <!-- Mobile Sidebar -->
        <transition name="slide">
            <aside v-if="mobileOpen" class="sidebar" role="dialog" aria-modal="true">
                <div class="sidebar-header">
                    <strong>OweLess</strong>
                    <button class="icon-btn" :aria-label="$t('common.close')" @click="mobileOpen = false">✕</button>
                </div>

                <nav class="sidebar-nav" aria-label="Mobile">
                    <NuxtLink v-if="auth.isAuthenticated" to="/" class="sidebar-link" @click="mobileOpen = false">
                        {{ $t('nav.dashboard') }}
                    </NuxtLink>
                    <NuxtLink v-if="auth.isAuthenticated" to="/debts" class="sidebar-link" @click="mobileOpen = false">
                        {{ $t('nav.debts') }}
                    </NuxtLink>
                </nav>

                <div class="sidebar-section">
                    <h4>{{ $t('nav.settings') }}</h4>
                    <div class="field">
                        <label for="locale-m">{{ $t('settings.language') }}</label>
                        <Dropdown id="locale-m" v-model="settings.locale" :options="locales" optionLabel="label"
                            optionValue="value" class="w-full" />
                    </div>
                    <div class="field">
                        <label for="currency-m">{{ $t('settings.currency') }}</label>
                        <Dropdown id="currency-m" v-model="settings.currency" :options="currencies" optionLabel="label"
                            optionValue="value" class="w-full" />
                    </div>
                </div>

                <div class="sidebar-footer">
                    <button v-if="!auth.isAuthenticated" class="btn primary w-full"
                        @click="(mobileOpen = false, goLogin())">
                        {{ $t('auth.login') }}
                    </button>
                    <button v-else class="btn danger w-full" @click="(mobileOpen = false, logout())">
                        {{ $t('auth.logout') }}
                    </button>
                </div>
            </aside>
        </transition>

        <!-- Main content -->
        <main class="content" role="main">
            <slot />
        </main>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import Dropdown from 'primevue/dropdown'
import { useSettingsStore } from '~/stores/settings'
import { useAuthStore } from '~/stores/auth'

const { $t } = useNuxtApp()
const route = useRoute()
const auth = useAuthStore()
const settings = useSettingsStore()

// UI state
const mobileOpen = ref(false)
const settingsOpen = ref(false)
const userOpen = ref(false)

// Options
const locales = [
    { label: 'English', value: 'en-US' },
    { label: 'Português (Brasil)', value: 'pt-BR' }
]
const currencies = [
    { label: 'USD', value: 'USD' },
    { label: 'BRL', value: 'BRL' },
    { label: 'EUR', value: 'EUR' }
]

// Actions
const goLogin = () => navigateTo('/login')
const logout = () => {
    auth.logout()
    navigateTo('/login')
}

// Close popovers when clicking outside (optional minimal)
if (process.client) {
    window.addEventListener('click', (e) => {
        const target = e.target as HTMLElement
        if (!target.closest('.settings')) settingsOpen.value = false
        if (!target.closest('.user-menu')) userOpen.value = false
    })
}
</script>

<style scoped>
/* --- Layout shell --- */
.app-shell {
    min-height: 100vh;
    display: grid;
    grid-template-rows: auto 1fr;
}

/* --- Navbar --- */
.navbar {
    position: sticky;
    top: 0;
    z-index: 50;
    display: flex;
    align-items: center;
    gap: 1rem;
    justify-content: space-between;
    padding: 0.75rem 1rem;
    background: var(--surface-0, #101114);
    border-bottom: 1px solid var(--surface-2, #23262d);
}

.nav-left {
    display: flex;
    align-items: center;
    gap: .75rem;
}

.brand {
    display: inline-flex;
    align-items: baseline;
    gap: .5rem;
    text-decoration: none;
}

.brand-name {
    font-weight: 800;
    letter-spacing: .2px;
}

.brand-tag {
    opacity: .6;
    font-size: .85rem;
}

/* Center nav (desktop) */
.nav-center {
    display: flex;
    gap: .5rem;
}

.nav-link {
    padding: .5rem .75rem;
    border-radius: .5rem;
    text-decoration: none;
    opacity: .9;
}

.nav-link:hover {
    opacity: 1;
}

.nav-link.active {
    background: var(--surface-2, #23262d);
}

/* Right side */
.nav-right {
    display: flex;
    align-items: center;
    gap: .5rem;
}

.settings,
.user-menu {
    position: relative;
}

.popover {
    position: absolute;
    right: 0;
    margin-top: .5rem;
    min-width: 240px;
    padding: .75rem;
    background: var(--surface-1, #16181d);
    border: 1px solid var(--surface-2, #23262d);
    border-radius: .75rem;
    box-shadow: 0 10px 24px rgba(0, 0, 0, .45);
}

.popover-group {
    display: grid;
    gap: .35rem;
    margin-bottom: .6rem;
}

.popover-group:last-child {
    margin-bottom: 0;
}

.popover label {
    font-size: .8rem;
    opacity: .8;
}

.menu-item {
    display: block;
    width: 100%;
    text-align: left;
    padding: .5rem .6rem;
    border-radius: .5rem;
    text-decoration: none;
}

.menu-item:hover {
    background: var(--surface-2, #23262d);
}

.menu-item.danger {
    color: #ff6b6b;
}

/* Buttons */
.btn {
    padding: .5rem .8rem;
    border-radius: .6rem;
    border: 1px solid transparent;
}

.btn.primary {
    background: #844aff;
    color: white;
}

.btn.ghost {
    background: transparent;
    border-color: var(--surface-2, #23262d);
}

.btn.danger {
    background: #2a0f12;
    border-color: #471a1f;
    color: #ff6b6b;
}

.icon-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 42px;
    height: 42px;
    border-radius: .6rem;
    border: 1px solid var(--surface-2, #23262d);
    background: transparent;
}

.icon-btn .bar {
    display: block;
    width: 18px;
    height: 2px;
    background: currentColor;
}

.icon-btn .bar+.bar {
    margin-top: 3px;
}

/* Sidebar (mobile) */
.slide-enter-active,
.slide-leave-active {
    transition: transform .2s ease, opacity .2s ease;
}

.slide-enter-from,
.slide-leave-to {
    transform: translateX(-8px);
    opacity: 0;
}

.sidebar {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, .4);
    backdrop-filter: blur(2px);
    z-index: 60;
    display: grid;
    grid-template-columns: minmax(260px, 82vw) 1fr;
}

.sidebar>* {
    background: var(--surface-0, #101114);
}

.sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
    border-bottom: 1px solid var(--surface-2, #23262d);
}

.sidebar-nav {
    display: grid;
    padding: .5rem;
}

.sidebar-link {
    padding: .6rem .75rem;
    border-radius: .6rem;
    text-decoration: none;
}

.sidebar-link:hover {
    background: var(--surface-2, #23262d);
}

.sidebar-section {
    padding: .75rem;
    display: grid;
    gap: .75rem;
}

.field {
    display: grid;
    gap: .35rem;
}

.sidebar-footer {
    padding: .75rem;
    border-top: 1px solid var(--surface-2, #23262d);
}

/* Content */
.content {
    max-width: 1040px;
    width: 100%;
    margin: 0 auto;
    padding: 1rem;
}

/* Responsive helpers */
.md-hidden {
    display: inline-flex;
}

.sm-hidden {
    display: none;
}

.w-full {
    width: 100%;
}

@media (min-width: 900px) {
    .md-hidden {
        display: none;
    }

    .sm-hidden {
        display: flex;
    }
}
</style>
