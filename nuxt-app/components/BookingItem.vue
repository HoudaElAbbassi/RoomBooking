<!-- nuxt-app/components/BookingItem.vue - Enhanced with Admin Controls -->
<template>
  <div
      class="border rounded-md p-4 mb-2 hover:shadow-md transition-shadow"
      :class="{'border-l-4': true, [borderColorClass]: true}"
  >
    <div class="flex justify-between items-start">
      <div class="flex-1">
        <div class="flex items-center justify-between mb-2">
          <h3 class="font-medium text-lg">{{ booking.title }}</h3>

          <!-- Status Badge -->
          <span class="px-2 py-1 text-xs rounded-full"
                :class="getBookingStatusClass()">
            {{ getBookingStatus() }}
          </span>
        </div>

        <div class="text-sm text-gray-600 mb-2 space-y-1">
          <div><i class="fas fa-map-marker-alt mr-1"></i> {{ roomName }}</div>
          <div><i class="fas fa-calendar mr-1"></i> {{ formattedDate }}</div>
          <div><i class="fas fa-clock mr-1"></i> {{ formattedTime }}</div>
          <div><i class="fas fa-user mr-1"></i> {{ booking.contact_name || booking.contactName }}</div>
        </div>

        <div v-if="booking.description" class="text-sm mt-2 text-gray-700">
          {{ booking.description }}
        </div>

        <!-- Recurring Info -->
        <div v-if="booking.is_recurring" class="mt-2 flex items-center text-sm text-purple-600">
          <i class="fas fa-repeat mr-1"></i>
          Wiederkehrend ({{ getRecurrenceText() }})
        </div>
      </div>

      <!-- Admin Controls -->
      <div v-if="userStore.isAdmin || canEdit" class="flex items-center space-x-2 ml-4">
        <!-- Edit Button -->
        <button
            @click="editBooking"
            class="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded transition-colors"
            title="Buchung bearbeiten"
            :disabled="isLoading"
        >
          <i class="fas fa-edit"></i>
        </button>

        <!-- Delete Button -->
        <button
            @click="deleteBookingConfirm"
            class="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded transition-colors"
            title="Buchung löschen"
            :disabled="isLoading"
        >
          <i v-if="isDeleting" class="fas fa-spinner fa-spin"></i>
          <i v-else class="fas fa-trash"></i>
        </button>
      </div>

      <!-- User Action (only for own bookings) -->
      <div v-else-if="isOwnBooking && canCancel" class="ml-4">
        <button
            @click="cancelBooking"
            class="text-orange-600 hover:text-orange-800 text-sm px-3 py-1 border border-orange-300 rounded hover:bg-orange-50 transition-colors"
            :disabled="isLoading"
        >
          <i v-if="isLoading" class="fas fa-spinner fa-spin mr-1"></i>
          <i v-else class="fas fa-times mr-1"></i>
          Stornieren
        </button>
      </div>
    </div>

    <!-- Loading Overlay -->
    <div v-if="isLoading" class="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded">
      <div class="text-center">
        <i class="fas fa-spinner fa-spin text-blue-500 text-xl mb-2"></i>
        <p class="text-sm text-gray-600">{{ loadingMessage }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, inject } from 'vue'
import { useRoomStore } from '~/stores/roomStore'
import { useBookingStore } from '~/stores/bookingStore'
import { useUserStore } from '~/stores/userStore'

