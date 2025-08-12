<template>
    <aside class="side" :class="{
        open: open,
        collapsed: localCollapsed,
        'hover-expand': hoverExpand && !open
    }" role="navigation" aria-label="Sidebar" @mouseenter="onHover(true)" @mouseleave="onHover(false)">
        <!-- Brand / controls -->
        <div class="side-brand">
            <NuxtLink to="/" class="brand" aria-label="Go to home">
                <span class="logo">OweLess</span>
            </NuxtLink>

            <!-- Collapse toggle (desktop only) -->
            <button class="icon-btn collapse-btn" :aria-label="localCollapsed ? 'Expand menu' : 'Collapse menu'"
                @click="toggleCollapse">
                <i :class="localCollapsed ? 'pi pi-angle-double-right' : 'pi pi-angle-double-left'" />
            </button>

            <!-- Close (mobile only) -->
            <button class="icon-btn md-hidden" :aria-label="$t('common.close')" @click="$emit('close')">
                ✕
            </button>
        </div>

        <!-- Navigation -->
        <nav class="side-nav">
            <NuxtLink v-for="item in items" :key="item.to" :to="item.to" class="nav-item"
                :class="{ active: isActive(item) }" :aria-current="isActive(item) ? 'page' : undefined"
                :data-tip="localCollapsed ? item.label : null">
                <i :class="item.icon" aria-hidden="true" />
                <span class="label">{{ item.label }}</span>
                <em v-if="item.badge" class="badge">{{ item.badge }}</em>
            </NuxtLink>
        </nav>

        <!-- Footer / utilities -->
        <div class="side-footer">
            <NuxtLink to="/settings" class="nav-item small" :data-tip="localCollapsed ? $t('nav.settings') : null">
                <i class="pi pi-cog" aria-hidden="true" />
                <span class="label">{{ $t('nav.settings') }}</span>
            </NuxtLink>

            <button class="nav-item small danger" @click="$emit('logout')"
                :data-tip="localCollapsed ? $t('auth.logout') : null">
                <i class="pi pi-sign-out" aria-hidden="true" />
                <span class="label">{{ $t('auth.logout') }}</span>
            </button>

            <!-- Profile (optional mini) -->
            <div class="profile" :class="{ hide: localCollapsed }" aria-hidden="true">
                <div class="avatar">{{ initials }}</div>
                <div class="meta">
                    <strong class="name">{{ userLabel }}</strong>
                    <span class="role">Member</span>
                </div>
            </div>
        </div>
    </aside>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useAuthStore } from '~/stores/auth'

const props = withDefaults(defineProps<{
    open: boolean                  // controlled by parent (mobile)
    collapsed?: boolean            // external state, optional
    hoverExpand?: boolean          // expand on hover (desktop)
}>(), {
    collapsed: false,
    hoverExpand: true
})

const emit = defineEmits<{
    (e: 'close'): void
    (e: 'logout'): void
    (e: 'update:collapsed', value: boolean): void
}>()

const route = useRoute()
const auth = useAuthStore()

const localCollapsed = ref<boolean>(props.collapsed)
watch(() => props.collapsed, v => { if (v !== undefined) localCollapsed.value = v })

function toggleCollapse() {
    localCollapsed.value = !localCollapsed.value
    emit('update:collapsed', localCollapsed.value)
}

function onHover(enter: boolean) {
    // if hoverExpand is enabled and collapsed, we only visually expand via CSS
    // no JS state change needed
}

const items = computed(() => ([
    { to: '/', label: (useNuxtApp().$t('nav.dashboard') as string) || 'Dashboard', icon: 'pi pi-home' },
    { to: '/debts', label: (useNuxtApp().$t('nav.debts') as string) || 'Debts', icon: 'pi pi-wallet', badge: undefined },
    { to: '/reports', label: (useNuxtApp().$t('nav.reports') as string) || 'Reports', icon: 'pi pi-chart-line', badge: undefined }
]))

function isActive(item: { to: string }) {
    return item.to === '/' ? route.path === '/' : route.path.startsWith(item.to)
}

const userLabel = computed(() => auth.user?.email || 'User')
const initials = computed(() => {
    const e = auth.user?.email || ''
    const base = e.split('@')[0] || 'U'
    return base.slice(0, 2).toUpperCase()
})
</script>

<style scoped>
/* ---------- Vars (tweak here) ---------- */
.side {
    --w: 240px;
    --rail: 72px;
    --item-h: 48px;
    --radius: 14px;
    --surface: rgba(12, 14, 18, .68);
    --border: rgba(148, 163, 184, .16);
    --hover: rgba(148, 163, 184, .10);
    --active: rgba(148, 163, 184, .18);
    --text: #e5e7eb;
    --accent: #10b981;
    /* green */
}

/* ---------- Frame ---------- */
.side {
    position: relative;
    z-index: 2;
    width: var(--w);
    min-width: var(--w);
    height: 100svh;
    display: grid;
    grid-template-rows: auto 1fr auto;
    background: var(--surface);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-right: 1px solid var(--border);
    overflow: hidden;
    transition: width .22s ease, min-width .22s ease, box-shadow .22s ease;
    box-shadow: 0 10px 30px rgba(0, 0, 0, .25);
}

