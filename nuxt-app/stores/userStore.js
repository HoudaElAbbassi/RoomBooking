// nuxt-app/stores/userStore.js - Mit Mock-Login für lokale Entwicklung
import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
    state: () => ({
        user: null,
        token: null,
        sessionToken: null,
        isAuthenticated: false,
        loading: false,
        error: null
    }),

    getters: {
        isAdmin: (state) => state.user?.role === 'admin',
        isUser: (state) => state.user?.role === 'user',
        userDisplayName: (state) => state.user?.username || 'Guest'
    },

    actions: {
        // Prüfe ob lokale Entwicklung
        isLocalDevelopment() {
            return process.client && (
                window.location.hostname === 'localhost' ||
                window.location.hostname === '127.0.0.1'
            )
        },

        // Mock Login für lokale Entwicklung
        async mockLogin(credentials) {
            console.log('🔧 Using mock login for local development')

            const mockUsers = {
                'admin': {
                    id: 1,
                    username: 'admin',
                    email: 'admin@company.com',
                    role: 'admin'
                },
                'demo': {
                    id: 2,
                    username: 'demo',
                    email: 'demo@company.com',
                    role: 'user'
                }
            }

            // Simuliere Netzwerk-Verzögerung
            await new Promise(resolve => setTimeout(resolve, 800))

            const user = mockUsers[credentials.username]

            if (!user || credentials.password !== 'admin123') {
                throw new Error('Ungültige Anmeldedaten. Verwende admin/admin123 oder demo/admin123')
            }

            const mockToken = `mock-token-${Date.now()}`

            this.user = user
            this.token = mockToken
            this.sessionToken = `mock-session-${Date.now()}`
            this.isAuthenticated = true

            if (process.client) {
                localStorage.setItem('auth_token', mockToken)
                localStorage.setItem('session_token', this.sessionToken)
                localStorage.setItem('user_data', JSON.stringify(user))
                localStorage.setItem('mock_mode', 'true')
            }

            return { success: true, user }
        },

        // Production Login
        async productionLogin(credentials) {
            const response = await fetch('/.netlify/functions/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(credentials)
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.message || data.error || 'Login failed')
            }

            this.user = data.user
            this.token = data.token
            this.sessionToken = data.sessionToken
            this.isAuthenticated = true

            if (process.client) {
                localStorage.setItem('auth_token', data.token)
                localStorage.setItem('session_token', data.sessionToken)
                localStorage.setItem('user_data', JSON.stringify(data.user))
                localStorage.removeItem('mock_mode')
            }

            return { success: true, user: data.user }
        },

        // Login action - automatische Auswahl zwischen Mock und Production
        async login(credentials) {
            this.loading = true
            this.error = null

            try {
                if (this.isLocalDevelopment()) {
                    return await this.mockLogin(credentials)
                } else {
                    return await this.productionLogin(credentials)
                }
            } catch (error) {
                console.error('Login error:', error)
                this.error = error.message
                this.clearAuth()
                throw error
            } finally {
                this.loading = false
            }
        },

        // Logout action
        async logout() {
            this.loading = true

            try {
                // Nur bei Production API logout-Request senden
                if (!this.isLocalDevelopment() && this.token && !this.isMockMode()) {
                    try {
                        await fetch('/.netlify/functions/auth/logout', {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${this.token}`,
                                'Content-Type': 'application/json'
                            }
                        })
                    } catch (error) {
                        console.warn('Server logout failed:', error)
                    }
                }
            } finally {
                this.clearAuth()
                this.loading = false

                if (process.client) {
                    await navigateTo('/login')
                }
            }
        },

        // Register action
        async register(userData) {
            this.loading = true
            this.error = null

            try {
                if (this.isLocalDevelopment()) {
                    // Mock für lokale Entwicklung
                    await new Promise(resolve => setTimeout(resolve, 1000))
                    console.log('🔧 Mock registration:', userData.username)
                    return {
                        success: true,
                        user: {
                            id: Date.now(),
                            username: userData.username,
                            email: userData.email,
                            role: 'user'
                        }
                    }
                }

                // Production
                const response = await fetch('/.netlify/functions/auth/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(userData)
                })

                const data = await response.json()

                if (!response.ok) {
                    throw new Error(data.message || data.error || 'Registration failed')
                }

                return { success: true, user: data.user }
            } catch (error) {
                console.error('Registration error:', error)
                this.error = error.message
                throw error
            } finally {
                this.loading = false
            }
        },

        // Verify token
        async verifyToken() {
            if (!this.token && process.client) {
                const storedToken = localStorage.getItem('auth_token')
                const storedUser = localStorage.getItem('user_data')

                if (storedToken && storedUser) {
                    this.token = storedToken
                    this.user = JSON.parse(storedUser)
                    this.sessionToken = localStorage.getItem('session_token')

                    if (this.isMockMode()) {
                        this.isAuthenticated = true
                        return true
                    }
                } else {
                    return false
                }
            }

            if (!this.token) {
                return false
            }

            // Im lokalen Mock-Modus oder Mock-Token immer als gültig betrachten
            if (this.isLocalDevelopment() || this.isMockMode()) {
                this.isAuthenticated = true
                return true
            }

            // Production token verification
            try {
                const response = await fetch('/.netlify/functions/auth/verify', {
                    headers: {
                        'Authorization': `Bearer ${this.token}`
                    }
                })

                if (response.ok) {
                    const data = await response.json()
                    this.user = data.user
                    this.isAuthenticated = true
                    return true
                } else {
                    this.clearAuth()
                    return false
                }
            } catch (error) {
                console.error('Token verification error:', error)
                this.clearAuth()
                return false
            }
        },

        // Check if in mock mode
        isMockMode() {
            return process.client && localStorage.getItem('mock_mode') === 'true'
        },

        // Clear authentication data
        clearAuth() {
            this.user = null
            this.token = null
            this.sessionToken = null
            this.isAuthenticated = false
            this.error = null

            if (process.client) {
                localStorage.removeItem('auth_token')
                localStorage.removeItem('session_token')
                localStorage.removeItem('user_data')
                localStorage.removeItem('mock_mode')
            }
        },

        // Initialize auth state from storage
        initializeAuth() {
            if (process.client) {
                const token = localStorage.getItem('auth_token')
                const userData = localStorage.getItem('user_data')
                const sessionToken = localStorage.getItem('session_token')

                if (token && userData) {
                    this.token = token
                    this.user = JSON.parse(userData)
                    this.sessionToken = sessionToken
                    this.isAuthenticated = true

                    // Verify token in background nur wenn nicht Mock-Modus
                    if (!this.isMockMode()) {
                        this.verifyToken()
                    }
                }
            }
        },

        // Update user profile
        async updateProfile(profileData) {
            this.loading = true
            this.error = null

            try {
                // Mock für alle Umgebungen (kann später erweitert werden)
                await new Promise(resolve => setTimeout(resolve, 1000))

                this.user = { ...this.user, ...profileData }

                if (process.client) {
                    localStorage.setItem('user_data', JSON.stringify(this.user))
                }

                return { success: true, user: this.user }
            } catch (error) {
                this.error = error.message
                throw error
            } finally {
                this.loading = false
            }
        }
    }
})