<!-- nuxt-app/pages/calendar.vue -->
<template>
  <div>
    <div class="mb-6">
      <h1 class="text-2xl font-bold mb-2">Buchungskalender</h1>
      <p class="text-gray-600">Hier sehen Sie alle Raumbuchungen in der Kalenderübersicht</p>
    </div>

    <div class="flex flex-wrap md:flex-nowrap gap-6">
      <!-- Raumfilter Sidebar -->
      <div class="w-full md:w-1/4 bg-white rounded-lg shadow p-4">
        <h2 class="text-lg font-semibold mb-3 pb-2 border-b">Räume filtern</h2>

        <div class="space-y-2">
          <div class="flex items-center">
            <input
                type="checkbox"
                id="all-rooms"
                class="mr-2"
                v-model="showAllRooms"
                @change="toggleAllRooms"
            >
            <label for="all-rooms" class="select-none">Alle Räume</label>
          </div>

          <div
              v-for="room in rooms"
              :key="room.id"
              class="flex items-center"
          >
            <input
                type="checkbox"
                :id="`room-${room.id}`"
                class="mr-2"
                v-model="selectedRoomIds"
                :value="room.id"
            >
            <label :for="`room-${room.id}`" class="select-none">{{ room.name }}</label>
          </div>
        </div>
      </div>

      <!-- Kalenderansicht -->
      <div class="w-full md:w-3/4">
        <Calendar :filter-room-ids="selectedRoomIds" />
      </div>
    </div>

    <!-- Buchungsmodal hinzufügen -->
    <BookingModal ref="bookingModalRef" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoomStore } from '../stores/roomStore'
import Calendar from '../components/Calendar.vue'
import BookingModal from '../components/BookingModal.vue'

// Middleware für Authentication
definePageMeta({
  middleware: ['auth']
})

const roomStore = useRoomStore()
const rooms = computed(() => roomStore.rooms)

// Referenz zum Buchungsmodal
const bookingModalRef = ref(null)

// Raumfilter
const selectedRoomIds = ref([])
const showAllRooms = ref(true)

// Initialisieren: Alle Räume auswählen
function initializeRoomFilter() {
  selectedRoomIds.value = rooms.value.map(room => room.id)
}

// Alle Räume ein-/ausschalten
function toggleAllRooms() {
  if (showAllRooms.value) {
    selectedRoomIds.value = rooms.value.map(room => room.id)
  } else {
    selectedRoomIds.value = []
  }
}

// Überwache die Auswahl der Räume
watch(selectedRoomIds, (newValue) => {
  // Prüfe, ob alle Räume oder keine Räume ausgewählt sind
  showAllRooms.value = newValue.length === rooms.value.length
}, { deep: true })

// Beim Laden alle Räume anzeigen
onMounted(async () => {
  await roomStore.fetchRooms()
  initializeRoomFilter()

  // Event-Listener für openBookingModal-Event registrieren
  if (process.client) {
    window.addEventListener('openBookingModal', (event) => {
      if (bookingModalRef.value) {
        bookingModalRef.value.openModal(event.detail)
      }
    })
  }
})
</script>