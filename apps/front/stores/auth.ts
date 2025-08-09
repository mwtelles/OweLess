import { defineStore } from 'pinia';

type User = { id: number; email: string } | null;

export const useAuthStore = defineStore('auth', {
    state: () => ({
        token: (process.client ? localStorage.getItem('oweless:token') : null) as string | null,
        user: null as User
    }),
    actions: {
        setAuth(token: string, user: User) {
            this.token = token;
            this.user = user;
            if (process.client) localStorage.setItem('oweless:token', token);
        },
        clear() {
            this.token = null;
            this.user = null;
            if (process.client) localStorage.removeItem('oweless:token');
        }
    }
});
