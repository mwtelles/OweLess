<template>
    <div class="container">
        <header class="header">
            <NuxtLink to="/">OweLess</NuxtLink>
            <nav>
                <NuxtLink to="/">Dashboard</NuxtLink>
                <NuxtLink to="/">Debts</NuxtLink>
            </nav>
            <div>
                <button v-if="!auth.isAuthenticated" @click="goLogin">Login</button>
                <button v-else @click="logout">Logout</button>
            </div>
        </header>
        <main>
            <slot />
        </main>
    </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
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
