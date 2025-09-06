<!-- nuxt-app/components/BookingModal.vue - Erweitert mit Verfügbarkeitsprüfung -->
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
                  v-model="bookingData.roomId"
                  @change="onRoomChange">
            <option v-for="room in rooms" :key="room._id || room.id" :value="room._id || room.id">
              {{ room.name }}
              <span v-if="room.availability_rules && room.availability_rules.type === 'time_restricted'" class="text-sm text-gray-500">
                (zeitbeschränkt)
              </span>
            </option>
          </select>
        </div>

        <div class="mb-4">
          <label class="block text-gray-700 font-medium mb-2" for="bookingDate">Datum</label>
          <input type="date" id="bookingDate"
                 class="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                 v-model="bookingData.date"
                 :min="today"
                 @change="onDateChange">
        </div>

        <!-- Verfügbarkeitshinweis für zeitbeschränkte Räume -->
        <div v-if="selectedRoomRules && selectedRoomRules.type === 'time_restricted'"
             class="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <h4 class="font-medium text-blue-900 mb-2">
            <i class="fas fa-info-circle mr-1"></i>
            Verfügbarkeitszeiten für {{ selectedRoomName }}:
          </h4>
          <ul class="text-sm text-blue-800 space-y-1">
            <li v-for="rule in selectedRoomRules.rules" :key="rule.day">
              <i class="fas fa-clock mr-1"></i>
              {{ getDayName(rule.day) }}: {{ rule.start_time }} - {{ rule.end_time }} Uhr
            </li>
          </ul>
        </div>

        <!-- Warnung bei nicht verfügbarem Datum -->
        <div v-if="!isDayAvailable" class="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-md">
          <div class="flex items-center text-orange-800">
            <i class="fas fa-exclamation-triangle mr-2"></i>
            <span class="font-medium">Raum nicht verfügbar</span>
          </div>
          <p class="text-sm text-orange-700 mt-1">
            Der gewählte Raum ist an diesem Tag nicht verfügbar.
          </p>
        </div>

        <div class="mb-4">
          <label class="block text-gray-700 font-medium mb-2">Zeitslot auswählen</label>

          <!-- Loading Zeitslots -->
          <div v-if="loadingAvailability" class="text-center py-4">
            <i class="fas fa-spinner fa-spin text-blue-500"></i>
            <p class="text-sm text-gray-600 mt-1">Verfügbarkeit wird geprüft...</p>
          </div>

          <!-- Zeitslots Grid -->
          <div v-else class="grid grid-cols-3 gap-2">
            <button
                v-for="slot in allTimeSlots"
                :key="slot"
                type="button"
                class="p-2 text-center rounded border transition-colors text-sm"
                :class="getTimeSlotClass(slot)"
                :disabled="!isTimeSlotSelectable(slot)"
                @click="selectTimeSlot(slot)">
              {{ slot }}
            </button>
          </div>

          <!-- Legende -->
          <div class="mt-3 text-xs space-y-1">
            <div class="flex items-center">
              <div class="w-4 h-4 bg-blue-500 rounded mr-2"></div>
              <span>Ausgewählt</span>
            </div>
            <div class="flex items-center">
              <div class="w-4 h-4 bg-gray-200 rounded mr-2"></div>
              <span>Verfügbar</span>
            </div>
            <div class="flex items-center">
              <div class="w-4 h-4 bg-red-200 rounded mr-2"></div>
              <span>Belegt</span>
            </div>
            <div class="flex items-center">
              <div class="w-4 h-4 bg-gray-400 rounded mr-2"></div>
              <span>Nicht verfügbar</span>
            </div>
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
                  class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  :disabled="isSubmitting || !bookingData.timeSlot || !isDayAvailable">
            {{ isSubmitting ? 'Wird gespeichert...' : 'Buchen' }}
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
import { useUserStore } from '~/stores/userStore'

const roomStore = useRoomStore()
const bookingStore = useBookingStore()
const userStore = useUserStore()

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

// UI-States
const isSubmitting = ref(false)
const errorMessage = ref('')
const loadingAvailability = ref(false)
const roomAvailability = ref(null)

// Computed Properties
const rooms = computed(() => roomStore.rooms)
const today = computed(() => new Date().toISOString().split('T')[0])

const allTimeSlots = [
  "08:00", "09:00", "10:00", "11:00",
  "12:00", "13:00", "14:00", "15:00",
  "16:00", "17:00", "18:00", "19:00",
  "20:00", "21:00", "22:00"
]

const selectedRoom = computed(() => {
  return rooms.value.find(room =>
      (room._id || room.id) == bookingData.value.roomId
  )
})

const selectedRoomName = computed(() => selectedRoom.value?.name || '')

const selectedRoomRules = computed(() => {
  return selectedRoom.value?.availability_rules || null
})

const isDayAvailable = computed(() => {
  if (!selectedRoomRules.value || selectedRoomRules.value.type === 'always_available') {
    return true
  }

  if (!bookingData.value.date || selectedRoomRules.value.type !== 'time_restricted') {
    return true
  }

  const date = new Date(bookingData.value.date)
  const dayOfWeek = date.getDay()
  const rules = selectedRoomRules.value.rules || []

  return rules.some(rule => rule.day === dayOfWeek)
})

