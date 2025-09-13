<!-- nuxt-app/pages/login.vue -->
<template>
  <div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <div class="flex justify-center">
        <i class="fas fa-calendar-check text-blue-500 text-4xl"></i>
      </div>
      <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
        Anmelden
      </h2>
      <p class="mt-2 text-center text-sm text-gray-600">
        Melden Sie sich an, um das Raumbelegungssystem zu nutzen
      </p>
    </div>

    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
        <!-- Login Form -->
        <form v-if="!showRegister" @submit.prevent="handleLogin" class="space-y-6">
          <!-- Error Message -->
          <div v-if="errorMessage" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
            <i class="fas fa-exclamation-circle mr-2"></i>
            {{ errorMessage }}
          </div>

          <!-- Success Message -->
          <div v-if="successMessage" class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded relative">
            <i class="fas fa-check-circle mr-2"></i>
            {{ successMessage }}
          </div>

          <!-- Username Field -->
          <div>
            <label for="username" class="block text-sm font-medium text-gray-700">
              Benutzername
            </label>
            <div class="mt-1 relative">
              <input
                  id="username"
                  name="username"
                  type="text"
                  autocomplete="username"
                  required
                  v-model="loginForm.username"
                  class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Ihr Benutzername"
              >
              <i class="fas fa-user absolute right-3 top-3 text-gray-400"></i>
            </div>
          </div>

          <!-- Password Field -->
          <div>
            <label for="password" class="block text-sm font-medium text-gray-700">
              Passwort
            </label>
            <div class="mt-1 relative">
              <input
                  id="password"
                  name="password"
                  :type="showPassword ? 'text' : 'password'"
                  autocomplete="current-password"
                  required
                  v-model="loginForm.password"
                  class="appearance-none block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Ihr Passwort"
              >
              <button
                  type="button"
                  @click="showPassword = !showPassword"
                  class="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'" class="text-gray-400 hover:text-gray-600"></i>
              </button>
            </div>
          </div>

          <!-- Remember Me -->
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  v-model="loginForm.rememberMe"
                  class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              >
              <label for="remember-me" class="ml-2 block text-sm text-gray-900">
                Angemeldet bleiben
              </label>
            </div>

            <div class="text-sm">
              <a href="#" class="font-medium text-blue-600 hover:text-blue-500">
                Passwort vergessen?
              </a>
            </div>
          </div>

          <!-- Submit Button -->
          <div>
            <button
                type="submit"
                :disabled="isLoading"
                class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span v-if="isLoading" class="absolute left-0 inset-y-0 flex items-center pl-3">
                <i class="fas fa-spinner fa-spin text-blue-300"></i>
              </span>
              <span v-else class="absolute left-0 inset-y-0 flex items-center pl-3">
                <i class="fas fa-sign-in-alt text-blue-300"></i>
              </span>
              {{ isLoading ? 'Wird angemeldet...' : 'Anmelden' }}
            </button>
          </div>
        </form>

        <!-- Register Form -->
        <form v-else @submit.prevent="handleRegister" class="space-y-6">
          <!-- Error Message -->
          <div v-if="errorMessage" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
            <i class="fas fa-exclamation-circle mr-2"></i>
            {{ errorMessage }}
          </div>

          <!-- Username Field -->
          <div>
            <label for="reg-username" class="block text-sm font-medium text-gray-700">
              Benutzername
            </label>
            <div class="mt-1">
              <input
                  id="reg-username"
                  name="username"
                  type="text"
                  required
                  v-model="registerForm.username"
                  class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Wählen Sie einen Benutzernamen"
              >
            </div>
          </div>

          <!-- Email Field -->
          <div>
            <label for="reg-email" class="block text-sm font-medium text-gray-700">
              E-Mail-Adresse
            </label>
            <div class="mt-1">
              <input
                  id="reg-email"
                  name="email"
                  type="email"
                  required
                  v-model="registerForm.email"
                  class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="ihre.email@company.com"
              >
            </div>
          </div>

          <!-- Password Field -->
          <div>
            <label for="reg-password" class="block text-sm font-medium text-gray-700">
              Passwort
            </label>
            <div class="mt-1">
              <input
                  id="reg-password"
                  name="password"
                  type="password"
                  required
                  v-model="registerForm.password"
                  class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Mindestens 8 Zeichen"
              >
            </div>
          </div>

          <!-- Confirm Password Field -->
          <div>
            <label for="reg-confirm-password" class="block text-sm font-medium text-gray-700">
              Passwort bestätigen
            </label>
            <div class="mt-1">
              <input
                  id="reg-confirm-password"
                  name="confirmPassword"
                  type="password"
                  required
                  v-model="registerForm.confirmPassword"
                  class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Passwort wiederholen"
              >
            </div>
          </div>

          <!-- Submit Button -->
          <div>
            <button
                type="submit"
                :disabled="isLoading"
                class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span v-if="isLoading" class="absolute left-0 inset-y-0 flex items-center pl-3">
                <i class="fas fa-spinner fa-spin text-green-300"></i>
              </span>
              <span v-else class="absolute left-0 inset-y-0 flex items-center pl-3">
                <i class="fas fa-user-plus text-green-300"></i>
              </span>
              {{ isLoading ? 'Wird registriert...' : 'Registrieren' }}
            </button>
          </div>
        </form>

        <!-- Toggle between Login and Register -->
        <div class="mt-6">
          <div class="relative">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-gray-300" />
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-2 bg-white text-gray-500">oder</span>
            </div>
          </div>

          <div class="mt-6">
            <button
                @click="toggleForm"
                type="button"
                class="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {{ showRegister ? 'Bereits registriert? Anmelden' : 'Noch kein Konto? Registrieren' }}
            </button>
          </div>
        </div>

        <!-- Demo Accounts Info -->
        <div class="mt-6 p-4 bg-gray-50 rounded-md">
          <h3 class="text-sm font-medium text-gray-900 mb-2">Demo-Accounts:</h3>
          <div class="text-xs text-gray-600 space-y-1">
            <div><strong>Admin:</strong> admin / admin123</div>
            <div><strong>User:</strong> demo / admin123</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '~/stores/userStore'

