import { defineStore } from 'pinia'

type LoginPayload = { email: string; password: string }
type RegisterPayload = { email: string; password: string }

export const useAuthStore = defineStore('auth', {
    state: () => ({
        accessToken: '' as string,
        user: null as null | { id: number; email: string }
    }),
    getters: {
        isAuthenticated: (s) => !!s.accessToken
    },
    actions: {
        loadFromStorage() {
            if (process.client) {
                const token = localStorage.getItem('oweless:accessToken') || ''
                const userRaw = localStorage.getItem('oweless:user') || 'null'
                this.accessToken = token
                this.user = JSON.parse(userRaw)
            }
        },
        persist() {
            if (process.client) {
                localStorage.setItem('oweless:accessToken', this.accessToken || '')
                localStorage.setItem('oweless:user', JSON.stringify(this.user))
            }
        },
        async login(payload: LoginPayload) {
            const { $api } = useNuxtApp()
            const res = await $api.post('/auth/login', payload)
            // expected: { accessToken, user }
            this.accessToken = res.data.accessToken
            this.user = res.data.user
            this.persist()
        },
        async register(payload: RegisterPayload) {
            const { $api } = useNuxtApp()
            const res = await $api.post('/auth/register', payload)
            // could auto-login if backend returns token; for now just return success
            return res.data
        },
        logout() {
            this.accessToken = ''
            this.user = null
            if (process.client) {
                localStorage.removeItem('oweless:accessToken')
                localStorage.removeItem('oweless:user')
            }
        }
    }
})
