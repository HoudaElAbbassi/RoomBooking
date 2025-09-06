<!-- nuxt-app/components/DashboardQuickActions.vue -->
<template>
  <div class="bg-white rounded-lg shadow p-6">
    <h2 class="text-xl font-semibold mb-4">Schnellzugriff</h2>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- Kalender öffnen -->
      <NuxtLink
          to="/calendar"
          class="group p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all"
      >
        <div class="flex items-center">
          <div class="p-3 rounded-full bg-blue-100 text-blue-600 group-hover:bg-blue-200">
            <i class="fas fa-calendar-alt text-xl"></i>
          </div>
          <div class="ml-4">
            <h3 class="font-medium text-gray-900">Kalenderübersicht</h3>
            <p class="text-gray-600 text-sm">Alle Buchungen im Überblick</p>
          </div>
        </div>
      </NuxtLink>

      <!-- Profil bearbeiten -->
      <NuxtLink
          to="/profile"
          class="group p-4 border border-gray-200 rounded-lg hover:border-green-500 hover:shadow-md transition-all"
      >
        <div class="flex items-center">
          <div class="p-3 rounded-full bg-green-100 text-green-600 group-hover:bg-green-200">
            <i class="fas fa-user text-xl"></i>
          </div>
          <div class="ml-4">
            <h3 class="font-medium text-gray-900">Mein Profil</h3>
            <p class="text-gray-600 text-sm">Profil verwalten & Buchungen ansehen</p>
          </div>
        </div>
      </NuxtLink>

      <!-- Admin Panel (nur für Admins) -->
      <NuxtLink
          v-if="userStore.isAdmin"
          to="/admin"
          class="group p-4 border border-gray-200 rounded-lg hover:border-purple-500 hover:shadow-md transition-all"
      >
        <div class="flex items-center">
          <div class="p-3 rounded-full bg-purple-100 text-purple-600 group-hover:bg-purple-200">
            <i class="fas fa-cog text-xl"></i>
          </div>
          <div class="ml-4">
            <h3 class="font-medium text-gray-900">Administration</h3>
            <p class="text-gray-600 text-sm">Räume & Benutzer verwalten</p>
          </div>
        </div>
      </NuxtLink>

      <!-- Meine Buchungen -->
      <div class="group p-4 border border-gray-200 rounded-lg hover:border-orange-500 hover:shadow-md transition-all cursor-pointer"
           @click="showMyBookings = !showMyBookings">
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <div class="p-3 rounded-full bg-orange-100 text-orange-600 group-hover:bg-orange-200">
              <i class="fas fa-list text-xl"></i>
            </div>
            <div class="ml-4">
              <h3 class="font-medium text-gray-900">Meine Buchungen</h3>
              <p class="text-gray-600 text-sm">{{ myBookingsCount }} aktive Buchungen</p>
            </div>
          </div>
          <i class="fas fa-chevron-down text-gray-400 transition-transform"
             :class="{ 'rotate-180': showMyBookings }"></i>
        </div>
      </div>
    </div>

    <!-- Meine Buchungen Expandable Section -->
    <div v-if="showMyBookings" class="mt-4 pt-4 border-t">
      <h3 class="font-medium text-gray-900 mb-3">Meine aktuellen Buchungen</h3>

      <div v-if="myBookings.length === 0" class="text-center text-gray-500 py-4">
        <i class="fas fa-calendar-times text-2xl mb-2"></i>
        <p>Keine Buchungen vorhanden</p>
      </div>

      <div v-else class="space-y-3 max-h-64 overflow-y-auto">
        <div
            v-for="booking in myBookings.slice(0, 5)"
            :key="booking.id"
            class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
        >
          <div>
            <h4 class="font-medium">{{ booking.title }}</h4>
            <p class="text-sm text-gray-600">
              <i class="fas fa-door-open mr-1"></i>{{ getRoomName(booking.room_id || booking.roomId) }}
              <span class="mx-2">•</span>
              <i class="fas fa-calendar mr-1"></i>{{ formatDate(booking.date) }}
              <span class="mx-2">•</span>
              <i class="fas fa-clock mr-1"></i>{{ booking.time_slot || booking.timeSlot }}
            </p>
          </div>

          <div class="flex items-center space-x-2">
            <span class="px-2 py-1 text-xs rounded-full"
                  :class="getBookingStatusClass(booking.date, booking.time_slot || booking.timeSlot)">
              {{ getBookingStatus(booking.date, booking.time_slot || booking.timeSlot) }}
            </span>

            <button
                v-if="canCancelBooking(booking.date, booking.time_slot || booking.timeSlot)"
                @click="cancelBooking(booking.id)"
                class="text-red-600 hover:text-red-800 text-sm"
                title="Buchung stornieren"
            >
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>

        <div v-if="myBookings.length > 5" class="text-center">
          <NuxtLink
              to="/profile"
              class="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Alle {{ myBookings.length }} Buchungen anzeigen →
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Logout Button -->
    <div class="mt-6 pt-4 border-t">
      <button
          @click="handleLogout"
          class="w-full flex items-center justify-center px-4 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
      >
        <i class="fas fa-sign-out-alt mr-2"></i>
        Abmelden
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useUserStore } from '~/stores/userStore'
import { useRoomStore } from '~/stores/roomStore'
import { useBookingStore } from '~/stores/bookingStore'

const userStore = useUserStore()
const roomStore = useRoomStore()
const bookingStore = useBookingStore()

const showMyBookings = ref(false)

// Computed
const myBookings = computed(() => {
  if (!userStore.user) return []

  return bookingStore.bookings
      .filter(booking =>
          booking.contact_name === userStore.user.username ||
          booking.user_id === userStore.user.id
      )
      .sort((a, b) => new Date(a.date) - new Date(b.date))
})

const myBookingsCount = computed(() => myBookings.value.length)

// Methods
function getRoomName(roomId) {
  const room = roomStore.rooms.find(r => r.id === roomId)
  return room ? room.name : 'Unbekannter Raum'
}

function formatDate(dateString) {
  if (!dateString) return 'Unbekannt'

  const [year, month, day] = dateString.split('-')
  return `${day}.${month}.${year}`
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

async function handleLogout() {
  try {
    await userStore.logout()
  } catch (error) {
    console.error('Logout error:', error)
  }
}
</script>

<style scoped>
.rotate-180 {
  transform: rotate(180deg);
}
</style>