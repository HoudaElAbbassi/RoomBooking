<template>
  <header class="bg-white shadow-sm">
    <div class="container mx-auto px-4 py-4 flex justify-between items-center">
      <div class="flex items-center">
        <i class="fas fa-calendar-check text-blue-500 text-2xl mr-3"></i>
        <h1 class="text-xl font-semibold">Raumbelegungssystem</h1>
      </div>

      <div class="max-w-xs w-full">
        <input type="text"
               placeholder="Raum suchen..."
               class="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
               v-model="searchQuery"
               @input="searchRooms">
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref } from 'vue'
import { useRoomStore } from '~/stores/roomStore'

const roomStore = useRoomStore()
const searchQuery = ref('')

function searchRooms() {
  // Implementierung der Suchfunktion
  // In einer komplexeren App würde man hier filtern
  console.log('Suche nach:', searchQuery.value)
}
</script>