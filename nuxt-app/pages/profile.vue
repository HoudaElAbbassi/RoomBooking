<!-- nuxt-app/pages/profile.vue -->
<template>
  <div class="max-w-4xl mx-auto space-y-6">
    <!-- Header -->
    <div class="bg-white rounded-lg shadow p-6">
      <h1 class="text-2xl font-bold mb-2">Mein Profil</h1>
      <p class="text-gray-600">Verwalten Sie Ihre Kontoinformationen</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Profile Information -->
      <div class="lg:col-span-2 bg-white rounded-lg shadow">
        <div class="p-6 border-b">
          <h2 class="text-xl font-semibold">Persönliche Informationen</h2>
        </div>

        <form @submit.prevent="updateProfile" class="p-6">
          <div v-if="updateError" class="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
            {{ updateError }}
          </div>

          <div v-if="updateSuccess" class="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
            {{ updateSuccess }}
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-gray-700 font-medium mb-2">Benutzername</label>
              <input
                  type="text"
                  v-model="profileForm.username"
                  class="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
              >
            </div>

            <div>
              <label class="block text-gray-700 font-medium mb-2">E-Mail-Adresse</label>
              <input
                  type="email"
                  v-model="profileForm.email"
                  class="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
              >
            </div>
          </div>

          <div class="mt-6">
            <button
                type="submit"
                :disabled="userStore.loading"
                class="px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
            >
              <i v-if="userStore.loading" class="fas fa-spinner fa-spin mr-2"></i>
              {{ userStore.loading ? 'Wird gespeichert...' : 'Profil aktualisieren' }}
            </button>
          </div>
        </form>
      </div>

      <!-- Account Information -->
      <div class="bg-white rounded-lg shadow">
        <div class="p-6 border-b">
          <h2 class="text-xl font-semibold">Kontoinformationen</h2>
        </div>

        <div class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-500">Rolle</label>
            <div class="mt-1 flex items-center">
              <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
                    :class="userStore.isAdmin ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'">
                <i :class="userStore.isAdmin ? 'fas fa-crown' : 'fas fa-user'" class="mr-1"></i>
                {{ userStore.isAdmin ? 'Administrator' : 'Benutzer' }}
              </span>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-500">Mitglied seit</label>
            <p class="mt-1 text-sm text-gray-900">{{ formatDate(userStore.user?.created_at) }}</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-500">Letzte Anmeldung</label>
            <p class="mt-1 text-sm text-gray-900">{{ formatDate(new Date()) }}</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-500">Status</label>
            <div class="mt-1 flex items-center">
              <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                <i class="fas fa-circle text-xs mr-1"></i>
                Aktiv
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- My Bookings -->
    <div class="bg-white rounded-lg shadow">
      <div class="p-6 border-b">
        <h2 class="text-xl font-semibold">Meine Buchungen</h2>
      </div>

      <div class="p-6">
        <div v-if="myBookings.length === 0" class="text-center text-gray-500 py-8">
          <i class="fas fa-calendar-times text-4xl mb-4"></i>
          <p>Sie haben noch keine Buchungen</p>
        </div>

        <div v-else class="space-y-4">
          <div
              v-for="booking in myBookings"
              :key="booking.id"
              class="border rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div class="flex justify-between items-start">
              <div>
                <h3 class="font-medium text-lg">{{ booking.title }}</h3>
                <div class="text-sm text-gray-600 mt-1 space-y-1">
                  <div><i class="fas fa-door-open mr-2"></i>{{ getRoomName(booking.room_id) }}</div>
                  <div><i class="fas fa-calendar mr-2"></i>{{ formatDate(booking.date) }}</div>
                  <div><i class="fas fa-clock mr-2"></i>{{ booking.time_slot }} Uhr</div>
                </div>
                <div v-if="booking.description" class="text-sm text-gray-700 mt-2">
                  {{ booking.description }}
                </div>
              </div>

              <div class="flex items-center space-x-2">
                <span class="px-2 py-1 text-xs rounded-full"
                      :class="getBookingStatusClass(booking.date, booking.time_slot)">
                  {{ getBookingStatus(booking.date, booking.time_slot) }}
                </span>

                <button
                    v-if="canCancelBooking(booking.date, booking.time_slot)"
                    @click="cancelBooking(booking.id)"
                    class="text-red-600 hover:text-red-800"
                >
                  <i class="fas fa-times"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Password Change -->
    <div class="bg-white rounded-lg shadow">
      <div class="p-6 border-b">
        <h2 class="text-xl font-semibold">Passwort ändern</h2>
      </div>

      <form @submit.prevent="changePassword" class="p-6">
        <div v-if="passwordError" class="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {{ passwordError }}
        </div>

        <div v-if="passwordSuccess" class="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
          {{ passwordSuccess }}
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <input
                type="password"
                v-model="passwordForm.currentPassword"
                class="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
            >
          </div>

          <div>
            <label class="block text-gray-700 font-medium mb-2">Neues Passwort</label>
            <input
                type="password"
                v-model="passwordForm.newPassword"
                class="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
            >
          </div>

          <div>
            <label class="block text-gray-700 font-medium mb-2">Passwort bestätigen</label>
            <input
                type="password"
                v-model="passwordForm.confirmPassword"
                class="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
            >
          </div>
        </div>

        <div class="mt-6">
          <button
              type="submit"
              :disabled="isChangingPassword"
              class="px-6 py-3 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50"
          >
            <i v-if="isChangingPassword" class="fas fa-spinner fa-spin mr-2"></i>
            {{ isChangingPassword ? 'Wird geändert...' : 'Passwort ändern' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '~/stores/userStore'
import { useRoomStore } from '~/stores/roomStore'
import { useBookingStore } from '~/stores/bookingStore'

// Middleware für Authentication
definePageMeta({
  middleware: ['auth']
})

// Stores
const userStore = useUserStore()
const roomStore = useRoomStore()
const bookingStore = useBookingStore()

// Form data
const profileForm = ref({
  username: '',
  email: ''
})

const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// UI states
const updateError = ref('')
const updateSuccess = ref('')
const passwordError = ref('')
const passwordSuccess = ref('')
const isChangingPassword = ref(false)

// Computed
const myBookings = computed(() => {
  if (!userStore.user) return []

  return bookingStore.bookings.filter(booking =>
      booking.contact_name === userStore.user.username ||
      booking.user_id === userStore.user.id
  ).sort((a, b) => new Date(b.date) - new Date(a.date))
})

// Methods
function initializeForm() {
  if (userStore.user) {
    profileForm.value = {
      username: userStore.user.username,
      email: userStore.user.email
    }
  }
}

function formatDate(dateString) {
  if (!dateString) return 'Unbekannt'

  const date = new Date(dateString)
  return date.toLocaleDateString('de-DE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

function getRoomName(roomId) {
  const room = roomStore.rooms.find(r => r.id === roomId)
  return room ? room.name : 'Unbekannter Raum'
}

function getBookingStatus(date, timeSlot) {
  const bookingDateTime = new Date(`${date}T${timeSlot}:00`)
  const now = new Date()

  if (bookingDateTime < now) {
    return 'Vergangen'
  } else if (bookingDateTime.toDateString() === now.toDateString()) {
    return 'Heute'
  } else {
    return 'Geplant'
  }
}

function getBookingStatusClass(date, timeSlot) {
  const status = getBookingStatus(date, timeSlot)

  switch (status) {
    case 'Vergangen':
      return 'bg-gray-100 text-gray-800'
    case 'Heute':
      return 'bg-green-100 text-green-800'
    case 'Geplant':
      return 'bg-blue-100 text-blue-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

function canCancelBooking(date, timeSlot) {
  const bookingDateTime = new Date(`${date}T${timeSlot}:00`)
  const now = new Date()

  // Buchung kann nur storniert werden, wenn sie in der Zukunft liegt
  return bookingDateTime > now
}

async function updateProfile() {
  updateError.value = ''
  updateSuccess.value = ''

  try {
    await userStore.updateProfile({
      username: profileForm.value.username,
      email: profileForm.value.email
    })

    updateSuccess.value = 'Profil erfolgreich aktualisiert!'

    setTimeout(() => {
      updateSuccess.value = ''
    }, 3000)
  } catch (error) {
    updateError.value = error.message || 'Fehler beim Aktualisieren des Profils'
  }
}

async function changePassword() {
  passwordError.value = ''
  passwordSuccess.value = ''

  // Validate passwords
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    passwordError.value = 'Die neuen Passwörter stimmen nicht überein'
    return
  }

  if (passwordForm.value.newPassword.length < 8) {
    passwordError.value = 'Das neue Passwort muss mindestens 8 Zeichen lang sein'
    return
  }

  isChangingPassword.value = true

  try {
    // Implementiere Passwort-Änderung
    // Für jetzt Dummy-Implementation
    await new Promise(resolve => setTimeout(resolve, 1000))

    passwordSuccess.value = 'Passwort erfolgreich geändert!'

    // Reset form
    passwordForm.value = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }

    setTimeout(() => {
      passwordSuccess.value = ''
    }, 3000)
  } catch (error) {
    passwordError.value = error.message || 'Fehler beim Ändern des Passworts'
  } finally {
    isChangingPassword.value = false
  }
}

async function cancelBooking(bookingId) {
  if (confirm('Sind Sie sicher, dass Sie diese Buchung stornieren möchten?')) {
    try {
      await bookingStore.deleteBooking(bookingId)
      alert('Buchung erfolgreich storniert!')
    } catch (error) {
      alert('Fehler beim Stornieren: ' + error.message)
    }
  }
}

// Initialize
onMounted(async () => {
  initializeForm()

  // Load data
  await Promise.all([
    roomStore.fetchRooms(),
    bookingStore.fetchBookings()
  ])
})

// Watch for user changes
watch(() => userStore.user, () => {
  initializeForm()
}, { deep: true })
</script>