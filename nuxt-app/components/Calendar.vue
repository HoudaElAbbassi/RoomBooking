<!-- nuxt-app/components/Calendar.vue -->
<template>
  <div class="bg-white rounded-lg shadow p-6">
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-xl font-semibold">Buchungskalender</h2>
      <div class="flex items-center gap-4">
        <!-- Debug Info -->
        <div class="text-sm text-gray-500">
          {{ bookings.length }} Buchungen geladen
        </div>

        <!-- Navigation -->
        <div class="flex gap-2">
          <button @click="previousWeek" class="btn btn-outline">
            <i class="fas fa-chevron-left mr-1"></i> Vorherige Woche
          </button>
          <button @click="nextWeek" class="btn btn-outline">
            Nächste Woche <i class="fas fa-chevron-right ml-1"></i>
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
      <div class="grid grid-cols-8 mb-2">
        <div class="px-2 py-3 text-center font-semibold text-sm text-gray-600 border-b">
          Uhrzeit
        </div>
        <div
            v-for="day in weekDays"
            :key="day.date"
            class="px-2 py-3 text-center font-semibold text-sm text-gray-600 border-b"
        >
          <div>{{ day.name }}</div>
          <div class="text-xs text-gray-500">{{ formatDisplayDate(day.date) }}</div>
        </div>
      </div>

      <!-- Time Grid -->
      <div class="grid grid-cols-8 border-l border-t">
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
            v-for="day in weekDays"
            :key="day.date"
            class="border-r last:border-r-0"
        >
          <div
              v-for="slot in timeSlots"
              :key="`${day.date}-${slot}`"
              class="h-16 px-1 py-1 border-b relative bg-gray-50 hover:bg-gray-100"
              :class="getDayCellClass(day.date, slot)"
          >
            <!-- Booking Display -->
            <div
                v-for="booking in getBookingsForSlot(day.date, slot)"
                :key="booking.id"
                class="absolute inset-1 rounded p-1 overflow-hidden text-white text-xs cursor-pointer transition-all hover:shadow-lg"
                :class="getBookingColor(getBookingRoomId(booking))"
                @click="showBookingDetails(booking)"
                :title="`${booking.title} - ${getRoomName(getBookingRoomId(booking))}`"
            >
              <div class="font-semibold truncate">{{ booking.title }}</div>
              <div class="truncate opacity-90">{{ getRoomName(getBookingRoomId(booking)) }}</div>
              <div class="truncate text-xs opacity-75 mt-1">{{ getBookingContactName(booking) }}</div>
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

    <!-- Debug Info (Development only) -->
    <div v-if="showDebug" class="mt-6 pt-4 border-t bg-gray-50 rounded p-4">
      <h4 class="font-semibold text-sm mb-2">🔍 Debug Info:</h4>
      <div class="text-xs space-y-1">
        <div><strong>Aktueller Zeitraum:</strong> {{ weekDays[0]?.date }} - {{ weekDays[6]?.date }}</div>
        <div><strong>Gefilterte Buchungen:</strong> {{ visibleBookings.length }} von {{ bookings.length }}</div>
        <div><strong>Raum-Filter:</strong> {{ filterRoomIds.length === 0 ? 'Alle' : filterRoomIds.join(', ') }}</div>
        <div><strong>Stores Status:</strong>
          Rooms: {{ roomStore.loading ? 'loading' : 'ready' }},
          Bookings: {{ bookingStore.loading ? 'loading' : 'ready' }}
        </div>
      </div>
      <button @click="showDebug = false" class="text-xs text-blue-600 mt-2">Debug ausblenden</button>
    </div>

    <!-- Show Debug Toggle -->
    <div v-else class="mt-6 text-center">
      <button @click="showDebug = true" class="text-xs text-gray-500 hover:text-gray-700">
        Debug-Info anzeigen
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRoomStore } from '../stores/roomStore'
import { useBookingStore } from '../stores/bookingStore'

// Props für Raumfilter
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
const currentWeekStart = ref(getMonday(new Date()))
const showDebug = ref(false)

// Computed properties
const rooms = computed(() => roomStore.rooms)
const bookings = computed(() => bookingStore.bookings)
const loading = computed(() => roomStore.loading || bookingStore.loading)
const error = computed(() => roomStore.error || bookingStore.error)

