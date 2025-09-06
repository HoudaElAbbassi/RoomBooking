// nuxt-app/middleware/auth.js
// Middleware zum Schutz von Routen (nur für eingeloggte Benutzer)
export default defineNuxtRouteMiddleware((to, from) => {
    const userStore = useUserStore()

    // Überprüfe ob der Benutzer eingeloggt ist
    if (!userStore.isAuthenticated) {
        // Versuche Token aus localStorage zu verifizieren
        if (process.client) {
            const token = localStorage.getItem('auth_token')
            if (token) {
                // Lade Benutzerdaten aus localStorage
                userStore.initializeAuth()

                // Verifiziere Token im Hintergrund
                userStore.verifyToken().then(isValid => {
                    if (!isValid) {
                        return navigateTo('/login')
                    }
                })

                // Erlaube Navigation, Verifikation läuft im Hintergrund
                return
            }
        }

        // Kein Token gefunden, leite zum Login weiter
        return navigateTo('/login')
    }
})