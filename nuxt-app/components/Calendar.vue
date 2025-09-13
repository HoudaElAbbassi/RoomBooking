<!-- nuxt-app/components/Calendar.vue - Mobile optimized version -->
<template>
  <div class="bg-white rounded-lg shadow p-4 sm:p-6">
    <!-- Calendar Header with Responsive Design -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
      <h2 class="text-xl font-semibold">Buchungskalender</h2>

      <!-- Mobile Stats & View Toggle Row -->
      <div class="flex w-full sm:w-auto justify-between sm:justify-end items-center gap-2 sm:gap-4">
        <!-- Stats Info -->
        <div class="text-sm text-gray-500 hidden sm:block">
          {{ visibleBookings.length }} Buchungen
        </div>

        <!-- View Toggle - Always Visible -->
        <div class="flex border rounded-lg overflow-hidden">
          <button
              @click="viewMode = 'day'"
              class="px-3 py-1 text-sm transition-colors"
              :class="viewMode === 'day' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'">
            Tag
          </button>
          <button
              @click="viewMode = 'week'"
              class="px-3 py-1 text-sm transition-colors"
              :class="viewMode === 'week' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'">
            Woche
          </button>
        </div>

        <!-- Date Selector (Mobile-friendly) -->
        <button
            @click="showDatePicker = !showDatePicker"
            class="btn btn-outline btn-sm flex items-center"
            aria-label="Datum auswählen">
          <i class="fas fa-calendar-alt mr-1"></i>
          <span class="hidden sm:inline">{{ formatSelectedDate() }}</span>
          <span class="sm:hidden">{{ formatMobileDate() }}</span>
        </button>
      </div>
    </div>

    <!-- Date Navigation (Responsive) -->
    <div class="flex items-center justify-between mb-4">
      <button @click="previousPeriod" class="btn btn-outline btn-sm">
        <i class="fas fa-chevron-left mr-1 sm:mr-2"></i>
        <span class="hidden sm:inline">{{ viewMode === 'week' ? 'Vorherige Woche' : 'Vorheriger Tag' }}</span>
      </button>

      <div class="text-sm sm:text-base font-medium">
        {{ formatNavigationDate() }}
      </div>

      <button @click="nextPeriod" class="btn btn-outline btn-sm">
        <span class="hidden sm:inline">{{ viewMode === 'week' ? 'Nächste Woche' : 'Nächster Tag' }}</span>
        <i class="fas fa-chevron-right ml-1 sm:ml-2"></i>
      </button>
    </div>

    <!-- Date Picker (Mobile Optimized) -->
    <div v-if="showDatePicker" class="mb-4 p-3 bg-gray-50 rounded-lg">
      <div class="flex flex-col sm:flex-row gap-3 items-center">
        <input
          type="date"
          v-model="datePickerValue"
          class="w-full sm:w-auto px-3 py-2 border rounded"
          @change="onDatePickerChange"
        />
        <div class="flex gap-2">
          <button @click="goToToday" class="btn btn-sm btn-outline">Heute</button>
          <button @click="showDatePicker = false" class="btn btn-sm btn-primary">Anwenden</button>
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

    <!-- Calendar Grid with Mobile Optimizations -->
    <div v-else>
      <!-- Mobile Day View (List View) -->
      <div v-if="viewMode === 'day' && isMobileView" class="sm:hidden">
        <div class="border rounded-lg overflow-hidden">
          <!-- Time Slots as List Items -->
          <div
            v-for="slot in timeSlots"
            :key="slot"
            class="border-b last:border-b-0 relative"
            :class="getListItemClass(displayDays[0].date, slot)"
          >
            <div class="flex items-center p-3">
              <div class="w-16 font-medium text-gray-700">{{ slot }}</div>

              <!-- Bookings for this slot -->
              <div class="flex-1">
                <div
                  v-for="booking in getBookingsForSlot(displayDays[0].date, slot)"
                  :key="booking.id"
                  class="ml-2 p-2 rounded text-white text-sm mb-1 last:mb-0 cursor-pointer"
                  :class="getBookingColor(getBookingRoomId(booking))"
                  @click="showBookingDetails(booking)"
                >
                  <div class="font-medium">{{ booking.title }}</div>
                  <div class="text-xs flex justify-between">
                    <span>{{ getRoomName(getBookingRoomId(booking)) }}</span>
                    <span>{{ formatBookingTime(booking) }}</span>
                  </div>
                </div>

                <!-- Empty slot -->
                <div
                  v-if="getBookingsForSlot(displayDays[0].date, slot).length === 0"
                  class="h-7 flex items-center ml-2 text-gray-400 text-sm"
                  @click="createBooking(displayDays[0].date, slot)"
                >
                  <i class="fas fa-plus mr-2"></i> Buchen
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Mobile Week View (Simplified) -->
      <div v-else-if="viewMode === 'week' && isMobileView" class="sm:hidden">
        <!-- Day Tabs -->
        <div class="mb-4">
          <div class="flex overflow-x-auto -mx-4 px-4 pb-2">
            <button
              v-for="(day, index) in weekDays"
              :key="day.date"
              @click="selectedDayIndex = index"
              class="min-w-[4rem] flex-shrink-0 px-4 py-2 mx-1 first:ml-0 rounded-md text-center transition-colors"
              :class="selectedDayIndex === index
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
            >
              <div class="font-medium">{{ day.name }}</div>
              <div class="text-xs" :class="selectedDayIndex === index ? 'text-white' : 'text-gray-500'">
                {{ formatDayNumber(day.date) }}
              </div>
            </button>
          </div>
        </div>

        <!-- Selected Day Content -->
        <div class="border rounded-lg overflow-hidden">
          <div class="bg-gray-50 px-4 py-2 border-b flex justify-between items-center">
            <h3 class="font-medium">{{ formatDayHeaderDate(weekDays[selectedDayIndex].date) }}</h3>
            <div class="text-xs text-gray-500">
              {{ getDayBookingCount(weekDays[selectedDayIndex].date) }} Buchungen
            </div>
          </div>

          <div v-if="getDayBookingCount(weekDays[selectedDayIndex].date) === 0"
               class="p-6 text-center text-gray-500">
            <i class="fas fa-calendar-day text-gray-300 text-3xl mb-2"></i>
            <p>Keine Buchungen für diesen Tag</p>
          </div>

          <!-- Day Schedule List -->
          <div v-else class="divide-y">
            <div
              v-for="booking in getDayBookings(weekDays[selectedDayIndex].date)"
              :key="booking.id"
              class="p-3 hover:bg-gray-50 flex items-start gap-3 cursor-pointer"
              @click="showBookingDetails(booking)"
            >
              <!-- Time Column -->
              <div class="w-16 text-sm font-medium">
                {{ getBookingStartTime(booking) }}
              </div>

              <!-- Booking Details -->
              <div class="flex-1">
                <div class="flex items-center gap-2">
                  <div
                    class="w-3 h-3 rounded-full flex-shrink-0"
                    :class="getBookingColor(getBookingRoomId(booking))"
                  ></div>
                  <div class="font-medium">{{ booking.title }}</div>
                </div>
                <div class="text-sm text-gray-600 mt-1">
                  {{ getRoomName(getBookingRoomId(booking)) }}
                </div>
                <div class="text-xs text-gray-500 mt-1">
                  {{ formatBookingTime(booking) }}
                </div>
              </div>

              <!-- Icons -->
              <div class="text-xs text-gray-400">
                <i v-if="booking.is_recurring" class="fas fa-repeat" title="Wiederkehrend"></i>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="mt-4 flex justify-center">
          <button
            @click="createBooking(weekDays[selectedDayIndex].date, '09:00')"
            class="btn btn-primary btn-sm"
          >
            <i class="fas fa-plus mr-2"></i> Buchung erstellen
          </button>
        </div>
      </div>

      <!-- Traditional Grid Calendar for Desktop & Tablet -->
      <div v-else class="calendar-container hidden sm:block">
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
                class="h-14 sm:h-16 px-2 py-1 border-b flex items-center justify-center text-xs sm:text-sm text-gray-600"
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
                class="h-14 sm:h-16 px-1 py-1 border-b relative bg-gray-50 hover:bg-gray-100"
                :class="getDayCellClass(day.date, slot)"
                @click="createBooking(day.date, slot)"
            >
              <!-- Extended Booking Display -->
              <div
                  v-for="booking in getBookingsForSlot(day.date, slot)"
                  :key="booking.id"
                  class="absolute rounded p-1 overflow-hidden text-white text-xs cursor-pointer transition-all hover:shadow-lg z-10"
                  :class="[getBookingColor(getBookingRoomId(booking)), getBookingDimensionClass(booking, slot)]"
                  :style="getBookingPositionStyle(booking, slot)"
                  @click.stop="showBookingDetails(booking)"
                  :title="getBookingTooltip(booking)"
              >
                <div class="font-semibold truncate">{{ booking.title }}</div>
                <div class="truncate opacity-90 text-xs hidden sm:block">{{ getRoomName(getBookingRoomId(booking)) }}</div>
                <div class="truncate text-xs opacity-75 hidden sm:block">{{ getBookingContactName(booking) }}</div>
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
                <i class="fas fa-plus text-xs opacity-0 hover:opacity-50 transition-opacity"></i>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Room Legend (Collapsible on Mobile) -->
    <div class="mt-4 pt-4 border-t">
      <button
        @click="showLegend = !showLegend"
        class="flex items-center justify-between w-full text-left text-sm font-semibold mb-2"
      >
        <span>Räume-Legende:</span>
        <i class="fas" :class="showLegend ? 'fa-chevron-up' : 'fa-chevron-down'"></i>
      </button>

      <div v-if="showLegend" class="flex flex-wrap gap-3">
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

    <!-- Booking Type Legend (Collapsible on Mobile) -->
    <div class="mt-3 pt-3 border-t">
      <button
        @click="showTypes = !showTypes"
        class="flex items-center justify-between w-full text-left text-sm font-semibold mb-2"
      >
        <span>Buchungstypen:</span>
        <i class="fas" :class="showTypes ? 'fa-chevron-up' : 'fa-chevron-down'"></i>
      </button>

      <div v-if="showTypes" class="flex flex-wrap gap-4 text-sm">
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
const viewMode = ref('day') // Default to 'day' view for mobile
const showDatePicker = ref(false)
const datePickerValue = ref(formatDate(new Date()))
const showLegend = ref(false) // Collapsed by default on mobile
const showTypes = ref(false) // Collapsed by default on mobile
const isMobileView = ref(false) // Track if we're in mobile view
const selectedDayIndex = ref(0) // For mobile week view tabs

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
  // Use a smaller grid for mobile week view
  if (viewMode.value === 'week') {
    // On mobile, show only 3 columns (time + 2 days) by default
    return isMobileView.value ? 'grid-cols-3' : 'grid-cols-8'
  }
  return 'grid-cols-2' // Day view (time + 1 day)
})

