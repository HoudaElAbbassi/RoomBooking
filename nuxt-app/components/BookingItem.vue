<template>
  <div
      class="border rounded-md p-4 mb-2"
      :class="{'border-l-4': true, [borderColorClass]: true}"
  >
    <div class="flex justify-between items-start">
      <div>
        <h3 class="font-medium text-lg">{{ booking.title }}</h3>
        <div class="text-sm text-gray-600 mb-2">
          <div><i class="fas fa-map-marker-alt mr-1"></i> {{ roomName }}</div>
          <div><i class="fas fa-calendar mr-1"></i> {{ formattedDate }}</div>
          <div><i class="fas fa-clock mr-1"></i> {{ booking.timeSlot }} Uhr</div>
        </div>
        <div v-if="booking.description" class="text-sm mt-2">
          {{ booking.description }}
        </div>
      </div>

      <div class="text-sm text-gray-600">
        <span><i class="fas fa-user mr-1"></i> {{ booking.contactName }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoomStore } from '~/stores/roomStore'

const props = defineProps({
  booking: {
    type: Object,
    required: true
  }
})

const roomStore = useRoomStore()

// Raumname abrufen
const roomName = computed(() => {
  const room = roomStore.rooms.find(r => r.id === props.booking.roomId)
  return room ? room.name : 'Unbekannter Raum'
})

// Formatiertes Datum
const formattedDate = computed(() => {
  if (!props.booking.date) return ''

  const [year, month, day] = props.booking.date.split('-')
  return `${day}.${month}.${year}`
})

// Farbcodierung
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
  const colorIndex = props.booking.roomId % Object.keys(colors).length
  return colors[colorIndex] || colors[1]
})
</script>