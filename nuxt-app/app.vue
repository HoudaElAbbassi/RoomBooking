<!-- nuxt-app/app.vue -->
<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Navigation Header (nur wenn eingeloggt) -->
    <DashboardHeader v-if="userStore.isAuthenticated" />

    <!-- Main Content -->
    <main :class="userStore.isAuthenticated ? 'pt-0' : 'min-h-screen'">
      <NuxtPage />
    </main>

    <!-- Global Loading Overlay -->
    <div v-if="isGlobalLoading" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 flex items-center space-x-3">
        <i class="fas fa-spinner fa-spin text-blue-500 text-xl"></i>
        <span class="text-gray-700">Lädt...</span>
      </div>
    </div>

    <!-- Toast Notifications -->
    <ToastNotification ref="toastRef" />
  </div>
</template>

<script setup>
import { computed, ref, onMounted, provide } from 'vue'
import { useUserStore } from '~/stores/userStore'

const userStore = useUserStore()
const toastRef = ref(null)

// Global loading state (optional)
const isGlobalLoading = computed(() => {
  return userStore.loading && (userStore.isAuthenticated === false && process.client)
})

// Make toast methods available through injection
provide('toast', {
  show: (message, options) => toastRef.value?.show(message, options),
  success: (message, options) => toastRef.value?.success(message, options),
  error: (message, options) => toastRef.value?.error(message, options),
  warning: (message, options) => toastRef.value?.warning(message, options),
  info: (message, options) => toastRef.value?.info(message, options)
})

// Initialize authentication on app start
onMounted(() => {
  userStore.initializeAuth()

  // Create global toast function for easy access
  if (process.client && toastRef.value) {
    window.$toast = {
      show: (message, options) => toastRef.value.show(message, options),
      success: (message, options) => toastRef.value.success(message, options),
      error: (message, options) => toastRef.value.error(message, options),
      warning: (message, options) => toastRef.value.warning(message, options),
      info: (message, options) => toastRef.value.info(message, options)
    }
  }
})

// Set page title
useHead({
  title: 'Raumbelegungssystem',
  meta: [
    { name: 'description', content: 'Einfaches System zur Verwaltung von Raumbuchungen' }
  ]
})
</script>