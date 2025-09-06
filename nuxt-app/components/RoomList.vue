<!-- nuxt-app/components/RoomList.vue - Erweitert mit Verfügbarkeitsanzeige -->
<template>
  <div class="bg-white rounded-lg shadow p-4">
    <div class="flex justify-between items-center mb-4 pb-2 border-b">
      <h2 class="text-xl font-semibold">Verfügbare Räume</h2>
      <div class="text-sm text-gray-500">
        {{ currentDate }}
      </div>
    </div>

    <div v-if="filteredRooms.length === 0" class="py-4 text-center text-gray-500">
      Keine Räume gefunden.
    </div>

    <ul v-else class="space-y-2">
      <li v-for="room in filteredRooms" :key="room.id"
          class="p-3 rounded-md cursor-pointer transition-all border"
          :class="getRoomCardClass(room)"
          @click="selectRoom(room.id)">

        <!-- Raum Header -->
        <div class="flex justify-between items-start mb-2">
          <h3 class="font-medium">{{ room.name }}</h3>
          <div class="flex items-center space-x-2">
            <!-- Verfügbarkeitsstatus -->
            <span v-if="room.availability_rules?.type === 'time_restricted'"
                  class="px-2 py-1 text-xs rounded-full"
                  :class="getAvailabilityStatusClass(room)">
              <i class="fas fa-clock mr-1"></i>
              {{ getAvailabilityStatusText(room) }}
            </span>
            <span v-else class="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
              <i class="fas fa-check mr-1"></i>
              Immer verfügbar
            </span>
          </div>
        </div>

        <!-- Raum Details -->
        <p class="text-sm text-gray-600">{{ room.location }} • {{ room.capacity }} Personen</p>

        <!-- Features -->
        <div class="flex flex-wrap gap-1 mt-2">
          <span v-for="feature in room.features.slice(0, 2)" :key="feature"
                class="px-2 py-0.5 bg-gray-100 rounded-full text-xs">
            {{ feature }}
          </span>
          <span v-if="room.features.length > 2" class="text-xs text-gray-500">
            +{{ room.features.length - 2 }} weitere
          </span>
        </div>

        <!-- Verfügbarkeitszeiten für zeitbeschränkte Räume -->
        <div v-if="room.availability_rules?.type === 'time_restricted'"
             class="mt-2 p-2 bg-blue-50 rounded text-xs">
          <div class="font-medium text-blue-900 mb-1">Verfügbarkeitszeiten:</div>
          <div class="space-y-1">
            <div v-for="rule in room.availability_rules.rules" :key="rule.day"
                 class="text-blue-800">
              <i class="fas fa-calendar-day mr-1"></i>
              {{ getDayName(rule.day) }}: {{ rule.start_time }} - {{ rule.end_time }}
            </div>
          </div>
        </div>

        <!-- Heute verfügbare Zeitslots -->
        <div v-if="todayAvailability[room.id]" class="mt-2 pt-2 border-t">
          <div class="text-xs font-medium text-gray-700 mb-1">
            Heute verfügbar ({{ todayAvailability[room.id].freeSlots.length }} von {{ todayAvailability[room.id].availableSlots.length }} Slots):
          </div>
          <div class="flex flex-wrap gap-1">
            <span v-for="slot in todayAvailability[room.id].freeSlots.slice(0, 3)"
                  :key="slot"
                  class="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
              {{ slot }}
            </span>
            <span v-if="todayAvailability[room.id].freeSlots.length > 3"
                  class="text-xs text-gray-500 self-center">
              +{{ todayAvailability[room.id].freeSlots.length - 3 }} weitere
            </span>
          </div>
        </div>
      </li>
    </ul>

    <!-- Legende -->
    <div class="mt-4 pt-4 border-t text-xs">
      <div class="font-medium text-gray-700 mb-2">Legende:</div>
      <div class="space-y-1">
        <div class="flex items-center">
          <div class="w-3 h-3 bg-green-100 border border-green-300 rounded mr-2"></div>
          <span>Heute verfügbar</span>
        </div>
        <div class="flex items-center">
          <div class="w-3 h-3 bg-orange-100 border border-orange-300 rounded mr-2"></div>
          <span>Heute nicht verfügbar</span>
        </div>
        <div class="flex items-center">
          <div class="w-3 h-3 bg-blue-100 border border-blue-300 rounded mr-2"></div>
          <span>Zeitbeschränkt</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoomStore } from '~/stores/roomStore'

