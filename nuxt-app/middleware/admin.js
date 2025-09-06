// nuxt-app/middleware/admin.js
export default defineNuxtRouteMiddleware((to, from) => {
    const userStore = useUserStore()

    // Überprüfe ob der Benutzer eingeloggt ist
    if (!userStore.isAuthenticated) {
        return navigateTo('/login')
    }

    // Überprüfe ob der Benutzer Admin-Rechte hat
    if (!userStore.isAdmin) {
        throw createError({
            statusCode: 403,
            statusMessage: 'Zugriff verweigert. Admin-Rechte erforderlich.'
        })
    }
})