const timeSlots = computed(() => bookingStore.timeSlots)

// Berechne die Wochentage
const weekDays = computed(() => {
  const days = []
  const dayNames = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

  for (let i = 0; i < 7; i++) {
    const date = new Date(currentWeekStart.value)
    date.setDate(date.getDate() + i)

    const formattedDate = formatDate(date)
    const dayName = dayNames[i]

    days.push({ name: dayName, date: formattedDate })
  }

  return days
})

// Gefilterte Buchungen für die aktuelle Woche
const visibleBookings = computed(() => {
  if (!bookings.value || bookings.value.length === 0) {
    return []
  }

  const weekStart = weekDays.value[0]?.date
  const weekEnd = weekDays.value[6]?.date

  return bookings.value.filter(booking => {
    const bookingDate = getBookingDate(booking)
    const bookingRoomId = getBookingRoomId(booking)

    // Date filter
    const inDateRange = bookingDate >= weekStart && bookingDate <= weekEnd

    // Room filter (if specified)
    const roomMatch = props.filterRoomIds.length === 0 ||
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

function previousWeek() {
  const newDate = new Date(currentWeekStart.value)
  newDate.setDate(newDate.getDate() - 7)
  currentWeekStart.value = newDate
}

function nextWeek() {
  const newDate = new Date(currentWeekStart.value)
  newDate.setDate(newDate.getDate() + 7)
  currentWeekStart.value = newDate
}

// Data extraction helpers (handle both PostgreSQL and MongoDB formats)
function getBookingDate(booking) {
  return booking.date || booking.booking_date
}

function getBookingRoomId(booking) {
  return booking.room_id || booking.roomId
}

function getBookingTimeSlot(booking) {
  return booking.time_slot || booking.timeSlot
}

function getBookingContactName(booking) {
  return booking.contact_name || booking.contactName
}

// Funktion zum Abrufen der Buchungen für ein bestimmtes Zeitfenster
function getBookingsForSlot(date, timeSlot) {
  return visibleBookings.value.filter(booking => {
    const bookingDate = getBookingDate(booking)
    const bookingTimeSlot = getBookingTimeSlot(booking)

    return bookingDate === date && bookingTimeSlot === timeSlot
  })
}

// Farbcodierung für Räume
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
  const colorIndex = (roomId % Object.keys(roomColors).length) || 1
  return roomColors[colorIndex] || roomColors[1]
}

function getRoomName(roomId) {
  const room = rooms.value.find(r => r.id === roomId)
  return room ? room.name : `Raum ${roomId}`
}

function getBookingCountForRoom(roomId) {
  return visibleBookings.value.filter(booking =>
      getBookingRoomId(booking) === roomId
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
  const details = `
Buchung: ${booking.title}
Raum: ${getRoomName(getBookingRoomId(booking))}
Datum: ${getBookingDate(booking)}
Uhrzeit: ${getBookingTimeSlot(booking)}
Kontakt: ${getBookingContactName(booking)}${booking.description ? '\nBeschreibung: ' + booking.description : ''}
  `.trim()

  alert(details)
}

function createBooking(date, timeSlot) {
  // Event für das Öffnen des Buchungsmodals
  if (process.client) {
    window.dispatchEvent(new CustomEvent('openBookingModal', {
      detail: { date, timeSlot }
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

// Watch for room/booking changes and reload if needed
watch(() => [rooms.value.length, bookings.value.length], ([newRooms, newBookings], [oldRooms, oldBookings]) => {
  if (oldRooms !== undefined && oldBookings !== undefined) {
    console.log(`📊 Data changed: Rooms ${oldRooms}→${newRooms}, Bookings ${oldBookings}→${newBookings}`)
  }
})

onMounted(async () => {
  console.log('📅 Calendar mounted - loading data...')

  // Setze den Startpunkt auf die aktuelle Woche
  currentWeekStart.value = getMonday(new Date())

  // Lade Daten falls noch nicht vorhanden
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
    console.log(`✅ Calendar ready: ${rooms.value.length} rooms, ${bookings.value.length} bookings`)

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

/* Responsive adjustments */
@media (max-width: 768px) {
  .grid-cols-8 {
    min-width: 640px;
  }
}

/* Animation for bookings */
.booking-item {
  transition: all 0.2s ease-in-out;
}

.booking-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}
</style>