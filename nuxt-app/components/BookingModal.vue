<!-- nuxt-app/components/BookingModal.vue - Extended Version -->
<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
       v-if="isModalOpen">
    <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
      <div class="p-4 border-b flex justify-between items-center sticky top-0 bg-white">
        <h2 class="text-xl font-semibold">{{ isEdit ? 'Buchung bearbeiten' : 'Raum buchen' }}</h2>
        <button @click="closeModal" class="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
      </div>

      <form @submit.prevent="submitBooking" class="p-6">
        <!-- Error Display -->
        <div v-if="errorMessage" class="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded">
          <i class="fas fa-exclamation-triangle mr-2"></i>
          {{ errorMessage }}
        </div>

        <!-- Basic Information -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label class="block text-gray-700 font-medium mb-2" for="roomSelect">
              <i class="fas fa-door-open mr-1"></i>
              Raum auswählen
            </label>
            <select id="roomSelect"
                    class="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    v-model="bookingData.roomId"
                    @change="onRoomChange"
                    :disabled="isEdit">
              <option v-for="room in rooms" :key="room._id || room.id" :value="room._id || room.id">
                {{ room.name }} ({{ room.capacity }} Personen)
              </option>
            </select>
          </div>

          <div>
            <label class="block text-gray-700 font-medium mb-2" for="bookingDate">
              <i class="fas fa-calendar mr-1"></i>
              Datum
            </label>
            <input type="date" id="bookingDate"
                   class="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                   v-model="bookingData.date"
                   :min="today"
                   @change="onDateChange">
          </div>
        </div>

        <!-- Time Selection -->
        <div class="mb-6">
          <h3 class="text-lg font-medium mb-3">
            <i class="fas fa-clock mr-1"></i>
            Zeitauswahl
          </h3>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-gray-700 font-medium mb-2">Startzeit</label>
              <select v-model="bookingData.startTime"
                      class="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      @change="validateTimeSelection">
                <option v-for="slot in availableStartTimes" :key="slot" :value="slot">
                  {{ slot }}
                </option>
              </select>
            </div>

            <div>
              <label class="block text-gray-700 font-medium mb-2">Endzeit</label>
              <select v-model="bookingData.endTime"
                      class="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      @change="validateTimeSelection">
                <option v-for="slot in availableEndTimes" :key="slot" :value="slot">
                  {{ slot }}
                </option>
              </select>
            </div>
          </div>

          <!-- Duration Display -->
          <div v-if="bookingDuration > 0" class="mt-2 text-sm text-gray-600">
            <i class="fas fa-info-circle mr-1"></i>
            Dauer: {{ formatDuration(bookingDuration) }}
          </div>
        </div>

        <!-- Recurring Options -->
        <div class="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 class="text-lg font-medium mb-3">
            <i class="fas fa-repeat mr-1"></i>
            Wiederholungsoptionen
          </h3>

          <div class="flex items-center mb-3">
            <input type="checkbox"
                   id="isRecurring"
                   v-model="bookingData.isRecurring"
                   class="mr-2"
                   @change="onRecurringChange">
            <label for="isRecurring" class="font-medium">
              Wiederkehrender Termin
            </label>
          </div>

          <div v-if="bookingData.isRecurring" class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-gray-700 font-medium mb-2">Wiederholung</label>
                <select v-model="bookingData.recurrenceType"
                        class="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="daily">Täglich</option>
                  <option value="weekly">Wöchentlich</option>
                  <option value="monthly">Monatlich</option>
                </select>
              </div>

              <div>
                <label class="block text-gray-700 font-medium mb-2">Ende der Wiederholung</label>
                <input type="date"
                       v-model="bookingData.recurrenceEndDate"
                       class="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                       :min="bookingData.date"
                       :max="endOfYear">
              </div>
            </div>

            <!-- Recurring Preview -->
            <div v-if="recurringPreview.length > 0" class="mt-3">
              <h4 class="font-medium text-sm mb-2">Vorschau der Termine:</h4>
              <div class="max-h-32 overflow-y-auto text-sm text-gray-600 bg-white p-2 rounded border">
                <div v-for="date in recurringPreview.slice(0, 10)" :key="date">
                  {{ formatPreviewDate(date) }}
                </div>
                <div v-if="recurringPreview.length > 10" class="text-xs text-gray-500 mt-1">
                  ... und {{ recurringPreview.length - 10 }} weitere Termine
                </div>
              </div>
              <div class="text-xs text-gray-500 mt-1">
                Insgesamt {{ recurringPreview.length }} Termine bis {{ formatPreviewDate(bookingData.recurrenceEndDate) }}
              </div>
            </div>
          </div>
        </div>

        <!-- Booking Details -->
        <div class="space-y-4 mb-6">
          <div>
            <label class="block text-gray-700 font-medium mb-2" for="bookingTitle">
              <i class="fas fa-tag mr-1"></i>
              Titel
            </label>
            <input type="text" id="bookingTitle"
                   class="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                   v-model="bookingData.title"
                   placeholder="Titel der Buchung"
                   required>
          </div>

          <div>
            <label class="block text-gray-700 font-medium mb-2" for="bookingDescription">
              <i class="fas fa-align-left mr-1"></i>
              Beschreibung (optional)
            </label>
            <textarea id="bookingDescription"
                      class="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      v-model="bookingData.description"
                      placeholder="Beschreibung hinzufügen"
                      rows="3"></textarea>
          </div>

          <div>
            <label class="block text-gray-700 font-medium mb-2" for="contactName">
              <i class="fas fa-user mr-1"></i>
              Kontaktperson
            </label>
            <input type="text" id="contactName"
                   class="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                   v-model="bookingData.contactName"
                   placeholder="Ihr Name"
                   required>
          </div>
        </div>

        <!-- Conflict Warning -->
        <div v-if="timeConflicts.length > 0" class="mb-4 p-3 bg-orange-100 border border-orange-300 text-orange-700 rounded">
          <h4 class="font-medium mb-2">
            <i class="fas fa-exclamation-triangle mr-1"></i>
            Zeitkonflikte erkannt:
          </h4>
          <ul class="text-sm space-y-1">
            <li v-for="conflict in timeConflicts" :key="conflict.date + conflict.time">
              {{ formatPreviewDate(conflict.date) }}: {{ conflict.title }} ({{ conflict.time }})
            </li>
          </ul>
        </div>

        <!-- Form Actions -->
        <div class="flex justify-end gap-3 pt-4 border-t">
          <button type="button"
                  class="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
                  @click="closeModal">
            Abbrechen
          </button>
          <button type="submit"
                  class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                  :disabled="isSubmitting || !isFormValid">
            <i v-if="isSubmitting" class="fas fa-spinner fa-spin mr-2"></i>
            <i v-else-if="bookingData.isRecurring" class="fas fa-repeat mr-2"></i>
            <i v-else class="fas fa-save mr-2"></i>
            {{ getSubmitButtonText() }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useRoomStore } from '~/stores/roomStore'
