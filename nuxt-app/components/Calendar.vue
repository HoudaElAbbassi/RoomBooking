<template>
  <div class="bg-white rounded-lg shadow p-6">
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-xl font-semibold">Buchungskalender</h2>
      <div class="flex gap-2">
        <button @click="previousWeek" class="btn btn-outline">
          <i class="fas fa-chevron-left mr-1"></i> Vorherige Woche
        </button>
        <button @click="nextWeek" class="btn btn-outline">
          Nächste Woche <i class="fas fa-chevron-right ml-1"></i>
        </button>
      </div>
    </div>

    <!-- Wochentage-Header -->
    <div class="grid grid-cols-8 mb-2">
      <div class="px-2 py-3 text-center font-semibold text-sm text-gray-600 border-b">
        Uhrzeit
      </div>
      <div
          v-for="day in weekDays"
          :key="day.date"
          class="px-2 py-3 text-center font-semibold text-sm text-gray-600 border-b"
      >
        {{ day.name }}<br>
        {{ day.date }}
      </div>
    </div>

    <!-- Zeitslots und Buchungen -->
    <div class="grid grid-cols-8">
      <!-- Zeitslots-Spalte -->
      <div class="border-r">
        <div
            v-for="slot in timeSlots"
            :key="slot"
            class="h-16 px-2 py-1 border-b flex items-center justify-center text-sm text-gray-600"
        >
          {{ slot }}
        </div>
      </div>

      <!-- Tage-Spalten -->
      <div
          v-for="day in weekDays"
          :key="day.date"
          class="border-r last:border-r-0"
      >
        <div
            v-for="slot in timeSlots"
            :key="`${day.date}-${slot}`"
            class="h-16 px-1 py-1 border-b relative"
        >
          <div
              v-for="booking in getBookingsForSlot(day.date, slot)"
              :key="booking.id"
              class="absolute inset-1 rounded p-1 overflow-hidden text-white text-xs cursor-pointer"
              :class="getBookingColor(booking.roomId)"
              @click="showBookingDetails(booking)"
          >
            <div class="font-semibold truncate">{{ booking.title }}</div>
            <div class="truncate">{{ getRoomName(booking.roomId) }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Legende für Raumfarben -->
    <div class="mt-4 pt-4 border-t">
      <h3 class="text-sm font-semibold mb-2">Legende:</h3>
      <div class="flex flex-wrap gap-2">
        <div
            v-for="room in rooms"
            :key="room.id"
            class="flex items-center"
        >
          <div
              class="w-4 h-4 rounded mr-1"
              :class="getBookingColor(room.id)"
          ></div>
          <span class="text-sm">{{ room.name }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoomStore } from '../stores/roomStore'
import { useBookingStore } from '../stores/bookingStore'

// Store-Instanzen
const roomStore = useRoomStore()
const bookingStore = useBookingStore()

// Daten für die aktuelle Woche
const currentWeekStart = ref(getMonday(new Date()))

const rooms = computed(() => roomStore.rooms)
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

// Hilfsfunktionen
function getMonday(date) {
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1) // Passt Sonntag als Tag 0 an
  return new Date(date.setDate(diff))
}

function formatDate(date) {
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${year}-${month}-${day}`
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

// Props für Raumfilter
const props = defineProps({
  filterRoomIds: {
    type: Array,
    default: () => []
  }
})

// Funktion zum Abrufen der Buchungen für ein bestimmtes Zeitfenster
function getBookingsForSlot(date, timeSlot) {
  return bookingStore.bookings.filter(booking =>
      booking.date === date &&
      booking.timeSlot === timeSlot &&
      (props.filterRoomIds.length === 0 || props.filterRoomIds.includes(booking.roomId))
  )
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
  10: 'bg-emerald-600',
}

function getBookingColor(roomId) {
  const colorIndex = roomId % Object.keys(roomColors).length
  return roomColors[colorIndex] || roomColors[1]
}

function getRoomName(roomId) {
  const room = rooms.value.find(r => r.id === roomId)
  return room ? room.name : 'Unbekannter Raum'
}

function showBookingDetails(booking) {
  // Event-Handling für das Klicken auf eine Buchung
  // Dies könnte ein Modal öffnen oder zur Detailansicht navigieren
  const details = `
    Buchung: ${booking.title}
    Raum: ${getRoomName(booking.roomId)}
    Datum: ${booking.date}
    Uhrzeit: ${booking.timeSlot}
    Kontakt: ${booking.contactName}
    ${booking.description ? '\nBeschreibung: ' + booking.description : ''}
  `
  alert(details)
}

onMounted(() => {
  // Setze den Startpunkt auf die aktuelle Woche
  currentWeekStart.value = getMonday(new Date())
})
</script>