// Get week days for mobile tab view
const weekDays = computed(() => {
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

  // For mobile, only show current day + next day in week view
  const daysToShow = isMobileView.value ? 2 : 7

  for (let i = 0; i < daysToShow; i++) {
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

  const startDate = weekDays.value[0]?.date
  const endDate = weekDays.value[weekDays.value.length - 1]?.date

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

// Mobile-specific methods
function formatSelectedDate() {
  const options = { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' }
  return new Date(currentDate.value).toLocaleDateString('de-DE', options)
}

function formatMobileDate() {
  const options = { day: '2-digit', month: '2-digit' }
  return new Date(currentDate.value).toLocaleDateString('de-DE', options)
}

function formatNavigationDate() {
  if (viewMode.value === 'day') {
    return formatSelectedDate()
  } else {
    // For week view
    const startDate = weekDays.value[0]?.date
    const endDate = weekDays.value[weekDays.value.length - 1]?.date
    if (!startDate || !endDate) return ''

    const [startYear, startMonth, startDay] = startDate.split('-')
    const [endYear, endMonth, endDay] = endDate.split('-')

    // Simplified display for mobile
    if (isMobileView.value) {
      return `${startDay}.${startMonth} - ${endDay}.${endMonth}`
    }

    return `${startDay}.${startMonth}.${startYear} - ${endDay}.${endMonth}.${endYear}`
  }
}

function formatDayNumber(dateString) {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-')
  return day
}

function formatDayHeaderDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString)
  return date.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })
}