import { useBookingStore } from '~/stores/bookingStore'
import { useUserStore } from '~/stores/userStore'

const roomStore = useRoomStore()
const bookingStore = useBookingStore()
const userStore = useUserStore()

// Modal state
const isModalOpen = ref(false)
const isEdit = ref(false)
const editBookingId = ref(null)

// Form data
const bookingData = ref({
  roomId: null,
  date: '',
  startTime: '09:00',
  endTime: '10:00',
  title: '',
  description: '',
  contactName: '',
  isRecurring: false,
  recurrenceType: 'weekly',
  recurrenceEndDate: ''
})

// UI states
const isSubmitting = ref(false)
const errorMessage = ref('')
const timeConflicts = ref([])

// Computed properties
const rooms = computed(() => roomStore.rooms)
const today = computed(() => new Date().toISOString().split('T')[0])
const endOfYear = computed(() => '2025-12-31')

// All possible time slots (30-minute intervals)
const allTimeSlots = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
  '20:00', '20:30', '21:00', '21:30', '22:00'
]

const availableStartTimes = computed(() => allTimeSlots)

const availableEndTimes = computed(() => {
  const startIndex = allTimeSlots.indexOf(bookingData.value.startTime)
  if (startIndex === -1) return allTimeSlots

  return allTimeSlots.slice(startIndex + 1) // End time must be after start time
})

