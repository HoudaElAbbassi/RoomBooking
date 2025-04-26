<!-- pages/index.vue -->
<template>
  <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
    <!-- Loading state -->
    <div v-if="roomStore.loading || bookingStore.loading" class="col-span-full text-center py-10">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      <p class="mt-2 text-gray-600">Daten werden geladen...</p>
    </div>

    <!-- Error state -->
    <div v-else-if="roomStore.error || bookingStore.error" class="col-span-full bg-red-50 text-red-700 p-4 rounded-lg">
      <p><strong>Fehler:</strong> {{ roomStore.error || bookingStore.error }}</p>
      <button @click="loadData" class="mt-2 px-4 py-2 bg-red-100 hover:bg-red-200 rounded">
        Erneut versuchen
      </button>
    </div>

    <!-- Content when data is loaded -->
    <template v-else>
      <!-- Linke Seitenleiste - Raumliste -->
      <div class="md:col-span-1 bg-white rounded-lg shadow p-4">
        <div class="flex justify-between items-center mb-4 pb-2 border-b">
          <h2 class="text-xl font-semibold">Verfügbare Räume</h2>
        </div>

        <ul class="space-y-2">
          <li v-for="room in rooms" :key="room._id"
              class="p-3 rounded-md cursor-pointer transition-all"
              :class="{'bg-blue-50 border-l-4 border-blue-500': room._id === selectedRoomId,
                    'hover:bg-gray-50 border-l-4 border-transparent': room._id !== selectedRoomId}"
              @click="selectRoom(room._id)">
            <h3 class="font-medium">{{ room.name }}</h3>
            <p class="text-sm text-gray-600">{{ room.location }} • {{ room.capacity }} Personen</p>
          </li>
        </ul>
      </div>

      <!-- Rechte Inhaltsseite -->
      <div class="md:col-span-3 space-y-6">
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
                     placeholder="Titel der Buchung">
            </div>

            <div class="mb-4">
              <label class="block text-gray-700 font-medium mb-2">Kontaktperson</label>
              <input type="text" v-model="bookingData.contactName"
                     class="w-full p-2 border rounded"
                     placeholder="Ihr Name">
            </div>

            <button type="submit"
                    class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
              Raum buchen
            </button>
          </form>
        </div>

        <!-- Buchungsübersicht -->
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-xl font-semibold mb-4">Aktuelle Buchungen</h2>

          <div v-if="roomBookings.length === 0" class="text-gray-500">
            Keine Buchungen für diesen Raum vorhanden.
          </div>

          <div v-else class="space-y-3">
            <div v-for="booking in roomBookings" :key="booking._id"
                 class="p-3 border rounded-md">
              <div class="flex justify-between">
                <strong>{{ booking.title }}</strong>
                <span>{{ booking.date }}, {{ booking.timeSlot }} Uhr</span>
              </div>
              <div class="text-gray-600 text-sm">
                Kontakt: {{ booking.contactName }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoomStore } from '../stores/roomStore'
import { useBookingStore } from '../stores/bookingStore'

// Store-Instanzen
const roomStore = useRoomStore()
const bookingStore = useBookingStore()

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

// Formulardaten
const bookingData = ref({
  date: today.value,
  timeSlot: '09:00',
  title: '',
  contactName: '',
  description: ''
})

// Methoden
function selectRoom(roomId) {
  roomStore.selectRoom(roomId)
  // Bei Raumwechsel auch die Buchungen für den neuen Raum laden
  loadBookingsForSelectedRoom()
}

function submitBooking() {
  if (!bookingData.value.title || !bookingData.value.contactName) {
    alert('Bitte füllen Sie alle Pflichtfelder aus.')
    return
  }

  bookingStore.addBooking({
    roomId: selectedRoomId.value,
    date: bookingData.value.date,
    timeSlot: bookingData.value.timeSlot,
    title: bookingData.value.title,
    contactName: bookingData.value.contactName,
    description: bookingData.value.description
  })
      .then(() => {
        // Formular zurücksetzen
        bookingData.value.title = ''
        bookingData.value.contactName = ''
        bookingData.value.description = ''

        alert('Buchung erfolgreich gespeichert!')

        // Buchungen nach erfolgreicher Speicherung neu laden
        loadBookingsForSelectedRoom()
      })
      .catch(error => {
        alert(`Fehler beim Speichern der Buchung: ${error.message}`)
      })
}

// Lädt die Buchungen für den ausgewählten Raum und das ausgewählte Datum
function loadBookingsForSelectedRoom() {
  if (selectedRoomId.value && bookingData.value.date) {
    bookingStore.fetchBookings({
      roomId: selectedRoomId.value,
      date: bookingData.value.date
    })
  }
}

// Lädt alle Daten beim Start
function loadData() {
  Promise.all([
    roomStore.fetchRooms(),
    bookingStore.fetchBookings()
  ])
      .then(() => {
        // Wenn ein Raum ausgewählt ist, lade dessen Buchungen
        if (selectedRoomId.value) {
          loadBookingsForSelectedRoom()
        }
      })
      .catch(err => {
        console.error('Fehler beim Laden der Daten:', err)
      })
}

// Beim Initialisieren der Komponente
onMounted(() => {
  loadData()
})
</script>