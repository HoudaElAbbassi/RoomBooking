<!-- nuxt-app/components/DashboardHeader.vue -->
<template>
  <header class="bg-white shadow-sm sticky top-0 z-40">
    <div class="container mx-auto px-4 py-4">
      <div class="flex justify-between items-center">
        <!-- Logo & Title -->
        <div class="flex items-center">
          <!-- Ersetze das Icon durch das Logo -->
          <img
            src="/vest-logo-bearbeitet.png"
            alt="Logo"
            class="h-10 mr-3"
          />
          <h1 class="text-xl font-semibold">Raumbelegungssystem</h1>
        </div>

        <!-- Navigation Links (Desktop) -->
        <nav class="hidden md:flex items-center space-x-6">
          <NuxtLink
              to="/"
              class="text-gray-600 hover:text-blue-500 font-medium transition-colors flex items-center"
              :class="{ 'text-blue-500 font-semibold': $route.path === '/' }"
          >
            <i class="fas fa-home mr-2"></i>
            Dashboard
          </NuxtLink>

          <NuxtLink
              to="/calendar"
              class="text-gray-600 hover:text-blue-500 font-medium transition-colors flex items-center"
              :class="{ 'text-blue-500 font-semibold': $route.path === '/calendar' }"
          >
            <i class="fas fa-calendar-alt mr-2"></i>
            Kalender
          </NuxtLink>

          <NuxtLink
              v-if="userStore.isAdmin"
              to="/admin"
              class="text-gray-600 hover:text-blue-500 font-medium transition-colors flex items-center"
              :class="{ 'text-blue-500 font-semibold': $route.path === '/admin' }"
          >
            <i class="fas fa-cog mr-2"></i>
            Admin
          </NuxtLink>
        </nav>

        <!-- User Menu & Actions -->
        <div class="flex items-center space-x-4">
          <!-- Quick Action Buttons -->
          <div class="hidden lg:flex items-center space-x-2">
            <!-- Calendar Quick Access -->
            <NuxtLink
                to="/calendar"
                class="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                title="Zur Kalenderübersicht"
            >
              <i class="fas fa-calendar-alt mr-2"></i>
              Kalender
            </NuxtLink>
          </div>

          <!-- User Dropdown Menu -->
          <div class="relative" ref="userMenuRef">
            <button
                @click="showUserMenu = !showUserMenu"
                class="flex items-center space-x-2 text-gray-600 hover:text-blue-500 transition-colors p-2 rounded-lg hover:bg-gray-50"
                :class="{ 'bg-gray-100': showUserMenu }"
            >
              <div class="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center">
                <i class="fas fa-user text-sm"></i>
              </div>
              <div class="hidden sm:block text-left">
                <div class="font-medium text-sm">{{ userStore.userDisplayName }}</div>
                <div class="text-xs text-gray-500">{{ userStore.user?.role === 'admin' ? 'Administrator' : 'Benutzer' }}</div>
              </div>
              <i class="fas fa-chevron-down text-xs transition-transform" :class="{ 'rotate-180': showUserMenu }"></i>
            </button>

            <!-- Dropdown Menu -->
            <div
                v-show="showUserMenu"
                class="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
                @click="showUserMenu = false"
            >
              <!-- User Info -->
              <div class="px-4 py-3 text-sm text-gray-500 border-b border-gray-100">
                <div class="font-medium text-gray-900">{{ userStore.userDisplayName }}</div>
                <div class="truncate">{{ userStore.user?.email }}</div>
              </div>

              <!-- Navigation Links -->
              <div class="py-1">
                <NuxtLink
                    to="/profile"
                    class="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <i class="fas fa-user-circle mr-3 text-gray-400"></i>
                  Mein Profil
                </NuxtLink>

                <!-- Mobile Calendar Link -->
                <NuxtLink
                    to="/calendar"
                    class="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors lg:hidden"
                >
                  <i class="fas fa-calendar-alt mr-3 text-gray-400"></i>
                  Kalenderübersicht
                </NuxtLink>

                <NuxtLink
                    v-if="userStore.isAdmin"
                    to="/admin"
                    class="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <i class="fas fa-cog mr-3 text-gray-400"></i>
                  Administration
                </NuxtLink>
              </div>

              <div class="border-t border-gray-100">
                <!-- Logout Button -->
                <button
                    @click="handleLogout"
                    :disabled="isLoggingOut"
                    class="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  <i v-if="isLoggingOut" class="fas fa-spinner fa-spin mr-3"></i>
                  <i v-else class="fas fa-sign-out-alt mr-3"></i>
                  {{ isLoggingOut ? 'Wird abgemeldet...' : 'Abmelden' }}
                </button>
              </div>
            </div>
          </div>

          <!-- Mobile Menu Toggle -->
          <button
              @click="showMobileMenu = !showMobileMenu"
              class="md:hidden p-2 text-gray-600 hover:text-blue-500 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <i class="fas fa-bars text-lg"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Mobile Navigation Menu -->
    <div v-if="showMobileMenu" class="md:hidden border-t bg-gray-50">
      <div class="px-4 py-3 space-y-1">
        <NuxtLink
            to="/"
            class="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            :class="{ 'bg-blue-100 text-blue-700': $route.path === '/' }"
            @click="showMobileMenu = false"
        >
          <i class="fas fa-home mr-3"></i>
          Dashboard
        </NuxtLink>

        <NuxtLink
            to="/calendar"
            class="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            :class="{ 'bg-blue-100 text-blue-700': $route.path === '/calendar' }"
            @click="showMobileMenu = false"
        >
          <i class="fas fa-calendar-alt mr-3"></i>
          Kalenderübersicht
        </NuxtLink>

        <NuxtLink
            v-if="userStore.isAdmin"
            to="/admin"
            class="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            :class="{ 'bg-blue-100 text-blue-700': $route.path === '/admin' }"
            @click="showMobileMenu = false"
        >
          <i class="fas fa-cog mr-3"></i>
          Administration
        </NuxtLink>
      </div>
    </div>

    <!-- Loading Overlay (während Logout) -->
    <div v-if="isLoggingOut" class="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
      <div class="text-center">
        <i class="fas fa-spinner fa-spin text-blue-500 text-2xl mb-2"></i>
        <p class="text-sm text-gray-600">Wird abgemeldet...</p>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useUserStore } from '~/stores/userStore'