const bookingDuration = computed(() => {
  if (!bookingData.value.startTime || !bookingData.value.endTime) return 0

  const start = new Date(`2000-01-01T${bookingData.value.startTime}`)
  const end = new Date(`2000-01-01T${bookingData.value.endTime}`)

  return (end - start) / (1000 * 60) // Duration in minutes
})

const isFormValid = computed(() => {
  return bookingData.value.roomId &&
      bookingData.value.date &&
      bookingData.value.startTime &&
      bookingData.value.endTime &&
      bookingData.value.title &&
      bookingData.value.contactName &&
      bookingDuration.value > 0
})

const recurringPreview = computed(() => {
  if (!bookingData.value.isRecurring || !bookingData.value.date || !bookingData.value.recurrenceEndDate) {
    return []
  }

  const dates = []
  const startDate = new Date(bookingData.value.date)
  const endDate = new Date(bookingData.value.recurrenceEndDate)
  const currentDate = new Date(startDate)

  while (currentDate <= endDate) {
    dates.push(new Date(currentDate).toISOString().split('T')[0])

    switch (bookingData.value.recurrenceType) {
      case 'daily':
        currentDate.setDate(currentDate.getDate() + 1)
        break
      case 'weekly':
        currentDate.setDate(currentDate.getDate() + 7)
        break
      case 'monthly':
        currentDate.setMonth(currentDate.getMonth() + 1)
        break
    }
  }

  return dates.slice(0, 100) // Limit to 100 occurrences
})

// Methods
function resetForm() {
  bookingData.value = {
    roomId: rooms.value[0]?.id || null,
    date: today.value,
    startTime: '09:00',
    endTime: '10:00',
    title: '',
    description: '',
    contactName: userStore.userDisplayName || '',
    isRecurring: false,
    recurrenceType: 'weekly',
    recurrenceEndDate: endOfYear.value
  }
  errorMessage.value = ''
  timeConflicts.value = []
  isEdit.value = false
  editBookingId.value = null
}

function openModal(params = {}) {
  resetForm()

  if (params.roomId) bookingData.value.roomId = params.roomId
  if (params.date) bookingData.value.date = params.date
  if (params.startTime) bookingData.value.startTime = params.startTime
  if (params.endTime) bookingData.value.endTime = params.endTime

  // Edit mode
  if (params.booking) {
    isEdit.value = true
    editBookingId.value = params.booking.id
    bookingData.value = {
      roomId: params.booking.room_id || params.booking.roomId,
      date: params.booking.booking_date || params.booking.date,
      startTime: params.booking.start_time || params.booking.startTime,
      endTime: params.booking.end_time || params.booking.endTime,
      title: params.booking.title,
      description: params.booking.description || '',
      contactName: params.booking.contact_name || params.booking.contactName,
      isRecurring: params.booking.is_recurring || false,
      recurrenceType: params.booking.recurrence_type || 'weekly',
      recurrenceEndDate: params.booking.recurrence_end_date || endOfYear.value
    }
  }

  isModalOpen.value = true
}

function closeModal() {
  isModalOpen.value = false
}

function onRoomChange() {
  checkTimeConflicts()
}

function onDateChange() {
  checkTimeConflicts()
}

function onRecurringChange() {
  if (bookingData.value.isRecurring && !bookingData.value.recurrenceEndDate) {
    bookingData.value.recurrenceEndDate = endOfYear.value
  }
  checkTimeConflicts()
}

