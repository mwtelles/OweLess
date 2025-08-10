import { useAuthStore } from '~/stores/auth'

export default defineNuxtRouteMiddleware((to) => {
    const auth = useAuthStore()
    const publicRoutes = new Set(['/login', '/register'])
    if (publicRoutes.has(to.path)) return

    if (!auth.isAuthenticated) {
        return navigateTo('/login')
    }
})