// Methoden
function resetForm() {
  bookingData.value = {
    roomId: bookingParams.value.roomId || (rooms.value[0]?._id || rooms.value[0]?.id),
    date: bookingParams.value.date || today.value,
    timeSlot: '',
    title: '',
    description: '',
    contactName: userStore.userDisplayName || ''
  }
  errorMessage.value = ''
  roomAvailability.value = null
}

function openModal(params = {}) {
  bookingParams.value = params
  resetForm()
  isModalOpen.value = true

  // Lade Verfügbarkeit für gewählten Raum und Datum
  if (bookingData.value.roomId && bookingData.value.date) {
    loadRoomAvailability()
  }
}

function closeModal() {
  isModalOpen.value = false
}

function getDayName(dayNumber) {
  const days = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag']
  return days[dayNumber] || 'Unbekannt'
}

async function loadRoomAvailability() {
  if (!bookingData.value.roomId || !bookingData.value.date) {
    return
  }

  loadingAvailability.value = true
  try {
    const response = await fetch(`/.netlify/functions/room-availability?roomId=${bookingData.value.roomId}&date=${bookingData.value.date}`)

    if (response.ok) {
      roomAvailability.value = await response.json()
    } else {
      console.error('Failed to load room availability')
      roomAvailability.value = null
    }
  } catch (error) {
    console.error('Error loading room availability:', error)
    roomAvailability.value = null
  } finally {
    loadingAvailability.value = false
  }
}

function isTimeSlotAvailable(slot) {
  // Prüfe ob Zeitslot grundsätzlich für den Raum verfügbar ist
  if (!isDayAvailable.value) {
    return false
  }

  if (selectedRoomRules.value?.type === 'time_restricted') {
    const date = new Date(bookingData.value.date)
    const dayOfWeek = date.getDay()
    const rules = selectedRoomRules.value.rules || []

    return rules.some(rule =>
        rule.day === dayOfWeek &&
        slot >= rule.start_time &&
        slot <= rule.end_time
    )
  }

  return true // Für always_available Räume
}

function isTimeSlotBooked(slot) {
  return bookingStore.isTimeSlotBooked(
      bookingData.value.roomId,
      bookingData.value.date,
      slot
  )
}

function isTimeSlotSelectable(slot) {
  return isTimeSlotAvailable(slot) && !isTimeSlotBooked(slot)
}

function getTimeSlotClass(slot) {
  if (bookingData.value.timeSlot === slot) {
    return 'bg-blue-500 text-white border-blue-500'
  }

  if (!isTimeSlotAvailable(slot)) {
    return 'bg-gray-400 text-gray-600 cursor-not-allowed'
  }

  if (isTimeSlotBooked(slot)) {
    return 'bg-red-200 text-red-800 cursor-not-allowed'
  }

  return 'bg-gray-200 hover:bg-gray-300 border-gray-300 cursor-pointer'
}

function selectTimeSlot(slot) {
  if (isTimeSlotSelectable(slot)) {
    bookingData.value.timeSlot = slot
  }
}

function onRoomChange() {
  bookingData.value.timeSlot = '' // Reset time slot when room changes
  if (bookingData.value.date) {
    loadRoomAvailability()
  }
}

function onDateChange() {
  bookingData.value.timeSlot = '' // Reset time slot when date changes
  if (bookingData.value.roomId) {
    loadRoomAvailability()
  }
}

async function submitBooking() {
  if (!bookingData.value.title || !bookingData.value.contactName || !bookingData.value.timeSlot) {
    errorMessage.value = 'Bitte füllen Sie alle Pflichtfelder aus.'
    return
  }

  if (!isDayAvailable.value) {
    errorMessage.value = 'Der gewählte Raum ist an diesem Tag nicht verfügbar.'
    return
  }

  if (!isTimeSlotSelectable(bookingData.value.timeSlot)) {
    errorMessage.value = 'Der gewählte Zeitslot ist nicht verfügbar.'
    return
  }

  isSubmitting.value = true

  try {
    await bookingStore.addBooking({
      roomId: bookingData.value.roomId,
      date: bookingData.value.date,
      timeSlot: bookingData.value.timeSlot,
      title: bookingData.value.title,
      description: bookingData.value.description,
      contactName: bookingData.value.contactName,
      userId: userStore.user?.id
    })

    // Modal schließen
    closeModal()

    // Erfolgsmeldung anzeigen
    alert('Buchung erfolgreich gespeichert!')
  } catch (error) {
    errorMessage.value = `Fehler beim Speichern: ${error.message}`
    console.error('Fehler beim Buchungsversuch:', error)
    alert('Es gab ein Problem beim Speichern der Buchung. Bitte versuchen Sie es erneut.')
  } finally {
    isSubmitting.value = false
  }
}

// Watchers
watch(() => bookingData.value.roomId, () => {
  onRoomChange()
})

watch(() => bookingData.value.date, () => {
  onDateChange()
})

// Event-Listener für das öffnen des Modals
defineExpose({ openModal })

// Globales Event-Handling
if (process.client) {
  window.addEventListener('openBookingModal', (event) => {
    openModal(event.detail)
  })
}
</script>