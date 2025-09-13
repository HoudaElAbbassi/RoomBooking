<!-- nuxt-app/components/Calendar.vue - Extended version with time ranges -->
<template>
  <div class="bg-white rounded-lg shadow p-6">
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-xl font-semibold">Buchungskalender</h2>
      <div class="flex items-center gap-4">
        <!-- Stats Info -->
        <div class="text-sm text-gray-500">
          {{ visibleBookings.length }} Buchungen sichtbar
        </div>

        <!-- View Toggle -->
        <div class="flex border rounded-lg overflow-hidden">
          <button
              @click="viewMode = 'week'"
              class="px-3 py-1 text-sm transition-colors"
              :class="viewMode === 'week' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'">
            Woche
          </button>
          <button
              @click="viewMode = 'day'"
              class="px-3 py-1 text-sm transition-colors"
              :class="viewMode === 'day' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'">
            Tag
          </button>
        </div>

        <!-- Navigation -->
        <div class="flex gap-2">
          <button @click="previousPeriod" class="btn btn-outline">
            <i class="fas fa-chevron-left mr-1"></i>
            {{ viewMode === 'week' ? 'Vorherige Woche' : 'Vorheriger Tag' }}
          </button>
          <button @click="nextPeriod" class="btn btn-outline">
            {{ viewMode === 'week' ? 'Nächste Woche' : 'Nächster Tag' }}
            <i class="fas fa-chevron-right ml-1"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-8">
      <i class="fas fa-spinner fa-spin text-blue-500 text-2xl mb-2"></i>
      <p class="text-gray-600">Lade Buchungen...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center py-8">
      <i class="fas fa-exclamation-triangle text-red-500 text-2xl mb-2"></i>
      <p class="text-red-600 mb-4">{{ error }}</p>
      <button @click="reloadData" class="btn btn-primary">
        <i class="fas fa-refresh mr-2"></i>
        Erneut laden
      </button>
    </div>

    <!-- Calendar Grid -->
    <div v-else class="calendar-container">
      <!-- Header Row -->
      <div class="grid mb-2" :class="gridColsClass">
        <div class="px-2 py-3 text-center font-semibold text-sm text-gray-600 border-b">
          Uhrzeit
        </div>
        <div
            v-for="day in displayDays"
            :key="day.date"
            class="px-2 py-3 text-center font-semibold text-sm text-gray-600 border-b"
        >
          <div>{{ day.name }}</div>
          <div class="text-xs text-gray-500">{{ formatDisplayDate(day.date) }}</div>
        </div>
      </div>

      <!-- Time Grid -->
      <div class="grid border-l border-t" :class="gridColsClass">
        <!-- Time Column -->
        <div class="border-r">
          <div
              v-for="slot in timeSlots"
              :key="slot"
              class="h-16 px-2 py-1 border-b flex items-center justify-center text-sm text-gray-600"
          >
            {{ slot }}
          </div>
        </div>

        <!-- Day Columns -->
        <div
            v-for="day in displayDays"
            :key="day.date"
            class="border-r last:border-r-0"
        >
          <div
              v-for="slot in timeSlots"
              :key="`${day.date}-${slot}`"
              class="h-16 px-1 py-1 border-b relative bg-gray-50 hover:bg-gray-100"
              :class="getDayCellClass(day.date, slot)"
          >
            <!-- Extended Booking Display -->
            <div
                v-for="booking in getBookingsForSlot(day.date, slot)"
                :key="booking.id"
                class="absolute rounded p-1 overflow-hidden text-white text-xs cursor-pointer transition-all hover:shadow-lg z-10"
                :class="[getBookingColor(getBookingRoomId(booking)), getBookingDimensionClass(booking, slot)]"
                :style="getBookingPositionStyle(booking, slot)"
                @click="showBookingDetails(booking)"
                :title="getBookingTooltip(booking)"
            >
              <div class="font-semibold truncate">{{ booking.title }}</div>
              <div class="truncate opacity-90 text-xs">{{ getRoomName(getBookingRoomId(booking)) }}</div>
              <div class="truncate text-xs opacity-75">{{ getBookingContactName(booking) }}</div>
              <div v-if="booking.is_recurring" class="absolute top-0 right-0 text-xs">
                <i class="fas fa-repeat" title="Wiederkehrend"></i>
              </div>
              <!-- Duration indicator for multi-slot bookings -->
              <div v-if="getBookingDurationSlots(booking) > 1" class="text-xs opacity-90 mt-1">
                {{ formatBookingTime(booking) }}
              </div>
            </div>

            <!-- Empty Slot Indicator -->
            <div v-if="getBookingsForSlot(day.date, slot).length === 0"
                 class="absolute inset-0 flex items-center justify-center text-gray-400">
              <i class="fas fa-plus text-xs opacity-0 hover:opacity-50 transition-opacity"
                 @click="createBooking(day.date, slot)"></i>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Room Legend -->
    <div class="mt-6 pt-4 border-t">
      <h3 class="text-sm font-semibold mb-3">Räume-Legende:</h3>
      <div class="flex flex-wrap gap-3">
        <div
            v-for="room in rooms"
            :key="room.id"
            class="flex items-center"
        >
          <div
              class="w-4 h-4 rounded mr-2"
              :class="getBookingColor(room.id)"
          ></div>
          <span class="text-sm">{{ room.name }}</span>
          <span class="text-xs text-gray-500 ml-1">({{ getBookingCountForRoom(room.id) }})</span>
        </div>
      </div>
    </div>

    <!-- Booking Type Legend -->
    <div class="mt-4 pt-4 border-t">
      <h3 class="text-sm font-semibold mb-3">Buchungstypen:</h3>
      <div class="flex flex-wrap gap-4 text-sm">
        <div class="flex items-center">
          <i class="fas fa-calendar text-blue-500 mr-2"></i>
          <span>Einzeltermin</span>
        </div>
        <div class="flex items-center">
          <i class="fas fa-repeat text-purple-500 mr-2"></i>
          <span>Wiederkehrend</span>
        </div>
        <div class="flex items-center">
          <i class="fas fa-clock text-green-500 mr-2"></i>
          <span>Zeitbereich</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRoomStore } from '../stores/roomStore'
