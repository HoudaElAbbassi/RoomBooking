<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
       v-if="isModalOpen">
    <div class="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
      <div class="p-4 border-b flex justify-between items-center">
        <h2 class="text-xl font-semibold">Raum buchen</h2>
        <button @click="closeModal" class="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
      </div>

      <form @submit.prevent="submitBooking" class="p-6">
        <div class="mb-4">
          <label class="block text-gray-700 font-medium mb-2" for="roomSelect">Raum auswählen</label>
          <select id="roomSelect"
                  class="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  v-model="bookingData.roomId">
            <option v-for="room in rooms" :key="room.id" :value="room.id">{{ room.name }}</option>
          </select>
        </div>

        <div class="mb-4">
          <label class="block text-gray-700 font-medium mb-2" for="bookingDate">Datum</label>
          <input type="date" id="bookingDate"
                 class="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                 v-model="bookingData.date"
                 :min="today">
        </div>

        <div class="mb-4">
          <label class="block text-gray-700 font-medium mb-2">Zeitslot auswählen</label>
          <div class="grid grid-cols-3 gap-2">
            <button
                v-for="slot in timeSlots"
                :key="slot"
                type="button"
                class="p-2 text-center rounded border transition-colors"
                :class="{
                'bg-blue-500 text-white border-blue-500': bookingData.timeSlot === slot,
                'bg-gray-200 text-gray-500 cursor-not-allowed': isTimeSlotBooked(slot),
                'hover:bg-gray-100 border-gray-300': bookingData.timeSlot !== slot && !isTimeSlotBooked(slot)
              }"
                :disabled="isTimeSlotBooked(slot)"
                @click="bookingData.timeSlot = slot">
              {{ slot }}
            </button>
          </div>
        </div>

        <div class="mb-4">
          <label class="block text-gray-700 font-medium mb-2" for="bookingTitle">Titel</label>
          <input type="text" id="bookingTitle"
                 class="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                 v-model="bookingData.title"
                 placeholder="Titel der Buchung"
                 required>
        </div>

        <div class="mb-4">
          <label class="block text-gray-700 font-medium mb-2" for="bookingDescription">
            Beschreibung (optional)
          </label>
          <textarea id="bookingDescription"
                    class="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    v-model="bookingData.description"
                    placeholder="Beschreibung hinzufügen"
                    rows="3"></textarea>
        </div>

        <div class="mb-6">
          <label class="block text-gray-700 font-medium mb-2" for="contactName">Kontaktperson</label>
          <input type="text" id="contactName"
                 class="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                 v-model="bookingData.contactName"
                 placeholder="Ihr Name"
                 required>
        </div>

        <div class="flex justify-end gap-3 pt-4 border-t">
          <button type="button"
                  class="px-4 py-2 border border-blue-500 text-blue-500 rounded hover:bg-blue-50"
                  @click="closeModal">
            Abbrechen
          </button>
          <button type="submit"
                  class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            Buchen
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoomStore } from '~/stores/roomStore'
import { useBookingStore } from '~/stores/bookingStore'

const roomStore = useRoomStore()
const bookingStore = useBookingStore()

// Modal-Zustand
const isModalOpen = ref(false)
const bookingParams = ref({
  date: null,
  roomId: null
})

// Formular-Daten
const bookingData = ref({
  roomId: null,
  date: '',
  timeSlot: '',
  title: '',
  description: '',
  contactName: ''
})

// Computed Properties
const rooms = computed(() => roomStore.rooms)
const timeSlots = computed(() => bookingStore.timeSlots)
const today = computed(() => new Date().toISOString().split('T')[0])

// Methoden
function resetForm() {
  bookingData.value = {
    roomId: bookingParams.value.roomId || roomStore.selectedRoomId,
    date: bookingParams.value.date || today.value,
    timeSlot: '',
    title: '',
    description: '',
    contactName: ''
  }
}

function openModal(params = {}) {
  bookingParams.value = params
  resetForm()
  isModalOpen.value = true
}

function closeModal() {
  isModalOpen.value = false
}

function isTimeSlotBooked(slot) {
  return bookingStore.isTimeSlotBooked(
      bookingData.value.roomId,
      bookingData.value.date,
      slot
  )
}

function submitBooking() {
  // Buchung hinzufügen
  bookingStore.addBooking({
    roomId: bookingData.value.roomId,
    date: bookingData.value.date,
    timeSlot: bookingData.value.timeSlot,
    title: bookingData.value.title,
    description: bookingData.value.description,
    contactName: bookingData.value.contactName
  })

  // Modal schließen
  closeModal()

  // Erfolgsmeldung anzeigen (könnte in einer echten App durch ein Toast/Notification-System ersetzt werden)
  alert('Buchung erfolgreich gespeichert!')
}

// Event-Listener für das öffnen des Modals
defineExpose({ openModal })

// Globales Event-Handling (in einer realen App könnte man Nuxt's $bus oder andere Event-Strategien verwenden)
// Dies ist eine Vereinfachung für dieses Beispiel
if (process.client) {
  window.addEventListener('openBookingModal', (event) => {
    openModal(event.detail)
  })
}
</script>
