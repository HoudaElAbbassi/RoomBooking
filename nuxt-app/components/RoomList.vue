<template>
  <div class="bg-white rounded-lg shadow p-4">
    <div class="flex justify-between items-center mb-4 pb-2 border-b">
      <h2 class="text-xl font-semibold">Verfügbare Räume</h2>
    </div>

    <div v-if="filteredRooms.length === 0" class="py-4 text-center text-gray-500">
      Keine Räume gefunden.
    </div>

    <ul v-else class="space-y-2">
      <li v-for="room in filteredRooms" :key="room.id"
          class="p-3 rounded-md cursor-pointer transition-all"
          :class="{'bg-blue-50 border-l-4 border-blue-500': room.id === selectedRoomId,
                'hover:bg-gray-50 border-l-4 border-transparent': room.id !== selectedRoomId}"
          @click="selectRoom(room.id)">
        <h3 class="font-medium">{{ room.name }}</h3>
        <p class="text-sm text-gray-600">{{ room.location }} • {{ room.capacity }} Personen</p>
        <div class="flex flex-wrap gap-1 mt-1">
          <span v-for="feature in room.features.slice(0, 2)" :key="feature"
                class="px-2 py-0.5 bg-gray-100 rounded-full text-xs">
            {{ feature }}
          </span>
          <span v-if="room.features.length > 2" class="text-xs text-gray-500">
            +{{ room.features.length - 2 }} weitere
          </span>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { computed } from 'vue'
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

// Raum auswählen
function selectRoom(roomId) {
  roomStore.selectRoom(roomId)
}
</script>