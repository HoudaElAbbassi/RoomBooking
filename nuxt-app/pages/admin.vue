<!-- nuxt-app/pages/admin.vue -->
<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="bg-white rounded-lg shadow p-6">
      <h1 class="text-2xl font-bold mb-2">Administration</h1>
      <p class="text-gray-600">Verwaltung des Raumbelegungssystems</p>
    </div>

    <!-- Statistics Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center">
          <div class="p-3 rounded-full bg-blue-100 text-blue-600">
            <i class="fas fa-door-open text-xl"></i>
          </div>
          <div class="ml-4">
            <p class="text-2xl font-semibold">{{ stats.totalRooms }}</p>
            <p class="text-gray-600">Räume</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center">
          <div class="p-3 rounded-full bg-green-100 text-green-600">
            <i class="fas fa-calendar-check text-xl"></i>
          </div>
          <div class="ml-4">
            <p class="text-2xl font-semibold">{{ stats.totalBookings }}</p>
            <p class="text-gray-600">Buchungen</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center">
          <div class="p-3 rounded-full bg-purple-100 text-purple-600">
            <i class="fas fa-users text-xl"></i>
          </div>
          <div class="ml-4">
            <p class="text-2xl font-semibold">{{ stats.totalUsers }}</p>
            <p class="text-gray-600">Benutzer</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center">
          <div class="p-3 rounded-full bg-orange-100 text-orange-600">
            <i class="fas fa-calendar-day text-xl"></i>
          </div>
          <div class="ml-4">
            <p class="text-2xl font-semibold">{{ stats.todayBookings }}</p>
            <p class="text-gray-600">Heute</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Management Sections -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Room Management -->
      <div class="bg-white rounded-lg shadow">
        <div class="p-6 border-b">
          <div class="flex justify-between items-center">
            <h2 class="text-xl font-semibold">Raumverwaltung</h2>
            <button
                @click="showAddRoomModal = true"
                class="btn btn-primary"
            >
              <i class="fas fa-plus mr-2"></i>
              Raum hinzufügen
            </button>
          </div>
        </div>

        <div class="p-6">
          <div v-if="rooms.length === 0" class="text-center text-gray-500 py-8">
            Keine Räume vorhanden
          </div>

          <div v-else class="space-y-3">
            <div
                v-for="room in rooms"
                :key="room.id"
                class="flex items-center justify-between p-3 border rounded-md"
            >
              <div>
                <h3 class="font-medium">{{ room.name }}</h3>
                <p class="text-sm text-gray-600">
                  {{ room.location }} • {{ room.capacity }} Personen
                </p>
              </div>
              <div class="flex space-x-2">
                <button
                    @click="editRoom(room)"
                    class="text-blue-600 hover:text-blue-800"
                >
                  <i class="fas fa-edit"></i>
                </button>
                <button
                    @click="deleteRoom(room.id)"
                    class="text-red-600 hover:text-red-800"
                >
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- User Management -->
      <div class="bg-white rounded-lg shadow">
        <div class="p-6 border-b">
          <div class="flex justify-between items-center">
            <h2 class="text-xl font-semibold">Benutzerverwaltung</h2>
            <button
                @click="showAddUserModal = true"
                class="btn btn-primary"
            >
              <i class="fas fa-user-plus mr-2"></i>
              Benutzer hinzufügen
            </button>
          </div>
        </div>

        <div class="p-6">
          <div v-if="users.length === 0" class="text-center text-gray-500 py-8">
            Keine Benutzer vorhanden
          </div>

          <div v-else class="space-y-3">
            <div
                v-for="user in users"
                :key="user.id"
                class="flex items-center justify-between p-3 border rounded-md"
            >
              <div>
                <h3 class="font-medium">{{ user.username }}</h3>
                <p class="text-sm text-gray-600">
                  {{ user.email }} • {{ user.role }}
                </p>
              </div>
              <div class="flex items-center space-x-2">
                <span
                    class="px-2 py-1 text-xs rounded-full"
                    :class="user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'"
                >
                  {{ user.is_active ? 'Aktiv' : 'Inaktiv' }}
                </span>
                <button
                    @click="toggleUserStatus(user)"
                    class="text-blue-600 hover:text-blue-800"
                >
                  <i class="fas fa-toggle-on" v-if="user.is_active"></i>
                  <i class="fas fa-toggle-off" v-else></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Bookings -->
    <div class="bg-white rounded-lg shadow">
      <div class="p-6 border-b">
        <h2 class="text-xl font-semibold">Aktuelle Buchungen</h2>
      </div>

      <div class="p-6">
        <div v-if="recentBookings.length === 0" class="text-center text-gray-500 py-8">
          Keine aktuellen Buchungen
        </div>

        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Titel
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Raum
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Datum/Zeit
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Kontakt
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Aktionen
              </th>
            </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="booking in recentBookings" :key="booking.id">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">{{ booking.title }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">{{ getRoomName(booking.room_id) }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">{{ formatDateTime(booking.date, booking.time_slot) }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">{{ booking.contact_name }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button
                    @click="deleteBooking(booking.id)"
                    class="text-red-600 hover:text-red-900"
                >
                  <i class="fas fa-trash"></i>
                </button>
              </td>
            </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Add Room Modal -->
    <div v-if="showAddRoomModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div class="p-4 border-b flex justify-between items-center">
          <h2 class="text-xl font-semibold">Neuen Raum hinzufügen</h2>
          <button @click="showAddRoomModal = false" class="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
        </div>

        <form @submit.prevent="addRoom" class="p-6">
          <div class="mb-4">
            <label class="block text-gray-700 font-medium mb-2">Name</label>
            <input
                type="text"
                v-model="newRoom.name"
                class="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
            >
          </div>

          <div class="mb-4">
            <label class="block text-gray-700 font-medium mb-2">Kapazität</label>
            <input
                type="number"
                v-model="newRoom.capacity"
                class="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
            >
          </div>

          <div class="mb-4">
            <label class="block text-gray-700 font-medium mb-2">Standort</label>
            <input
                type="text"
                v-model="newRoom.location"
                class="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
            >
          </div>

          <div class="mb-6">
            <label class="block text-gray-700 font-medium mb-2">Beschreibung</label>
            <textarea
                v-model="newRoom.description"
                class="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3"
            ></textarea>
          </div>

          <div class="flex justify-end gap-3">
            <button
                type="button"
                @click="showAddRoomModal = false"
                class="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
            >
              Abbrechen
            </button>
            <button
                type="submit"
                class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Hinzufügen
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Add User Modal -->
    <div v-if="showAddUserModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div class="p-4 border-b flex justify-between items-center">
          <h2 class="text-xl font-semibold">Neuen Benutzer hinzufügen</h2>
          <button @click="showAddUserModal = false" class="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
        </div>

        <form @submit.prevent="addUser" class="p-6">
          <div class="mb-4">
            <label class="block text-gray-700 font-medium mb-2">Benutzername</label>
            <input
                type="text"
                v-model="newUser.username"
                class="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
            >
          </div>

          <div class="mb-4">
            <label class="block text-gray-700 font-medium mb-2">E-Mail</label>
            <input
                type="email"
                v-model="newUser.email"
                class="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
            >
          </div>

          <div class="mb-4">
            <label class="block text-gray-700 font-medium mb-2">Passwort</label>
            <input
                type="password"
                v-model="newUser.password"
                class="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
            >
          </div>

          <div class="mb-6">
            <label class="block text-gray-700 font-medium mb-2">Rolle</label>
            <select
                v-model="newUser.role"
                class="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="user">Benutzer</option>
              <option value="admin">Administrator</option>
            </select>
          </div>

          <div class="flex justify-end gap-3">
            <button
                type="button"
                @click="showAddUserModal = false"
                class="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
            >
              Abbrechen
            </button>
            <button
                type="submit"
                class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Hinzufügen
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoomStore } from '~/stores/roomStore'
import { useBookingStore } from '~/stores/bookingStore'
import { useUserStore } from '~/stores/userStore'

// Middleware für Admin-Rechte
definePageMeta({
  middleware: ['admin']
})

// Stores
const roomStore = useRoomStore()
const bookingStore = useBookingStore()
const userStore = useUserStore()

// Data
const users = ref([])
const showAddRoomModal = ref(false)
const showAddUserModal = ref(false)

const newRoom = ref({
  name: '',
  capacity: '',
  location: '',
  description: '',
  features: []
})

const newUser = ref({
  username: '',
  email: '',
  password: '',
  role: 'user'
})

// Computed
const rooms = computed(() => roomStore.rooms)
const recentBookings = computed(() => bookingStore.bookings.slice(0, 10))

const stats = computed(() => ({
  totalRooms: rooms.value.length,
  totalBookings: bookingStore.bookings.length,
  totalUsers: users.value.length,
  todayBookings: bookingStore.bookings.filter(b =>
      b.date === new Date().toISOString().split('T')[0]
  ).length
}))

// Methods
function getRoomName(roomId) {
  const room = rooms.value.find(r => r.id === roomId)
  return room ? room.name : 'Unbekannter Raum'
}

function formatDateTime(date, time) {
  const [year, month, day] = date.split('-')
  return `${day}.${month}.${year} ${time}`
}

async function addRoom() {
  try {
    await roomStore.addRoom(newRoom.value)
    showAddRoomModal.value = false

    // Reset form
    newRoom.value = {
      name: '',
      capacity: '',
      location: '',
      description: '',
      features: []
    }

    alert('Raum erfolgreich hinzugefügt!')
  } catch (error) {
    alert('Fehler beim Hinzufügen des Raums: ' + error.message)
  }
}

async function addUser() {
  try {
    await userStore.register(newUser.value)
    showAddUserModal.value = false

    // Reset form
    newUser.value = {
      username: '',
      email: '',
      password: '',
      role: 'user'
    }

    // Reload users
    await loadUsers()

    alert('Benutzer erfolgreich hinzugefügt!')
  } catch (error) {
    alert('Fehler beim Hinzufügen des Benutzers: ' + error.message)
  }
}

async function deleteRoom(roomId) {
  if (confirm('Sind Sie sicher, dass Sie diesen Raum löschen möchten?')) {
    try {
      // Implementiere deleteRoom in roomStore
      alert('Raum-Löschung noch nicht implementiert')
    } catch (error) {
      alert('Fehler beim Löschen: ' + error.message)
    }
  }
}

async function deleteBooking(bookingId) {
  if (confirm('Sind Sie sicher, dass Sie diese Buchung löschen möchten?')) {
    try {
      await bookingStore.deleteBooking(bookingId)
      alert('Buchung erfolgreich gelöscht!')
    } catch (error) {
      alert('Fehler beim Löschen: ' + error.message)
    }
  }
}

function editRoom(room) {
  // Implementiere Raum-Bearbeitung
  alert('Raum-Bearbeitung noch nicht implementiert')
}

function toggleUserStatus(user) {
  // Implementiere Benutzer-Status umschalten
  alert('Benutzer-Status ändern noch nicht implementiert')
}

async function loadUsers() {
  try {
    // Implementiere Benutzer laden
    // Für jetzt Dummy-Daten
    users.value = [
      { id: 1, username: 'admin', email: 'admin@company.com', role: 'admin', is_active: true },
      { id: 2, username: 'demo', email: 'demo@company.com', role: 'user', is_active: true }
    ]
  } catch (error) {
    console.error('Fehler beim Laden der Benutzer:', error)
  }
}

// Initialize
onMounted(async () => {
  await Promise.all([
    roomStore.fetchRooms(),
    bookingStore.fetchBookings(),
    loadUsers()
  ])
})
</script>