import { useBookingStore } from '../stores/bookingStore'

// Props
const props = defineProps({
  filterRoomIds: {
    type: Array,
    default: () => []
  }
})

// Store-Instanzen
const roomStore = useRoomStore()
const bookingStore = useBookingStore()

// Reactive data
const currentDate = ref(new Date())
const viewMode = ref('week') // 'week' or 'day'

// Computed properties
const rooms = computed(() => roomStore.rooms)
const bookings = computed(() => bookingStore.bookings)
const loading = computed(() => roomStore.loading || bookingStore.loading)
const error = computed(() => roomStore.error || bookingStore.error)

// Enhanced time slots (30-minute intervals)
const timeSlots = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
  '20:00', '20:30', '21:00', '21:30', '22:00'
]

const gridColsClass = computed(() => {
  return viewMode.value === 'week' ? 'grid-cols-8' : 'grid-cols-2'
})

// Calculate display days based on view mode
const displayDays = computed(() => {
  if (viewMode.value === 'day') {
    const date = new Date(currentDate.value)
    const dayNames = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']
    return [{
      name: dayNames[date.getDay()],
      date: formatDate(date)
    }]
  }

  // Week view
  const days = []
  const dayNames = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
  const monday = getMonday(new Date(currentDate.value))

  for (let i = 0; i < 7; i++) {
    const date = new Date(monday)
    date.setDate(date.getDate() + i)

    days.push({
      name: dayNames[i],
      date: formatDate(date)
    })
  }

  return days
})

// Gefilterte Buchungen für die aktuelle Ansicht
const visibleBookings = computed(() => {
  if (!bookings.value || bookings.value.length === 0) {
    return []
  }

  const startDate = displayDays.value[0]?.date
  const endDate = displayDays.value[displayDays.value.length - 1]?.date

  return bookings.value.filter(booking => {
    const bookingDate = getBookingDate(booking)
    const bookingRoomId = getBookingRoomId(booking)

    // Date filter
    const inDateRange = bookingDate >= startDate && bookingDate <= endDate

    // Room filter (if specified)
    const roomMatch = props.filterRoomIds.length === 0 ||
        props.filterRoomIds.includes(parseInt(bookingRoomId)) ||
        props.filterRoomIds.includes(bookingRoomId)

    return inDateRange && roomMatch
  })
})

// Helper functions
function getMonday(date) {
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1)
  return new Date(date.setDate(diff))
}

