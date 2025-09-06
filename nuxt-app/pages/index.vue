<!-- nuxt-app/pages/index.vue -->
<template>
  <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
    <!-- Linke Seitenleiste - Raumliste -->
    <div class="md:col-span-1 bg-white rounded-lg shadow p-4">
      <div class="flex justify-between items-center mb-4 pb-2 border-b">
        <h2 class="text-xl font-semibold">Verfügbare Räume</h2>
      </div>

      <ul class="space-y-2">
        <li v-for="room in rooms" :key="room._id || room.id"
            class="p-3 rounded-md cursor-pointer transition-all"
            :class="{'bg-blue-50 border-l-4 border-blue-500': (room._id || room.id) === selectedRoomId,
                  'hover:bg-gray-50 border-l-4 border-transparent': (room._id || room.id) !== selectedRoomId}"
            @click="selectRoom(room._id || room.id)">
          <h3 class="font-medium">{{ room.name }}</h3>
          <p class="text-sm text-gray-600">{{ room.location }} • {{ room.capacity }} Personen</p>
        </li>
      </ul>
    </div>

    <!-- Rechte Inhaltsseite -->
    <div class="md:col-span-3 space-y-6">
      <!-- Welcome Message -->
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h2 class="text-lg font-semibold text-blue-900">
          Willkommen, {{ userStore.userDisplayName }}!
        </h2>
        <p class="text-blue-700">
          Sie sind als {{ userStore.user?.role === 'admin' ? 'Administrator' : 'Benutzer' }} angemeldet.
        </p>
      </div>

      <!-- Raumdetails -->
      <div class="bg-white rounded-lg shadow p-6" v-if="selectedRoom">
        <h2 class="text-2xl font-semibold mb-3">{{ selectedRoom.name }}</h2>
        <p class="text-gray-700 mb-4">{{ selectedRoom.description }}</p>
        <p class="text-gray-700 mb-4">
          <i class="fas fa-map-marker-alt mr-2 text-blue-500"></i> {{ selectedRoom.location }} •
          <i class="fas fa-users ml-2 mr-2 text-blue-500"></i> {{ selectedRoom.capacity }} Personen
        </p>
        <div class="flex flex-wrap gap-2">
          <span v-for="feature in selectedRoom.features" :key="feature"
                class="px-3 py-1 bg-gray-100 rounded-full text-sm flex items-center">
            <i class="fas fa-check text-blue-500 mr-1"></i> {{ feature }}
          </span>
        </div>
      </div>

      <!-- Buchungsbereich -->
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-xl font-semibold mb-4">Raum buchen</h2>

        <div v-if="submitError" class="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {{ submitError }}
        </div>

        <form @submit.prevent="submitBooking">
          <div class="mb-4">
            <label class="block text-gray-700 font-medium mb-2">Datum</label>
            <input type="date" v-model="bookingData.date"
                   class="w-full p-2 border rounded"
                   :min="today">
          </div>

          <div class="mb-4">
            <label class="block text-gray-700 font-medium mb-2">Zeit</label>
            <select v-model="bookingData.timeSlot" class="w-full p-2 border rounded">
              <option v-for="slot in timeSlots" :key="slot" :value="slot">
                {{ slot }} Uhr
              </option>
            </select>
          </div>

          <div class="mb-4">
            <label class="block text-gray-700 font-medium mb-2">Titel</label>
            <input type="text" v-model="bookingData.title"
                   class="w-full p-2 border rounded"
                   placeholder="Titel der Buchung"
                   required>
          </div>

          <div class="mb-4">
            <label class="block text-gray-700 font-medium mb-2">Kontaktperson</label>
            <input type="text" v-model="bookingData.contactName"
                   class="w-full p-2 border rounded"
                   placeholder="Ihr Name"
                   required>
          </div>

          <button type="submit"
                  class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  :disabled="isSubmitting">
            {{ isSubmitting ? 'Wird gespeichert...' : 'Raum buchen' }}
          </button>
        </form>
      </div>

      <!-- Buchungsübersicht -->
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-xl font-semibold mb-4">Aktuelle Buchungen</h2>

        <div v-if="isLoading" class="text-center py-4">
          <i class="fas fa-spinner fa-spin text-blue-500 text-2xl"></i>
          <p class="mt-2 text-gray-600">Buchungen werden geladen...</p>
        </div>

        <div v-else-if="roomBookings.length === 0" class="text-gray-500">
          Keine Buchungen für diesen Raum vorhanden.
        </div>

        <div v-else class="space-y-3">
          <div v-for="booking in roomBookings" :key="booking._id || booking.id"
               class="p-3 border rounded-md">
            <div class="flex justify-between">
              <strong>{{ booking.title }}</strong>
              <span>{{ booking.date }}, {{ booking.timeSlot || booking.time_slot }} Uhr</span>
            </div>
            <div class="text-gray-600 text-sm">
              Kontakt: {{ booking.contactName || booking.contact_name }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoomStore } from '../stores/roomStore'