function getDayBookingCount(date) {
  return visibleBookings.value.filter(booking => getBookingDate(booking) === date).length
}

function getDayBookings(date) {
  return visibleBookings.value
    .filter(booking => getBookingDate(booking) === date)
    .sort((a, b) => {
      const aTime = getBookingStartTime(a);
      const bTime = getBookingStartTime(b);
      return aTime.localeCompare(bTime);
    });
}

function onDatePickerChange() {
  currentDate.value = new Date(datePickerValue.value)
  showDatePicker.value = false
  // Reset selected day index when date changes
  selectedDayIndex.value = 0
}

function goToToday() {
  currentDate.value = new Date()
  datePickerValue.value = formatDate(currentDate.value)
  showDatePicker.value = false
  // Reset selected day index
  selectedDayIndex.value = 0
}

function getListItemClass(date, timeSlot) {
  const isToday = date === new Date().toISOString().split('T')[0]
  const currentTime = new Date().toTimeString().slice(0, 5)
  const isPast = isToday && timeSlot < currentTime

  return {
    'bg-blue-50': isToday && !isPast,
    'bg-gray-100': isPast
  }
}

// Detect mobile view
function checkMobileView() {
  if (process.client) {
    isMobileView.value = window.innerWidth < 640
    // Switch to day view automatically on small screens
    if (isMobileView.value && viewMode.value === 'week') {
      // Keep week view but use tab interface
      selectedDayIndex.value = 0
    }
  }
}

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
  datePickerValue.value = formatDate(newDate)
  // Reset selected day index
  selectedDayIndex.value = 0
}

