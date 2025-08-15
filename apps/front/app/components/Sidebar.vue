<template>
    <aside class="sidebar" role="navigation" aria-label="Sidebar">
        <!-- Logo -->
        <div class="sidebar-header">
            <NuxtLink to="/" class="sidebar-logo" title="Dashboard">
                💰
            </NuxtLink>
        </div>

        <!-- Nav -->
        <nav class="sidebar-nav">
            <template v-for="item in items" :key="item.to">
                <Tooltip :text="item.label" placement="right">
                    <NuxtLink :to="item.to" class="nav-item" :class="{ active: isActive(item) }">
                        <i :class="item.icon" />
                    </NuxtLink>
                </Tooltip>
            </template>
        </nav>



        <div class="sidebar-spacer" />

        <div class="sidebar-footer">
            <!-- Theme Toggle -->
            <button class="nav-item" :title="$t('common.toggleTheme')" @click="toggleTheme">
                <i :class="themeIcon" />
            </button>


            <!-- Profile Dropdown -->
            <div ref="profileRef" class="sidebar-profile" @click="toggleProfileMenu" title="Conta">
                <div class="avatar">{{ initials }}</div>
                <div v-if="profileOpen" class="profile-dropdown">
                    <NuxtLink to="/settings" class="dropdown-item">
                        <i class="pi pi-cog" /> {{ $t('nav.settings') }}
                    </NuxtLink>
                    <button class="dropdown-item danger" @click="$emit('logout')">
                        <i class="pi pi-sign-out" /> {{ $t('auth.logout') }}
                    </button>
                </div>
            </div>
        </div>
    </aside>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '~/stores/auth'
import { useThemeStore } from '~/stores/theme'
import '~/assets/css/sidebar.css'

const { $t } = useNuxtApp()
const route = useRoute()
const auth = useAuthStore()
const theme = useThemeStore()

// --- Theme toggle
const themeIcon = computed(() =>
    theme.mode === 'light' ? 'pi pi-moon' : 'pi pi-sun'
)
function toggleTheme() {
    theme.toggleTheme()
}

// --- Nav items
type NavItem = { to: string; label: string; icon: string }
const items = computed<NavItem[]>(() => [
    { to: '/', label: $t('nav.dashboard'), icon: 'pi pi-home' },
    { to: '/debts', label: $t('nav.debts'), icon: 'pi pi-wallet' },
    { to: '/reports', label: $t('nav.reports'), icon: 'pi pi-chart-line' }
])

function isActive(item: { to: string }) {
    return item.to === '/' ? route.path === '/' : route.path.startsWith(item.to)
}

// --- Profile dropdown
const profileOpen = ref(false)
const profileRef = ref<HTMLElement | null>(null)

function toggleProfileMenu() {
    profileOpen.value = !profileOpen.value
}

function handleClickOutside(e: MouseEvent) {
    if (profileRef.value && !profileRef.value.contains(e.target as Node)) {
        profileOpen.value = false
    }
}

onMounted(() => {
    document.addEventListener('click', handleClickOutside)
})
onBeforeUnmount(() => {
    document.removeEventListener('click', handleClickOutside)
})

const initials = computed(() => (auth.user?.email || 'U').slice(0, 2).toUpperCase())
</script>
