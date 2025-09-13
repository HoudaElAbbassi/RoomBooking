<!-- nuxt-app/components/ToastNotification.vue -->
<template>
  <!-- Toast Container (Fixed Position) -->
  <div class="fixed inset-x-0 bottom-0 px-4 pb-4 z-50 pointer-events-none sm:px-6 sm:pb-6">
    <div class="max-w-md mx-auto">
      <!-- Toast Elements (stacked from bottom) -->
      <TransitionGroup
        name="toast"
        tag="div"
        class="space-y-2"
      >
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="transform transition-all duration-300 pointer-events-auto flex items-center w-full max-w-md p-4 mb-4 text-gray-500 bg-white rounded-lg shadow-lg"
          :class="getToastClasses(toast.type)"
        >
          <!-- Icon based on type -->
          <div class="inline-flex flex-shrink-0 justify-center items-center w-8 h-8 rounded-lg">
            <i :class="getToastIcon(toast.type)"></i>
          </div>

          <!-- Content -->
          <div class="ml-3 text-sm font-normal">
            <div v-if="toast.title" class="font-semibold mb-1">{{ toast.title }}</div>
            <div>{{ toast.message }}</div>
          </div>

          <!-- Close Button -->
          <button
            type="button"
            class="ml-auto -mx-1.5 -my-1.5 bg-white text-gray-400 hover:text-gray-900 rounded-lg focus:ring-2 focus:ring-gray-300 p-1.5 hover:bg-gray-100 inline-flex h-8 w-8"
            @click="removeToast(toast.id)"
          >
            <i class="fas fa-times"></i>
          </button>
        </div>
      </TransitionGroup>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

// Toast storage
const toasts = ref([])
let nextId = 0

// Toast types and their styling
const toastTypes = {
  success: {
    classes: 'text-green-500 bg-green-50 border-l-4 border-green-500',
    icon: 'fas fa-check-circle text-green-500'
  },
  error: {
    classes: 'text-red-500 bg-red-50 border-l-4 border-red-500',
    icon: 'fas fa-exclamation-circle text-red-500'
  },
  warning: {
    classes: 'text-yellow-500 bg-yellow-50 border-l-4 border-yellow-500',
    icon: 'fas fa-exclamation-triangle text-yellow-500'
  },
  info: {
    classes: 'text-blue-500 bg-blue-50 border-l-4 border-blue-500',
    icon: 'fas fa-info-circle text-blue-500'
  }
}

// Helper functions
function getToastClasses(type) {
  return toastTypes[type]?.classes || toastTypes.info.classes
}

function getToastIcon(type) {
  return toastTypes[type]?.icon || toastTypes.info.icon
}

// Toast management
function addToast(message, options = {}) {
  const { type = 'info', duration = 5000, title = '' } = options
  const id = nextId++

  toasts.value.push({
    id,
    message,
    type,
    title,
    duration
  })

  // Auto-remove after duration
  if (duration > 0) {
    setTimeout(() => {
      removeToast(id)
    }, duration)
  }

  return id
}

function removeToast(id) {
  const index = toasts.value.findIndex(toast => toast.id === id)
  if (index !== -1) {
    toasts.value.splice(index, 1)
  }
}

// Expose methods to be accessed globally
const toast = {
  success: (message, options) => addToast(message, { ...options, type: 'success' }),
  error: (message, options) => addToast(message, { ...options, type: 'error' }),
  warning: (message, options) => addToast(message, { ...options, type: 'warning' }),
  info: (message, options) => addToast(message, { ...options, type: 'info' })
}

// Make methods globally available
onMounted(() => {
  if (process.client) {
    window.$toast = toast
  }
})

defineExpose({
  show: addToast,
  success: toast.success,
  error: toast.error,
  warning: toast.warning,
  info: toast.info,
  remove: removeToast,
  clear: () => toasts.value = []
})
</script>

<style scoped>
/* Toast transition animations */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}
.toast-enter-from {
  transform: translateY(100%);
  opacity: 0;
}
.toast-leave-to {
  transform: translateY(10px);
  opacity: 0;
}
</style>
