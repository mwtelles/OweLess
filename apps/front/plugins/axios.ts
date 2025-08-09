import axios from 'axios';
import { useAuthStore } from '~/stores/auth';

export default defineNuxtPlugin(() => {
    const api = axios.create({
        baseURL: import.meta.env.NUXT_PUBLIC_API_BASE || 'http://localhost:1313'
    });

    api.interceptors.request.use((config) => {
        const auth = useAuthStore();
        if (auth.token) {
            config.headers = config.headers || {};
            (config.headers as any).Authorization = `Bearer ${auth.token}`;
        }
        return config;
    });

    api.interceptors.response.use(
        (r) => r,
        (err) => {
            if (err.response?.status === 401) {
                const auth = useAuthStore();
                auth.clear();
            }
            return Promise.reject(err);
        }
    );

    return {
        provide: { api }
    };
});