/* subtle gradient rim */
.side::after {
    content: "";
    position: absolute;
    inset: -1px 0 -1px -1px;
    pointer-events: none;
    z-index: -1;
    filter: blur(12px);
}

.side.collapsed {
    width: var(--rail);
    min-width: var(--rail);
}

/* Hover expand (desktop only) */
@media (min-width: 901px) {
    .side.collapsed.hover-expand:hover {
        width: var(--w);
    }
}

/* ---------- Brand & controls ---------- */
.side-brand {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: .65rem .6rem .6rem .6rem;
    height: 3rem;
    border-bottom: 1px solid rgba(148, 163, 184, .12);
}

.brand {
    display: inline-flex;
    gap: .45rem;
    text-decoration: none;
    color: var(--text);
}

.logo {
    font-weight: 800;
    letter-spacing: .2px;
    font-size: 1.05rem;
}

.icon-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 10px;
    border: 1px solid var(--border);
    background: transparent;
    color: var(--text);
    transition: transform .16s ease, border-color .16s ease, background-color .16s ease;
}

.icon-btn:hover {
    transform: translateY(-1px);
    border-color: rgba(148, 163, 184, .28);
    background: rgba(148, 163, 184, .06);
}

.collapse-btn {
    display: none;
}

@media (min-width: 901px) {
    .collapse-btn {
        display: inline-flex;
    }
}

.md-hidden {
    display: inline-flex;
}

@media (min-width: 901px) {
    .md-hidden {
        display: none;
    }
}

/* ---------- Nav ---------- */
.side-nav {
    padding: .5rem;
    display: grid;
    gap: .25rem;
    overflow-y: auto;
}

.nav-item {
    position: relative;
    display: flex;
    align-items: center;
    gap: .65rem;
    height: var(--item-h);
    padding: .35rem .55rem;
    border-radius: var(--radius);
    color: var(--text);
    text-decoration: none;
    font-size: .95rem;
    line-height: 1;
    opacity: .96;
    transition: background-color .16s ease, transform .12s ease;
}

.nav-item i {
    width: 22px;
    min-width: 22px;
    text-align: center;
    font-size: 1.05rem;
    opacity: .95;
    transition: transform .12s ease;
}

.nav-item .label {
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    transition: opacity .18s ease, transform .18s ease, width .18s ease, margin .18s ease;
}

/* Active gradient bar + glow */
.nav-item.active::before {
    content: "";
    position: absolute;
    left: 4px;
    top: 10px;
    bottom: 10px;
    width: 3px;
    border-radius: 3px;
    background: linear-gradient(180deg, var(--accent), #22d3ee);
    box-shadow: 0 0 14px rgba(16, 185, 129, .45);
}

/* Hover & press */
.nav-item:hover {
    background: var(--hover);
}

.nav-item:active {
    transform: translateY(1px);
}

.nav-item:hover i {
    transform: translateY(-1px);
}

/* Badge */
.badge {
    display: inline-grid;
    place-items: center;
    min-width: 18px;
    height: 18px;
    padding: 0 4px;
    border-radius: 999px;
    font-size: .72rem;
    font-weight: 700;
    color: #0b1220;
    background: #a7f3d0;
    /* mint */
}

/* Collapsed state: hide labels smoothly */
.side.collapsed .nav-item .label {
    opacity: 0;
    transform: translateX(-6px);
    width: 0;
    margin: 0;
    pointer-events: none;
}

.side.collapsed .nav-item {
    justify-content: center;
}

/* Tooltips when collapsed */
.side.collapsed .nav-item[data-tip]:hover::after {
    content: attr(data-tip);
    position: absolute;
    left: calc(100% + 10px);
    top: 50%;
    transform: translateY(-50%);
    padding: .35rem .5rem;
    border-radius: 8px;
    background: rgba(14, 16, 20, .95);
    border: 1px solid rgba(148, 163, 184, .25);
    color: var(--text);
    font-size: .85rem;
    white-space: nowrap;
    box-shadow: 0 10px 24px rgba(0, 0, 0, .45);
}

/* ---------- Footer / profile ---------- */
.side-footer {
    padding: .5rem;
    border-top: 1px solid rgba(148, 163, 184, .12);
    display: grid;
    gap: .25rem;
}

.nav-item.small {
    height: 42px;
    padding: .3rem .5rem;
    font-size: .92rem;
}

.nav-item.danger {
    color: #ff6b6b;
}

.profile {
    margin-top: .4rem;
    display: flex;
    align-items: center;
    gap: .6rem;
    padding: .55rem .6rem;
    border-radius: var(--radius);
    background: rgba(148, 163, 184, .06);
}

.profile.hide {
    display: none;
}

.avatar {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    font-weight: 800;
    font-size: .8rem;
    color: #0b1220;
    background: #a7f3d0;
    /* mint */
}

.meta .name {
    display: block;
    font-weight: 700;
}

.meta .role {
    display: block;
    font-size: .8rem;
    opacity: .75;
}

/* ---------- Mobile off-canvas ---------- */
@media (max-width: 900px) {
    .side {
        position: fixed;
        inset: 0 auto 0 0;
        transform: translateX(-100%);
        transition: transform .22s ease, width .22s ease, min-width .22s ease;
        width: min(82vw, 320px);
        min-width: min(82vw, 320px);
    }

    .side.open {
        transform: translateX(0);
    }
}
</style>
