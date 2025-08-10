<script setup lang="ts">
import { useAuthStore } from '~/stores/auth';

const { $api } = useNuxtApp();
const auth = useAuthStore();
const me = ref<any>(null);
const errorMsg = ref('');

onMounted(async () => {
    try {
        const { data } = await $api.get('/me');
        me.value = data.user;
    } catch (e: any) {
        errorMsg.value = e?.response?.data?.error ?? 'Unauthorized';
    }
});
</script>

<template>
    <main style="max-width:720px;margin:64px auto;padding:24px">
        <h1>My Account</h1>
        <pre v-if="me">{{ me }}</pre>
        <p v-else-if="errorMsg" style="color:#c00">{{ errorMsg }}</p>
        <button @click="auth.logout()">Logout</button>
    </main>
</template>