// Meta für SEO
definePageMeta({
  layout: false,
  middleware: ['guest']
})

const userStore = useUserStore()

// Form states
const showRegister = ref(false)
const showPassword = ref(false)
const isLoading = computed(() => userStore.loading)
const errorMessage = ref('')
const successMessage = ref('')

// Login form
const loginForm = ref({
  username: '',
  password: '',
  rememberMe: false
})

// Register form
const registerForm = ref({
  username: '',
  email: '',
  password: '',
  confirmPassword: ''
})

// Methods
function toggleForm() {
  showRegister.value = !showRegister.value
  errorMessage.value = ''
  successMessage.value = ''

  // Reset forms
  loginForm.value = {
    username: '',
    password: '',
    rememberMe: false
  }

  registerForm.value = {
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  }
}

async function handleLogin() {
  errorMessage.value = ''
  successMessage.value = ''

  try {
    await userStore.login({
      username: loginForm.value.username,
      password: loginForm.value.password
    })

    successMessage.value = 'Erfolgreich angemeldet! Sie werden weitergeleitet...'

    // Redirect after successful login
    setTimeout(() => {
      navigateTo('/')
    }, 1500)
  } catch (error) {
    errorMessage.value = error.message || 'Anmeldung fehlgeschlagen'
  }
}

async function handleRegister() {
  errorMessage.value = ''
  successMessage.value = ''

  // Validate passwords match
  if (registerForm.value.password !== registerForm.value.confirmPassword) {
    errorMessage.value = 'Passwörter stimmen nicht überein'
    return
  }

  // Passwort-Komplexität überprüfen
  const validation = validatePassword(registerForm.value.password)
  if (!validation.valid) {
    errorMessage.value = validation.message
    return
  }

  try {
    await userStore.register({
      username: registerForm.value.username,
      email: registerForm.value.email,
      password: registerForm.value.password
    })

    successMessage.value = 'Registrierung erfolgreich! Sie können sich jetzt anmelden.'

    // Reset registration form after success
    registerForm.value = {
      username: '',
      email: '',
      password: '',
      confirmPassword: ''
    }

    // Switch to login tab
    showRegister.value = false
  } catch (error) {
    errorMessage.value = error.message || 'Registrierung fehlgeschlagen'
  }
}

// Hilfsfunktion zur Validierung der Passwort-Komplexität
function validatePassword(password) {
  // Mindestens 8 Zeichen
  if (password.length < 8) {
    return { valid: false, message: 'Passwort muss mindestens 8 Zeichen lang sein' }
  }

  // Prüfung auf Komplexität
  const hasUpperCase = /[A-Z]/.test(password)
  const hasLowerCase = /[a-z]/.test(password)
  const hasNumbers = /\d/.test(password)
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(password)

  if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
    return {
      valid: false,
      message: 'Passwort muss mindestens einen Großbuchstaben, einen Kleinbuchstaben und eine Zahl enthalten'
    }
  }

  if (!hasSpecialChar) {
    return {
      valid: false,
      message: 'Passwort muss mindestens ein Sonderzeichen enthalten (z.B. !@#$%^&*)'
    }
  }

  return { valid: true }
}

// Check if user is already logged in
onMounted(() => {
  if (userStore.isAuthenticated) {
    navigateTo('/')
  }
})
</script>