const props = defineProps({
  searchQuery: {
    type: String,
    default: ''
  }
})

const roomStore = useRoomStore()
const rooms = computed(() => roomStore.rooms)
const selectedRoomId = computed(() => roomStore.selectedRoomId)

// Verfügbarkeitsdaten für heute
const todayAvailability = ref({})
const loadingAvailability = ref(false)

// Aktuelles Datum
const today = computed(() => new Date().toISOString().split('T')[0])
const currentDate = computed(() => {
  const date = new Date()
  return date.toLocaleDateString('de-DE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
})

// Gefilterte Räume basierend auf der Suchabfrage
const filteredRooms = computed(() => {
  if (!props.searchQuery) return rooms.value

  const query = props.searchQuery.toLowerCase()
  return rooms.value.filter(room =>
      room.name.toLowerCase().includes(query) ||
      room.location.toLowerCase().includes(query) ||
      room.features.some(feature => feature.toLowerCase().includes(query))
  )
})

// Methoden
function selectRoom(roomId) {
  roomStore.selectRoom(roomId)
}

function getDayName(dayNumber) {
  const days = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']
  return days[dayNumber] || 'Unbekannt'
}

function isRoomAvailableToday(room) {
  if (!room.availability_rules || room.availability_rules.type === 'always_available') {
    return true
  }

  if (room.availability_rules.type === 'time_restricted') {
    const todayDayOfWeek = new Date().getDay()
    const rules = room.availability_rules.rules || []

    return rules.some(rule => rule.day === todayDayOfWeek)
  }

  return false
}

function getAvailabilityStatusText(room) {
  if (isRoomAvailableToday(room)) {
    const availability = todayAvailability.value[room.id]
    if (availability) {
      if (availability.freeSlots.length === 0) {
        return 'Ausgebucht'
      } else {
        return `${availability.freeSlots.length} Slots frei`
      }
    }
    return 'Heute verfügbar'
  } else {
    return 'Heute nicht verfügbar'
  }
}

function getAvailabilityStatusClass(room) {
  if (isRoomAvailableToday(room)) {
    const availability = todayAvailability.value[room.id]
    if (availability && availability.freeSlots.length === 0) {
      return 'bg-red-100 text-red-800'  // Ausgebucht
    }
    return 'bg-green-100 text-green-800'  // Verfügbar
  } else {
    return 'bg-orange-100 text-orange-800'  // Nicht verfügbar
  }
}

function getRoomCardClass(room) {
  const baseClass = 'hover:shadow-md transition-shadow'
  const selectedClass = room.id === selectedRoomId.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200'

  let availabilityClass = ''
  if (room.availability_rules?.type === 'time_restricted') {
    if (isRoomAvailableToday(room)) {
      const availability = todayAvailability.value[room.id]
      if (availability && availability.freeSlots.length === 0) {
        availabilityClass = 'border-l-4 border-l-red-400'  // Ausgebucht
      } else {
        availabilityClass = 'border-l-4 border-l-green-400'  // Verfügbar
      }
    } else {
      availabilityClass = 'border-l-4 border-l-orange-400'  // Heute nicht verfügbar
    }
  } else {
    availabilityClass = 'border-l-4 border-l-blue-400'  // Immer verfügbar
  }

  return `${baseClass} ${selectedClass} ${availabilityClass}`
}

async function loadTodayAvailability() {
  if (rooms.value.length === 0) return

  loadingAvailability.value = true
  const availability = {}

  try {
    for (const room of rooms.value) {
      try {
        // Bestimme API URL basierend auf Umgebung
        const apiUrl = process.client && window.location.hostname === 'localhost'
            ? `/api/room-availability`
            : `/.netlify/functions/room-availability`

        const response = await fetch(`${apiUrl}?roomId=${room.id}&date=${today.value}`)

        if (response.ok) {
          const data = await response.json()
          availability[room.id] = data
        }
      } catch (error) {
        console.error(`Error loading availability for room ${room.id}:`, error)
      }
    }

    todayAvailability.value = availability
  } catch (error) {
    console.error('Error loading today availability:', error)
  } finally {
    loadingAvailability.value = false
  }
}

// Watchers
watch(() => rooms.value, () => {
  if (rooms.value.length > 0) {
    loadTodayAvailability()
  }
}, { immediate: true })

// Lifecycle
onMounted(() => {
  if (rooms.value.length > 0) {
    loadTodayAvailability()
  }
})
</script>