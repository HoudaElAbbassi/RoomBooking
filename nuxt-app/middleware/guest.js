// nuxt-app/middleware/guest.js
export default defineNuxtRouteMiddleware((to, from) => {
    const userStore = useUserStore()

    // Wenn Benutzer bereits eingeloggt ist, leite zur Startseite weiter
    if (userStore.isAuthenticated) {
        return navigateTo('/')
    }
})