const props = defineProps({
  booking: {
    type: Object,
    required: true
  },
  showAdminControls: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['booking-updated', 'booking-deleted'])

// Stores
const roomStore = useRoomStore()
const bookingStore = useBookingStore()
const userStore = useUserStore()

// Toast injection
const toast = inject('toast')

// State
const isLoading = ref(false)
const isDeleting = ref(false)
const loadingMessage = ref('')

// Computed properties
const roomName = computed(() => {
  const room = roomStore.rooms.find(r => r.id === getBookingRoomId())
  return room ? room.name : 'Unbekannter Raum'
})

const formattedDate = computed(() => {
  const date = props.booking.date || props.booking.booking_date
  if (!date) return 'Unbekanntes Datum'

  const [year, month, day] = date.split('-')
  return `${day}.${month}.${year}`
})

const formattedTime = computed(() => {
  const startTime = props.booking.start_time || props.booking.timeSlot || props.booking.time_slot
  const endTime = props.booking.end_time || props.booking.endTime

  if (endTime && endTime !== startTime) {
    return `${startTime} - ${endTime}`
  }
  return `${startTime} Uhr`
})

const borderColorClass = computed(() => {
  const colors = {
    1: 'border-blue-500',
    2: 'border-green-500',
    3: 'border-purple-500',
    4: 'border-orange-500',
    5: 'border-red-500',
    6: 'border-yellow-500',
    7: 'border-indigo-500',
    8: 'border-pink-500',
    9: 'border-cyan-500',
    10: 'border-emerald-500'
  }
  const roomId = getBookingRoomId()
  const colorIndex = (roomId % Object.keys(colors).length) || 1
  return colors[colorIndex] || colors[1]
})

const isOwnBooking = computed(() => {
  if (!userStore.user) return false

  const contactName = props.booking.contact_name || props.booking.contactName
  return contactName === userStore.user.username ||
      props.booking.user_id === userStore.user.id
})

const canEdit = computed(() => {
  return userStore.isAdmin || isOwnBooking.value
})

const canCancel = computed(() => {
  const date = props.booking.date || props.booking.booking_date
  const timeSlot = props.booking.start_time || props.booking.timeSlot || props.booking.time_slot

  if (!date || !timeSlot) return false

  const bookingDateTime = new Date(`${date}T${timeSlot}:00`)
  const now = new Date()

  return bookingDateTime > now
})

// Methods
function getBookingRoomId() {
  return props.booking.room_id || props.booking.roomId
}

function getBookingStatus() {
  const date = props.booking.date || props.booking.booking_date
  const timeSlot = props.booking.start_time || props.booking.timeSlot || props.booking.time_slot

  if (!date || !timeSlot) return 'Unbekannt'

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

function getBookingStatusClass() {
  const status = getBookingStatus()

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

function getRecurrenceText() {
  const type = props.booking.recurrence_type
  switch (type) {
    case 'daily': return 'täglich'
    case 'weekly': return 'wöchentlich'
    case 'monthly': return 'monatlich'
    default: return type || 'unbekannt'
  }
}

function editBooking() {
  if (isLoading.value) return

  // Dispatch event to open booking modal
  if (process.client) {
    window.dispatchEvent(new CustomEvent('openBookingModal', {
      detail: { booking: props.booking }
    }))
  }
}

async function deleteBookingConfirm() {
  if (isLoading.value) return

  const isRecurring = props.booking.is_recurring
  let message = `Möchten Sie die Buchung "${props.booking.title}" wirklich löschen?`

  if (isRecurring) {
    message += '\n\nDiese Buchung ist wiederkehrend. Sollen alle Termine der Serie gelöscht werden?'
  }

  const deleteRecurring = isRecurring ? confirm(message + '\n\nJa = Alle löschen, Nein = Nur diesen Termin löschen, Abbrechen = Nichts löschen') : null

  if (deleteRecurring === null && isRecurring) {
    // User cancelled
    return
  }

  if (!isRecurring && !confirm(message)) {
    return
  }

  await deleteBooking(deleteRecurring)
}

async function deleteBooking(deleteRecurring = false) {
  isDeleting.value = true
  isLoading.value = true
  loadingMessage.value = 'Buchung wird gelöscht...'

  try {
    await bookingStore.deleteBooking(props.booking.id, deleteRecurring)

    // Success feedback
    if (toast) {
      toast.success(
          deleteRecurring ?
              'Buchungsserie erfolgreich gelöscht!' :
              'Buchung erfolgreich gelöscht!',
          {
            title: 'Gelöscht',
            duration: 4000
          }
      )
    }

    emit('booking-deleted', props.booking.id)

  } catch (error) {
    console.error('Delete booking error:', error)

    if (toast) {
      toast.error(`Fehler beim Löschen: ${error.message}`, {
        title: 'Fehler',
        duration: 5000
      })
    } else {
      alert(`Fehler beim Löschen: ${error.message}`)
    }
  } finally {
    isDeleting.value = false
    isLoading.value = false
    loadingMessage.value = ''
  }
}

async function cancelBooking() {
  if (!canCancel.value || isLoading.value) return

  if (!confirm(`Möchten Sie Ihre Buchung "${props.booking.title}" wirklich stornieren?`)) {
    return
  }

  isLoading.value = true
  loadingMessage.value = 'Buchung wird storniert...'

  try {
    await bookingStore.deleteBooking(props.booking.id, false)

    if (toast) {
      toast.success('Buchung erfolgreich storniert!', {
        title: 'Storniert',
        duration: 4000
      })
    }

    emit('booking-deleted', props.booking.id)

  } catch (error) {
    console.error('Cancel booking error:', error)

    if (toast) {
      toast.error(`Fehler beim Stornieren: ${error.message}`, {
        title: 'Fehler',
        duration: 5000
      })
    } else {
      alert(`Fehler beim Stornieren: ${error.message}`)
    }
  } finally {
    isLoading.value = false
    loadingMessage.value = ''
  }
}
</script>

<style scoped>
.transition-shadow {
  transition: box-shadow 0.15s ease-in-out;
}

.transition-colors {
  transition: color 0.15s ease-in-out, background-color 0.15s ease-in-out;
}
</style>