function formatDate(date) {
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${year}-${month}-${day}`
}

function formatDisplayDate(dateString) {
  const [year, month, day] = dateString.split('-')
  return `${day}.${month}.`
}

function previousPeriod() {
  const newDate = new Date(currentDate.value)
  if (viewMode.value === 'week') {
    newDate.setDate(newDate.getDate() - 7)
  } else {
    newDate.setDate(newDate.getDate() - 1)
  }
  currentDate.value = newDate
}

function nextPeriod() {
  const newDate = new Date(currentDate.value)
  if (viewMode.value === 'week') {
    newDate.setDate(newDate.getDate() + 7)
  } else {
    newDate.setDate(newDate.getDate() + 1)
  }
  currentDate.value = newDate
}

// Enhanced data extraction helpers
function getBookingDate(booking) {
  const date = booking.booking_date || booking.date
  if (date instanceof Date) {
    return date.toISOString().split('T')[0]
  }
  return date
}

function getBookingRoomId(booking) {
  return booking.room_id || booking.roomId
}

function getBookingStartTime(booking) {
  let startTime = booking.start_time || booking.timeSlot || booking.time_slot
  return formatTimeSlot(startTime)
}

function getBookingEndTime(booking) {
  let endTime = booking.end_time || booking.endTime
  if (!endTime && booking.timeSlot) {
    // Fallback: add 1 hour to start time
    endTime = addHourToTime(booking.timeSlot)
  } else if (!endTime && booking.time_slot) {
    endTime = addHourToTime(booking.time_slot)
  }
  return formatTimeSlot(endTime)
}

function getBookingContactName(booking) {
  return booking.contact_name || booking.contactName
}

function formatTimeSlot(timeValue) {
  if (!timeValue) return null

  if (typeof timeValue === 'string' && timeValue.match(/^\d{2}:\d{2}$/)) {
    return timeValue
  }

  if (typeof timeValue === 'object' && timeValue !== null) {
    const hours = String(timeValue.hours || timeValue.hour || 0).padStart(2, '0')
    const minutes = String(timeValue.minutes || timeValue.minute || 0).padStart(2, '0')
    return `${hours}:${minutes}`
  }

  if (typeof timeValue === 'string') {
    const match = timeValue.match(/(\d{1,2}):?(\d{2})?/)
    if (match) {
      const hours = String(match[1]).padStart(2, '0')
      const minutes = String(match[2] || '00').padStart(2, '0')
      return `${hours}:${minutes}`
    }
  }

  return String(timeValue)
}

function addHourToTime(timeString) {
  const [hours, minutes] = timeString.split(':').map(Number)
  const newHours = (hours + 1) % 24
  return `${String(newHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

// Enhanced booking display functions
function getBookingsForSlot(date, timeSlot) {
  return visibleBookings.value.filter(booking => {
    const bookingDate = getBookingDate(booking)
    const startTime = getBookingStartTime(booking)
    const endTime = getBookingEndTime(booking)

    // Check if this time slot is within the booking's time range
    return bookingDate === date && timeSlot >= startTime && timeSlot < endTime
  })
}

function getBookingDurationSlots(booking) {
  const startTime = getBookingStartTime(booking)
  const endTime = getBookingEndTime(booking)

  const startIndex = timeSlots.indexOf(startTime)
  const endIndex = timeSlots.indexOf(endTime)

  if (startIndex === -1 || endIndex === -1) return 1

  return Math.max(1, endIndex - startIndex)
}

function getBookingDimensionClass(booking, currentSlot) {
  const startTime = getBookingStartTime(booking)
  const durationSlots = getBookingDurationSlots(booking)

  // Only show full height for the first slot of multi-slot bookings
  const isFirstSlot = currentSlot === startTime
  const height = isFirstSlot ? `h-${Math.min(durationSlots * 16, 64)}` : 'h-16'

  return `${height} min-h-16`
}

function getBookingPositionStyle(booking, currentSlot) {
  const startTime = getBookingStartTime(booking)
  const endTime = getBookingEndTime(booking)
  const durationSlots = getBookingDurationSlots(booking)

  // Calculate position for multi-slot bookings
  if (currentSlot === startTime && durationSlots > 1) {
    const height = Math.min(durationSlots * 64, 256) // Max 4 slots high
    return {
      height: `${height}px`,
      zIndex: 20
    }
  }

  // Hide duplicate instances for multi-slot bookings
  if (currentSlot > startTime && currentSlot < endTime) {
    return {
      display: 'none'
    }
  }

  return {}
}

function formatBookingTime(booking) {
  const startTime = getBookingStartTime(booking)
  const endTime = getBookingEndTime(booking)
  return `${startTime} - ${endTime}`
}

function getBookingTooltip(booking) {
  const startTime = getBookingStartTime(booking)
  const endTime = getBookingEndTime(booking)
  const roomName = getRoomName(getBookingRoomId(booking))

  let tooltip = `${booking.title}\n${roomName}\n${startTime} - ${endTime}\nKontakt: ${getBookingContactName(booking)}`

  if (booking.description) {
    tooltip += `\n\n${booking.description}`
  }

  if (booking.is_recurring) {
    tooltip += `\n\n🔄 Wiederkehrend (${booking.recurrence_type})`
  }

  return tooltip
}

// Color and styling functions
const roomColors = {
  1: 'bg-blue-600',
  2: 'bg-green-600',
  3: 'bg-purple-600',
  4: 'bg-orange-600',
  5: 'bg-red-600',
  6: 'bg-yellow-600',
  7: 'bg-indigo-600',
  8: 'bg-pink-600',
  9: 'bg-cyan-600',
  10: 'bg-emerald-600'
}

function getBookingColor(roomId) {
  const colorIndex = (parseInt(roomId) % Object.keys(roomColors).length) || 1
  return roomColors[colorIndex] || roomColors[1]
}

function getRoomName(roomId) {
  const room = rooms.value.find(r => r.id === parseInt(roomId))
  return room ? room.name : `Raum ${roomId}`
}

function getBookingCountForRoom(roomId) {
  return visibleBookings.value.filter(booking =>
      parseInt(getBookingRoomId(booking)) === parseInt(roomId)
  ).length
}

function getDayCellClass(date, timeSlot) {
  const isToday = date === new Date().toISOString().split('T')[0]
  const currentTime = new Date().toTimeString().slice(0, 5)
  const isPast = isToday && timeSlot < currentTime

  return {
    'bg-blue-50': isToday && !isPast,
    'bg-gray-200': isPast,
    'cursor-pointer': !isPast
  }
}

function showBookingDetails(booking) {
  const startTime = getBookingStartTime(booking)
  const endTime = getBookingEndTime(booking)

  const details = `
Buchung: ${booking.title}
Raum: ${getRoomName(getBookingRoomId(booking))}
Datum: ${getBookingDate(booking)}
Zeit: ${startTime} - ${endTime}
Kontakt: ${getBookingContactName(booking)}
${booking.description ? '\nBeschreibung: ' + booking.description : ''}
${booking.is_recurring ? '\n🔄 Wiederkehrende Buchung (' + booking.recurrence_type + ')' : ''}
${booking.duration_hours ? '\nDauer: ' + booking.duration_hours + 'h' : ''}
  `.trim()

  alert(details)
}

function createBooking(date, timeSlot) {
  // Event für das Öffnen des Buchungsmodals mit verbesserter Zeit-Logik
  if (process.client) {
    const endTimeIndex = timeSlots.indexOf(timeSlot) + 2 // Default: 1 Stunde
    const endTime = timeSlots[endTimeIndex] || timeSlots[timeSlots.length - 1]

    window.dispatchEvent(new CustomEvent('openBookingModal', {
      detail: {
        date,
        startTime: timeSlot,
        endTime: endTime
      }
    }))
  }
}

async function reloadData() {
  try {
    await Promise.all([
      roomStore.fetchRooms(),
      bookingStore.fetchBookings()
    ])
  } catch (error) {
    console.error('Fehler beim Neuladen der Daten:', error)
  }
}

// Watchers and lifecycle
watch(() => [rooms.value.length, bookings.value.length], ([newRooms, newBookings], [oldRooms, oldBookings]) => {
  if (oldRooms !== undefined && oldBookings !== undefined) {
    console.log(`📊 Data changed: Rooms ${oldRooms}→${newRooms}, Bookings ${oldBookings}→${newBookings}`)
  }
})

watch(() => viewMode.value, () => {
  // Reset to current week/day when switching view modes
  currentDate.value = new Date()
})

onMounted(async () => {
  console.log('📅 Extended Calendar mounted - loading data...')

  try {
    if (rooms.value.length === 0) {
      console.log('🏠 Loading rooms...')
      await roomStore.fetchRooms()
    }

    if (bookings.value.length === 0) {
      console.log('📅 Loading bookings...')
      await bookingStore.fetchBookings()
    }

    await nextTick()
    console.log(`✅ Extended Calendar ready: ${rooms.value.length} rooms, ${bookings.value.length} bookings`)

  } catch (error) {
    console.error('❌ Error loading calendar data:', error)
  }
})
</script>

<style scoped>
.calendar-container {
  overflow-x: auto;
}

.btn {
  @apply px-4 py-2 rounded transition-colors;
}

.btn-primary {
  @apply bg-blue-500 text-white hover:bg-blue-600;
}

.btn-outline {
  @apply border border-blue-500 text-blue-500 hover:bg-blue-50;
}

/* Enhanced responsive adjustments */
@media (max-width: 768px) {
  .grid-cols-8 {
    min-width: 640px;
  }
  .grid-cols-2 {
    min-width: 320px;
  }
}

/* Enhanced booking animations */
.booking-item {
  transition: all 0.2s ease-in-out;
}

.booking-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Multi-slot booking styling */
.booking-multi-slot {
  background: linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(0,0,0,0.1) 100%);
  border-left: 3px solid rgba(255,255,255,0.3);
}

/* Recurring booking indicator */
.booking-recurring::after {
  content: '🔄';
  position: absolute;
  top: 2px;
  right: 2px;
  font-size: 10px;
  opacity: 0.8;
}
</style>