import { useBookingStore } from '../stores/bookingStore'
import { useUserStore } from '../stores/userStore'
import DashboardQuickActions from '../components/DashboardQuickActions.vue'

// Middleware für Authentication
definePageMeta({
  middleware: ['auth']
})

// Store-Instanzen
const roomStore = useRoomStore()
const bookingStore = useBookingStore()
const userStore = useUserStore()

// UI-States
const isSubmitting = ref(false)
const submitError = ref('')
const isLoading = computed(() => roomStore.loading || bookingStore.loading)

// Raumdaten
const rooms = computed(() => roomStore.rooms)
const selectedRoomId = computed(() => roomStore.selectedRoomId)
const selectedRoom = computed(() => roomStore.getSelectedRoom)

// Buchungsdaten
const timeSlots = computed(() => bookingStore.timeSlots)
const today = computed(() => new Date().toISOString().split('T')[0])
const roomBookings = computed(() =>
    bookingStore.getBookingsForRoomAndDate(selectedRoomId.value, bookingData.value.date)
)

// Formulardaten mit Benutzerinformationen vorausgefüllt
const bookingData = ref({
  date: today.value,
  timeSlot: '09:00',
  title: '',
  contactName: ''
})

// Watch userStore and update contactName when user is available
watch(() => userStore.userDisplayName, (newName) => {
  if (newName && newName !== 'Guest' && !bookingData.value.contactName) {
    bookingData.value.contactName = newName
  }
}, { immediate: true })

// Methoden
function selectRoom(roomId) {
  roomStore.selectRoom(roomId)
}

async function submitBooking() {
  if (!bookingData.value.title || !bookingData.value.contactName) {
    submitError.value = 'Bitte füllen Sie alle Pflichtfelder aus.'
    return
  }

  isSubmitting.value = true
  submitError.value = ''

  try {
    await bookingStore.addBooking({
      roomId: selectedRoomId.value,
      date: bookingData.value.date,
      timeSlot: bookingData.value.timeSlot,
      title: bookingData.value.title,
      contactName: bookingData.value.contactName,
      description: '',
      userId: userStore.user?.id // Füge Benutzer-ID hinzu
    })

    // Formular zurücksetzen
    bookingData.value.title = ''
    // Behalte contactName für nächste Buchung

    alert('Buchung erfolgreich gespeichert!')
  } catch (error) {
    submitError.value = `Es gab ein Problem beim Speichern: ${error.message}`
    console.error('Fehler beim Buchungsversuch:', error)
  } finally {
    isSubmitting.value = false
  }
}

// Daten laden beim Initialisieren der Komponente
onMounted(async () => {
  try {
    // Räume und Buchungen laden
    await Promise.all([
      roomStore.fetchRooms(),
      bookingStore.fetchBookings()
    ])
  } catch (error) {
    console.error('Fehler beim Laden der Daten:', error)
    // Als Fallback lokale Daten laden
    if (bookingStore.bookings.length === 0) {
      bookingStore.loadFromLocalStorage?.()
    }
  }
})
</script>