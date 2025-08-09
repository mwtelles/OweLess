<script setup lang="ts">
const email = ref('');
const password = ref('');
const { $api } = useNuxtApp();
const auth = useAuthStore();
const router = useRouter();
const loading = ref(false);
const errorMsg = ref('');

const submit = async () => {
    loading.value = true;
    errorMsg.value = '';
    try {
        const { data } = await $api.post('/auth/login', { email: email.value, password: password.value });
        auth.setAuth(data.token, data.user);
        router.push('/me');
    } catch (e: any) {
        errorMsg.value = e?.response?.data?.error ?? 'Login failed';
    } finally {
        loading.value = false;
    }
};
</script>

<template>
    <main style="max-width:420px;margin:64px auto;padding:24px;border:1px solid #eee;border-radius:12px">
        <h1>OweLess – Login</h1>
        <label>Email</label>
        <input v-model="email" type="email" style="width:100%;margin-bottom:8px" />
        <label>Password</label>
        <input v-model="password" type="password" style="width:100%;margin-bottom:16px" />
        <button :disabled="loading" @click="submit">Login</button>
        <p v-if="errorMsg" style="color:#c00;margin-top:12px">{{ errorMsg }}</p>
    </main>
</template>