function validateTimeSelection() {
  // Ensure end time is after start time
  const startIndex = allTimeSlots.indexOf(bookingData.value.startTime)
  const endIndex = allTimeSlots.indexOf(bookingData.value.endTime)

  if (startIndex >= endIndex) {
    bookingData.value.endTime = allTimeSlots[startIndex + 1] || allTimeSlots[startIndex]
  }

  checkTimeConflicts()
}

async function checkTimeConflicts() {
  if (!bookingData.value.roomId || !bookingData.value.date) return

  timeConflicts.value = []

  const datesToCheck = bookingData.value.isRecurring ?
      recurringPreview.value.slice(0, 5) : // Check first 5 occurrences
      [bookingData.value.date]

  for (const date of datesToCheck) {
    const conflicts = bookingStore.getBookingsForRoomAndDate(bookingData.value.roomId, date)
        .filter(booking => {
          // Exclude current booking if editing
          if (isEdit.value && booking.id === editBookingId.value) return false

          // Check for time overlap
          const existingStart = booking.start_time || booking.startTime
          const existingEnd = booking.end_time || booking.endTime

          return timeOverlap(
              bookingData.value.startTime, bookingData.value.endTime,
              existingStart, existingEnd
          )
        })
        .map(booking => ({
          date,
          title: booking.title,
          time: `${booking.start_time || booking.startTime} - ${booking.end_time || booking.endTime}`
        }))

    timeConflicts.value.push(...conflicts)
  }
}

function timeOverlap(start1, end1, start2, end2) {
  return start1 < end2 && end1 > start2
}

async function submitBooking() {
  if (!isFormValid.value) return

  isSubmitting.value = true
  errorMessage.value = ''

  try {
    const bookingPayload = {
      roomId: bookingData.value.roomId,
      title: bookingData.value.title,
      description: bookingData.value.description,
      contactName: bookingData.value.contactName,
      date: bookingData.value.date,
      startTime: bookingData.value.startTime,
      endTime: bookingData.value.endTime,
      isRecurring: bookingData.value.isRecurring,
      recurrenceType: bookingData.value.isRecurring ? bookingData.value.recurrenceType : null,
      recurrenceEndDate: bookingData.value.isRecurring ? bookingData.value.recurrenceEndDate : null
    }

    if (isEdit.value) {
      await bookingStore.updateBooking(editBookingId.value, bookingPayload)
    } else {
      await bookingStore.addBooking(bookingPayload)
    }

    closeModal()

    const message = bookingData.value.isRecurring ?
        `${recurringPreview.value.length} wiederkehrende Termine erfolgreich ${isEdit.value ? 'aktualisiert' : 'erstellt'}!` :
        `Buchung erfolgreich ${isEdit.value ? 'aktualisiert' : 'erstellt'}!`

    alert(message)

  } catch (error) {
    errorMessage.value = error.message
    console.error('Booking submission error:', error)
  } finally {
    isSubmitting.value = false
  }
}

function getSubmitButtonText() {
  if (isSubmitting.value) {
    return bookingData.value.isRecurring ? 'Erstelle Termine...' : 'Wird gespeichert...'
  }

  if (isEdit.value) {
    return bookingData.value.isRecurring ? 'Serie aktualisieren' : 'Aktualisieren'
  }

  if (bookingData.value.isRecurring) {
    return `${recurringPreview.value.length} Termine erstellen`
  }

  return 'Buchen'
}

function formatDuration(minutes) {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60

  if (hours > 0 && mins > 0) {
    return `${hours}h ${mins}min`
  } else if (hours > 0) {
    return `${hours}h`
  } else {
    return `${mins}min`
  }
}

function formatPreviewDate(dateString) {
  const date = new Date(dateString + 'T00:00:00')
  return date.toLocaleDateString('de-DE', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

// Watch for data changes to check conflicts
watch(() => [bookingData.value.startTime, bookingData.value.endTime], () => {
  nextTick(() => checkTimeConflicts())
})

// Expose methods for external use
defineExpose({ openModal })

// Global event listener
if (process.client) {
  window.addEventListener('openBookingModal', (event) => {
    openModal(event.detail)
  })
}
</script>