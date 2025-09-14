<!-- nuxt-app/components/Header.vue -->
<template>
  <header class="bg-white shadow-sm">
    <div class="container mx-auto px-4 py-4 flex justify-between items-center">
      <div class="flex items-center">
        <i class="fas fa-calendar-check text-blue-500 text-2xl mr-3"></i>
        <h1 class="text-xl font-semibold">Vest e.V.</h1>
      </div>

      <!-- Navigation -->
      <nav class="hidden md:flex items-center space-x-6 mr-6">
        <NuxtLink to="/" class="text-gray-600 hover:text-blue-500 font-medium transition-colors">
          <i class="fas fa-home mr-1"></i>
          Startseite
        </NuxtLink>
        <NuxtLink to="/calendar" class="text-gray-600 hover:text-blue-500 font-medium transition-colors">
          <i class="fas fa-calendar-alt mr-1"></i>
          Kalender
        </NuxtLink>
        <NuxtLink v-if="userStore.isAdmin" to="/admin" class="text-gray-600 hover:text-blue-500 font-medium transition-colors">
          <i class="fas fa-cog mr-1"></i>
          Verwaltung
        </NuxtLink>
      </nav>

      <div class="flex items-center space-x-4">
        <!-- Search -->
        <div class="max-w-xs w-full">
          <input type="text"
                 placeholder="Raum suchen..."
                 class="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                 v-model="searchQuery"
                 @input="searchRooms">
        </div>

        <!-- User Menu -->
        <div v-if="userStore.isAuthenticated" class="relative" ref="userMenuRef">
          <button
              @click="showUserMenu = !showUserMenu"
              class="flex items-center space-x-2 text-gray-600 hover:text-blue-500 transition-colors"
          >
            <div class="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center">
              <i class="fas fa-user text-sm"></i>
            </div>
            <span class="font-medium">{{ userStore.userDisplayName }}</span>
            <i class="fas fa-chevron-down text-xs" :class="{ 'rotate-180': showUserMenu }"></i>
          </button>

          <!-- Dropdown Menu -->
          <div
              v-show="showUserMenu"
              class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border"
          >
            <div class="px-4 py-2 text-sm text-gray-500 border-b">
              Angemeldet als<br>
              <span class="font-medium text-gray-900">{{ userStore.user?.email }}</span>
            </div>

            <NuxtLink
                to="/profile"
                class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                @click="showUserMenu = false"
            >
              <i class="fas fa-user mr-2"></i>
              Profil
            </NuxtLink>

            <NuxtLink
                to="/my-bookings"
                class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                @click="showUserMenu = false"
            >
              <i class="fas fa-calendar-check mr-2"></i>
              Meine Buchungen
            </NuxtLink>

            <div v-if="userStore.isAdmin" class="border-t">
              <NuxtLink
                  to="/admin"
                  class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  @click="showUserMenu = false"
              >
                <i class="fas fa-cog mr-2"></i>
                Verwaltung
              </NuxtLink>
            </div>

            <div class="border-t">
              <button
                  @click="handleLogout"
                  class="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <i class="fas fa-sign-out-alt mr-2"></i>
                Abmelden
              </button>
            </div>
          </div>
        </div>

        <!-- Login Button -->
        <div v-else>
          <NuxtLink
              to="/login"
              class="inline-flex items-center px-4 py-2 border border-blue-500 text-blue-500 text-sm font-medium rounded-md hover:bg-blue-50 transition-colors"
          >
            <i class="fas fa-sign-in-alt mr-2"></i>
            Anmelden
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Mobile Navigation -->
    <div v-if="userStore.isAuthenticated" class="md:hidden border-t bg-gray-50 px-4 py-2">
      <div class="flex space-x-4">
        <NuxtLink to="/" class="text-gray-600 hover:text-blue-500 text-sm font-medium">
          <i class="fas fa-home mr-1"></i>
          Start
        </NuxtLink>
        <NuxtLink to="/calendar" class="text-gray-600 hover:text-blue-500 text-sm font-medium">
          <i class="fas fa-calendar-alt mr-1"></i>
          Kalender
        </NuxtLink>
        <NuxtLink v-if="userStore.isAdmin" to="/admin" class="text-gray-600 hover:text-blue-500 text-sm font-medium">
          <i class="fas fa-cog mr-1"></i>
          Admin
        </NuxtLink>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useUserStore } from '~/stores/userStore'

const userStore = useUserStore()
const searchQuery = ref('')
const showUserMenu = ref(false)
const userMenuRef = ref(null)

function searchRooms() {
  // Implementierung der Suchfunktion
  console.log('Suche nach:', searchQuery.value)
}

async function handleLogout() {
  showUserMenu.value = false
  try {
    await userStore.logout()
  } catch (error) {
    console.error('Logout error:', error)
  }
}

// Close user menu when clicking outside
function handleClickOutside(event) {
  if (userMenuRef.value && !userMenuRef.value.contains(event.target)) {
    showUserMenu.value = false
  }
}

onMounted(() => {
  // Initialize auth state when component mounts
  userStore.initializeAuth()

  // Add click outside listener
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  // Remove click outside listener
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.rotate-180 {
  transform: rotate(180deg);
}
</style>