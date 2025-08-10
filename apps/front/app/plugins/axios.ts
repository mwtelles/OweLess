import axios from 'axios'
import type { AxiosInstance } from 'axios'
import { useAuthStore } from '~/stores/auth'

let api: AxiosInstance

export default defineNuxtPlugin(() => {
    const config = useRuntimeConfig()
    api = axios.create({
        baseURL: config.public.apiBase,
        withCredentials: false,
        timeout: 15000
    })

    api.interceptors.request.use((req) => {
        const auth = useAuthStore()
        const token = auth.accessToken
        if (token) req.headers.Authorization = `Bearer ${token}`
        return req
    })

    api.interceptors.response.use(
        (res) => res,
        async (error) => {
            const auth = useAuthStore()
            if (error?.response?.status === 401) {
                auth.logout()
                if (process.client) {
                    return navigateTo('/login')
                }
            }
            return Promise.reject(error)
        }
    )

    return {
        provide: {
            api
        }
    }
})

export { api }