function nextPeriod() {
  const newDate = new Date(currentDate.value)
  if (viewMode.value === 'week') {
    newDate.setDate(newDate.getDate() + 7)
  } else {
    newDate.setDate(newDate.getDate() + 1)
  }
  currentDate.value = newDate
  datePickerValue.value = formatDate(newDate)
  // Reset selected day index
  selectedDayIndex.value = 0
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
  // Wenn ein Benutzer zur Wochenansicht wechselt
  if (viewMode.value === 'week') {
    // Reset selected day index
    selectedDayIndex.value = 0
  }
})

// Watch for selected day index changes
watch(() => selectedDayIndex.value, (newIndex) => {
  if (viewMode.value === 'week' && isMobileView.value) {
    console.log(`Ausgewählter Tag in der Woche: ${weekDays.value[newIndex].name}, ${weekDays.value[newIndex].date}`)
  }
})

onMounted(async () => {
  console.log('📅 Mobile-optimized Calendar mounted - loading data...')

  try {
    // Check if we're on mobile
    checkMobileView()

    // Add resize listener for responsive behavior
    if (process.client) {
      window.addEventListener('resize', checkMobileView)
    }

    if (rooms.value.length === 0) {
      console.log('🏠 Loading rooms...')
      await roomStore.fetchRooms()
    }

    if (bookings.value.length === 0) {
      console.log('📅 Loading bookings...')
      await bookingStore.fetchBookings()
    }

    await nextTick()
    console.log(`✅ Mobile-optimized Calendar ready: ${rooms.value.length} rooms, ${bookings.value.length} bookings`)

  } catch (error) {
    console.error('❌ Error loading calendar data:', error)
  }
})

// Clean up event listeners
onUnmounted(() => {
  if (process.client) {
    window.removeEventListener('resize', checkMobileView)
  }
})
</script>

<style scoped>
.calendar-container {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch; /* Smooth scrolling on iOS */
  scroll-behavior: smooth;
  max-width: 100%;
}

.btn {
  @apply px-3 py-1.5 rounded transition-colors;
}

.btn-sm {
  @apply px-2 py-1 text-sm;
}

.btn-primary {
  @apply bg-blue-500 text-white hover:bg-blue-600;
}

.btn-outline {
  @apply border border-blue-500 text-blue-500 hover:bg-blue-50;
}

/* Enhanced responsive adjustments */
@media (max-width: 639px) {
  .grid-cols-3 {
    min-width: 480px;
  }
  .grid-cols-2 {
    min-width: 320px;
  }
}

/* For wider mobile screens */
@media (min-width: 480px) and (max-width: 639px) {
  .grid-cols-3 {
    grid-template-columns: auto repeat(2, minmax(150px, 1fr));
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

/* Touch-friendly targets for mobile */
@media (max-width: 639px) {
  .booking-item {
    min-height: 32px;
  }

  .btn {
    min-height: 36px;
    min-width: 36px;
  }
}
</style>