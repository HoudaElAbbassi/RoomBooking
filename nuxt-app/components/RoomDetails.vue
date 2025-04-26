<template>
  <div class="bg-white rounded-lg shadow p-6" v-if="room">
    <div class="flex justify-between items-start mb-4">
      <div>
        <h2 class="text-2xl font-semibold">{{ room.name }}</h2>
        <p class="text-gray-600">
          <i class="fas fa-map-marker-alt mr-2 text-blue-500"></i> {{ room.location }} •
          <i class="fas fa-users ml-2 mr-2 text-blue-500"></i> {{ room.capacity }} Personen
        </p>
      </div>

      <button
          @click="openBookingModal"
          class="btn btn-primary"
      >
        <i class="fas fa-plus mr-2"></i> Raum buchen
      </button>
    </div>

    <p class="text-gray-700 mb-4">{{ room.description }}</p>

    <div class="flex flex-wrap gap-2 mb-6">
      <span v-for="feature in room.features" :key="feature"
            class="px-3 py-1 bg-gray-100 rounded-full text-sm flex items-center">
        <i class="fas fa-check text-blue-500 mr-1"></i> {{ feature }}
      </span>
    </div>

    <div class="border-t pt-4 mt-4">
      <h3 class="text-lg font-medium mb-3">Aktuelle Buchungen</h3>

      <div class="mb-4">
        <div class="flex gap-2 mb-3">
          <input
              type="date"
              v-model="selectedDate"
              class="border rounded p-2 text-sm"
              :min="today"
          >
          <button @click="selectedDate = today" class="btn btn-outline text-sm">
            Heute
          </button>
        </div>
      </div>

      <div v-if="bookings.length === 0" class="text-gray-500 py-4">
        Keine Buchungen für {{ room.name }} am {{ formattedDate }} vorhanden.
      </div>

      <div v-else class="space-y-2">
        <BookingItem
            v-for="booking in bookings"
            :key="booking.id"
            :booking="booking"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useBookingStore } from '~/stores/bookingStore'
import BookingItem from '~/components/BookingItem.vue'

const props = defineProps({
  room: {
    type: Object,
    required: true
  }
})

const bookingStore = useBookingStore()
const today = computed(() => new Date().toISOString().split('T')[0])
const selectedDate = ref(today.value)

// Buchungen für das gewählte Datum
const bookings = computed(() => {
  return bookingStore.getBookingsForRoomAndDate(props.room.id, selectedDate.value)
})

// Formatiertes Datum für Anzeige
const formattedDate = computed(() => {
  if (!selectedDate.value) return ''

  const [year, month, day] = selectedDate.value.split('-')
  return `${day}.${month}.${year}`
})

// Buchungsmodal öffnen
function openBookingModal() {
  // Ereignis auslösen, um das Modal zu öffnen
  if (process.client) {
    window.dispatchEvent(new CustomEvent('openBookingModal', {
      detail: {
        date: selectedDate.value,
        roomId: props.room.id
      }
    }))
  }
}
</script>