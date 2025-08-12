<template>
    <div class="app-shell">
        <!-- Animated background -->
        <div class="bg" aria-hidden="true"></div>

        <!-- Sidebar -->
        <Sidebar :open="mobileOpen || isDesktop" @close="mobileOpen = false" @logout="logout" />

        <!-- Right pane -->
        <div class="pane">
            <header class="top" role="banner">
                <button class="icon-btn md-hidden" :aria-label="$t('common.openMenu')" @click="mobileOpen = true">
                    <span class="bar" /><span class="bar" /><span class="bar" />
                </button>

                <div class="crumbs">
                    <strong class="brand-name">OweLess</strong>
                    <span class="brand-tag">{{ $t('common.appName') }}</span>
                </div>

                <div class="spacer" />

                <div class="settings">
                    <button class="btn ghost" :aria-expanded="settingsOpen ? 'true' : 'false'"
                        @click="settingsOpen = !settingsOpen">
                        <i class="pi pi-sliders-h" aria-hidden="true" /><span class="hide-sm">{{ $t('nav.settings')
                        }}</span>
                    </button>
                    <div v-if="settingsOpen" class="popover">
                        <div class="popover-group">
                            <label for="locale">{{ $t('settings.language') }}</label>
                            <Dropdown id="locale" v-model="settings.locale" :options="locales" optionLabel="label"
                                optionValue="value" class="w-full" />
                        </div>
                        <div class="popover-group">
                            <label for="currency">{{ $t('settings.currency') }}</label>
                            <Dropdown id="currency" v-model="settings.currency" :options="currencies"
                                optionLabel="label" optionValue="value" class="w-full" />
                        </div>
                    </div>
                </div>

                <div class="user-menu" v-if="auth.isAuthenticated">
                    <button class="btn ghost" @click="userOpen = !userOpen"
                        :aria-expanded="userOpen ? 'true' : 'false'">
                        <i class="pi pi-user" aria-hidden="true" /><span class="hide-sm">{{ auth.user?.email || 'User'
                        }}</span>
                    </button>
                    <div v-if="userOpen" class="popover">
                        <NuxtLink to="/" class="menu-item">{{ $t('nav.dashboard') }}</NuxtLink>
                        <NuxtLink to="/debts" class="menu-item">{{ $t('nav.debts') }}</NuxtLink>
                        <hr />
                        <button class="menu-item danger" @click="logout">{{ $t('auth.logout') }}</button>
                    </div>
                </div>
            </header>

            <main class="content" role="main">
                <slot />
            </main>
        </div>

        <!-- Mobile backdrop -->
        <div v-if="mobileOpen && !isDesktop" class="backdrop" @click="mobileOpen = false" aria-hidden="true" />
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

const goLogin = () => navigateTo('/login')
const logout = () => { auth.logout(); navigateTo('/login') }

const onResize = () => { isDesktop.value = window.innerWidth >= 900 }
onMounted(() => { onResize(); window.addEventListener('resize', onResize) })
onBeforeUnmount(() => { window.removeEventListener('resize', onResize) })

if (process.client) {
    window.addEventListener('click', (e) => {
        const target = e.target as HTMLElement
        if (!target.closest('.settings')) settingsOpen.value = false
        if (!target.closest('.user-menu')) userOpen.value = false
    })
}
</script>

<style scoped>
.app-shell {
    position: relative;
    min-height: 100svh;
    height: 100svh;
    display: grid;
    grid-template-columns: auto 1fr;
    overflow: hidden;
    background: #07090b;
}

.pane {
    position: relative;
    z-index: 1;
    display: grid;
    grid-template-rows: auto 1fr;
    height: 100%;
    min-height: 0;
}

.content {
    position: relative;
    z-index: 1;
    padding: 1rem;
    overflow: auto;
    min-height: 0;
}

.bg {
    position: absolute;
    inset: 0;
    pointer-events: none;
    overflow: hidden;
    z-index: 0;
}

.bg::before {
    content: "";
    position: absolute;
    inset: -20vmax;
    background: radial-gradient(1100px 900px at 10% -10%, rgba(0, 0, 0, .35), transparent 60%);
    z-index: 0;
}

.bg::after {
    content: "";
    position: absolute;
    right: -18vmax;
    bottom: -18vmax;
    width: 80vmax;
    height: 80vmax;
    border-radius: 50%;
    background: radial-gradient(closest-side at 50% 50%, rgba(16, 185, 129, .38), rgba(16, 185, 129, .14) 45%, transparent 70%);
    filter: blur(20px) saturate(120%);
    will-change: transform;
    animation: blob 16s ease-in-out infinite alternate;
    z-index: 0;
}

@keyframes blob {
    0% {
        transform: translate(0, 0) scale(1) rotate(0deg);
    }

    100% {
        transform: translate(-6vmax, -5vmax) scale(1.08) rotate(4deg);
    }
}

/* Top bar */
.top {
    position: sticky;
    top: 0;
    z-index: 3;
    display: flex;
    align-items: center;
    gap: .6rem;
    padding: .65rem .75rem;
    height: 3rem;
    background: rgba(12, 14, 18, .55);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    border-bottom: 1px solid rgba(148, 163, 184, .12);
}

.icon-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 42px;
    height: 42px;
    border-radius: .6rem;
    border: 1px solid rgba(148, 163, 184, .16);
    background: transparent;
    color: #e5e7eb;
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

.crumbs {
    display: inline-flex;
    align-items: baseline;
    gap: .5rem;
    color: #e5e7eb;
}

.brand-name {
    font-weight: 800;
    letter-spacing: .2px;
}

.brand-tag {
    opacity: .65;
    font-size: .85rem;
}

.spacer {
    flex: 1;
}

.btn {
    padding: .45rem .7rem;
    border-radius: .6rem;
    border: 1px solid rgba(148, 163, 184, .16);
    color: #e5e7eb;
    background: transparent;
}

.btn.primary {
    background: #844aff;
    border-color: transparent;
}

.btn.ghost {
    background: transparent;
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
    background: rgba(14, 16, 20, .95);
    border: 1px solid rgba(148, 163, 184, .18);
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
    opacity: .85;
    color: #e5e7eb;
}

.menu-item {
    display: block;
    width: 100%;
    text-align: left;
    padding: .5rem .6rem;
    border-radius: .5rem;
    text-decoration: none;
    color: #e5e7eb;
}

.menu-item:hover {
    background: rgba(148, 163, 184, .12);
}

.menu-item.danger {
    color: #ff6b6b;
}

.hide-sm {
    display: none;
}

/* Mobile */
.backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, .45);
    z-index: 4;
}

@media (max-width: 900px) {
    .app-shell {
        grid-template-columns: 1fr;
    }

    .pane {
        grid-column: 1 / -1;
    }

    .hide-sm {
        display: none;
    }
}

/* Let Sidebar slide from the left on mobile: app controls via width/transform in Sidebar parent */
.md-hidden {
    display: inline-flex;
}

@media (min-width: 900px) {
    .md-hidden {
        display: none;
    }
}
</style>
