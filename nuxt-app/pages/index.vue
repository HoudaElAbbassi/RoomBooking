<!-- nuxt-app/pages/index.vue -->
<template>
  <div class="container mx-auto px-4 py-6">
    <!-- Quick Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center">
          <div class="p-3 rounded-full bg-blue-100 text-blue-600">
            <i class="fas fa-door-open text-xl"></i>
          </div>
          <div class="ml-4">
            <p class="text-2xl font-semibold text-gray-900">{{ rooms.length }}</p>
            <p class="text-gray-600">Verfügbare Räume</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center">
          <div class="p-3 rounded-full bg-green-100 text-green-600">
            <i class="fas fa-calendar-check text-xl"></i>
          </div>
          <div class="ml-4">
            <p class="text-2xl font-semibold text-gray-900">{{ todayBookings.length }}</p>
            <p class="text-gray-600">Buchungen heute</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center">
          <div class="p-3 rounded-full bg-purple-100 text-purple-600">
            <i class="fas fa-user text-xl"></i>
          </div>
          <div class="ml-4">
            <p class="text-lg font-semibold text-gray-900">{{ userStore.userDisplayName }}</p>
            <p class="text-gray-600">Angemeldet als {{ userStore.user?.role === 'admin' ? 'Admin' : 'Benutzer' }}</p>
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <!-- Raumliste Sidebar -->
      <div class="lg:col-span-1">
        <RoomList />
      </div>

      <!-- Hauptinhalt -->
      <div class="lg:col-span-3 space-y-6">
        <!-- Schnellzugriff Actions -->
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-xl font-semibold mb-4">Schnellzugriff</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Raum buchen -->
            <button
                @click="openBookingModal"
                class="p-4 border-2 border-blue-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all text-left group"
            >
              <div class="flex items-center">
                <div class="p-3 rounded-full bg-blue-100 text-blue-600 group-hover:bg-blue-200">
                  <i class="fas fa-plus text-xl"></i>
                </div>
                <div class="ml-4">
                  <h3 class="font-medium text-gray-900">Raum buchen</h3>
                  <p class="text-gray-600 text-sm">Neue Buchung erstellen</p>
                </div>
              </div>
            </button>

            <!-- Kalender öffnen -->
            <NuxtLink
                to="/calendar"
                class="p-4 border-2 border-green-200 rounded-lg hover:border-green-400 hover:bg-green-50 transition-all text-left group block"
            >
              <div class="flex items-center">
                <div class="p-3 rounded-full bg-green-100 text-green-600 group-hover:bg-green-200">
                  <i class="fas fa-calendar-alt text-xl"></i>
                </div>
                <div class="ml-4">
                  <h3 class="font-medium text-gray-900">Kalenderübersicht</h3>
                  <p class="text-gray-600 text-sm">Alle Buchungen anzeigen</p>
                </div>
              </div>
            </NuxtLink>
          </div>
        </div>

        <!-- Ausgewählter Raum Details -->
        <div class="bg-white rounded-lg shadow p-6" v-if="selectedRoom">
          <div class="flex justify-between items-start mb-4">
            <div>
              <h2 class="text-2xl font-semibold">{{ selectedRoom.name }}</h2>
              <p class="text-gray-600">
                <i class="fas fa-map-marker-alt mr-2 text-blue-500"></i>
                {{ selectedRoom.location }} •
                <i class="fas fa-users ml-2 mr-2 text-blue-500"></i>
                {{ selectedRoom.capacity }} Personen
              </p>
            </div>
            <button
                @click="openBookingModal"
                class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <i class="fas fa-plus mr-2"></i>
              Buchen
            </button>
          </div>

          <p class="text-gray-700 mb-4">{{ selectedRoom.description }}</p>

          <!-- Features -->
          <div class="flex flex-wrap gap-2 mb-6">
            <span
                v-for="feature in selectedRoom.features"
                :key="feature"
                class="px-3 py-1 bg-gray-100 rounded-full text-sm flex items-center"
            >
              <i class="fas fa-check text-blue-500 mr-1"></i>
              {{ feature }}
            </span>
          </div>

          <!-- Heutige Buchungen -->
          <div class="border-t pt-4">
            <h3 class="text-lg font-medium mb-3">Buchungen heute</h3>

            <div v-if="todayRoomBookings.length === 0" class="text-gray-500 py-4 text-center">
              <i class="fas fa-calendar-times text-2xl mb-2"></i>
              <p>Keine Buchungen für {{ selectedRoom.name }} heute.</p>
            </div>

            <div v-else class="space-y-3">
              <div
                  v-for="booking in todayRoomBookings"
                  :key="booking.id"
                  class="p-3 border rounded-lg hover:shadow-md transition-shadow"
              >
                <div class="flex justify-between items-start">
                  <div>
                    <h4 class="font-medium">{{ booking.title }}</h4>
                    <p class="text-sm text-gray-600 mt-1">
                      <i class="fas fa-clock mr-1"></i>
                      {{ booking.time_slot || booking.timeSlot }} Uhr
                    </p>
                    <p class="text-sm text-gray-600">
                      <i class="fas fa-user mr-1"></i>
                      {{ booking.contact_name || booking.contactName }}
                    </p>
                    <p v-if="booking.description" class="text-sm text-gray-700 mt-2">
                      {{ booking.description }}
                    </p>
                  </div>
                  <span class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    Heute
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Wenn kein Raum ausgewählt -->
        <div v-else class="bg-white rounded-lg shadow p-6 text-center">
          <i class="fas fa-door-open text-4xl text-gray-400 mb-4"></i>
          <h3 class="text-lg font-medium text-gray-900 mb-2">Wählen Sie einen Raum aus</h3>
          <p class="text-gray-600">Klicken Sie links auf einen Raum, um Details zu sehen</p>
        </div>
      </div>
    </div>

    <!-- Booking Modal -->
    <BookingModal ref="bookingModalRef" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoomStore } from '../stores/roomStore'
import { useBookingStore } from '../stores/bookingStore'
import { useUserStore } from '../stores/userStore'

// Middleware für Authentication
definePageMeta({
  middleware: ['auth']
})

// Store-Instanzen
const roomStore = useRoomStore()
const bookingStore = useBookingStore()
const userStore = useUserStore()

// Refs
const bookingModalRef = ref(null)

// Computed
const rooms = computed(() => roomStore.rooms)
const selectedRoomId = computed(() => roomStore.selectedRoomId)
const selectedRoom = computed(() => roomStore.getSelectedRoom)

const today = computed(() => new Date().toISOString().split('T')[0])

const todayBookings = computed(() =>
    bookingStore.bookings.filter(booking => booking.date === today.value)
)

const todayRoomBookings = computed(() => {
  if (!selectedRoomId.value) return []
  return todayBookings.value.filter(booking =>
      booking.room_id == selectedRoomId.value || booking.roomId == selectedRoomId.value
  )
})

// Methods
function openBookingModal() {
  if (bookingModalRef.value) {
    bookingModalRef.value.openModal({
      date: today.value,
      roomId: selectedRoomId.value
    })
  }
}

// Initialize data
onMounted(async () => {
  try {
    await Promise.all([
      roomStore.fetchRooms(),
      bookingStore.fetchBookings()
    ])
  } catch (error) {
    console.error('Fehler beim Laden der Daten:', error)
  }
})
</script>