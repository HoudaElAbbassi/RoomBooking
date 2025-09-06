// nuxt-app/stores/userStore.js
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
        // Login action
        async login(credentials) {
            this.loading = true
            this.error = null

            try {
                const response = await fetch('/.netlify/functions/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(credentials)
                })

                const data = await response.json()

                if (!response.ok) {
                    throw new Error(data.error || 'Login failed')
                }

                // Store auth data
                this.user = data.user
                this.token = data.token
                this.sessionToken = data.sessionToken
                this.isAuthenticated = true

                // Store in localStorage for persistence
                if (process.client) {
                    localStorage.setItem('auth_token', data.token)
                    localStorage.setItem('session_token', data.sessionToken)
                    localStorage.setItem('user_data', JSON.stringify(data.user))
                }

                return { success: true, user: data.user }
            } catch (error) {
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
                if (this.token) {
                    await fetch('/.netlify/functions/auth/logout', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${this.token}`,
                            'Content-Type': 'application/json'
                        }
                    })
                }
            } catch (error) {
                console.error('Logout error:', error)
            } finally {
                this.clearAuth()
                this.loading = false

                // Redirect to login page
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
                const response = await fetch('/.netlify/functions/auth/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(userData)
                })

                const data = await response.json()

                if (!response.ok) {
                    throw new Error(data.error || 'Registration failed')
                }

                return { success: true, user: data.user }
            } catch (error) {
                this.error = error.message
                throw error
            } finally {
                this.loading = false
            }
        },

        // Verify token and restore session
        async verifyToken() {
            if (!this.token && process.client) {
                // Try to restore from localStorage
                const storedToken = localStorage.getItem('auth_token')
                const storedUser = localStorage.getItem('user_data')

                if (storedToken && storedUser) {
                    this.token = storedToken
                    this.user = JSON.parse(storedUser)
                    this.sessionToken = localStorage.getItem('session_token')
                } else {
                    return false
                }
            }

            if (!this.token) {
                return false
            }

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

                    // Verify token in background
                    this.verifyToken()
                }
            }
        },

        // Update user profile
        async updateProfile(profileData) {
            this.loading = true
            this.error = null

            try {
                const response = await fetch('/.netlify/functions/auth/profile', {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${this.token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(profileData)
                })

                const data = await response.json()

                if (!response.ok) {
                    throw new Error(data.error || 'Profile update failed')
                }

                // Update local user data
                this.user = { ...this.user, ...data.user }

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