const userStore = useUserStore()

// Menu states
const showUserMenu = ref(false)
const showMobileMenu = ref(false)
const isLoggingOut = ref(false)

// Refs for click outside detection
const userMenuRef = ref(null)

// Handle logout
async function handleLogout() {
  if (isLoggingOut.value) return

  const confirmed = confirm('Möchten Sie sich wirklich abmelden?')
  if (!confirmed) return

  isLoggingOut.value = true
  showUserMenu.value = false

  try {
    await userStore.logout()
    // Redirect wird automatisch von userStore.logout() gehandelt
  } catch (error) {
    console.error('Logout error:', error)
    // Zeige Fehlermeldung
    alert('Fehler beim Abmelden. Bitte versuchen Sie es erneut.')
  } finally {
    isLoggingOut.value = false
  }
}

// Close menus when clicking outside
function handleClickOutside(event) {
  if (userMenuRef.value && !userMenuRef.value.contains(event.target)) {
    showUserMenu.value = false
  }

  // Close mobile menu when clicking outside
  if (showMobileMenu.value && !event.target.closest('.mobile-menu-container')) {
    showMobileMenu.value = false
  }
}

// Close menus on escape key
function handleKeyDown(event) {
  if (event.key === 'Escape') {
    showUserMenu.value = false
    showMobileMenu.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleKeyDown)
})
</script>

<style scoped>
.rotate-180 {
  transform: rotate(180deg);
}

/* Smooth transitions */
.transition-colors {
  transition: color 0.15s ease-in-out, background-color 0.15s ease-in-out, border-color 0.15s ease-in-out;
}

.transition-transform {
  transition: transform 0.15s ease-in-out;
}

/* Active link styling */
.router-link-active {
  @apply text-blue-500 font-semibold;
}

/* Mobile menu container class for click outside detection */
.mobile-menu-container {
  /* This class is referenced in the click outside handler */
}</style>