import { useAuthStore } from '~/stores/auth'
export default defineNuxtPlugin(() => {
    const auth = useAuthStore()
    if (!auth.accessToken) auth.loadFromStorage()
})
