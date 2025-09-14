<!-- nuxt-app/pages/admin.vue - Fixed with Proper Error Handling -->
<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="bg-white rounded-lg shadow p-6">
      <h1 class="text-2xl font-bold mb-2">Administration</h1>
      <p class="text-gray-600">Verwaltung des Raumbelegungssystems</p>

      <!-- Loading Indicator -->
      <div v-if="isInitialLoading" class="mt-4 flex items-center text-blue-600">
        <i class="fas fa-spinner fa-spin mr-2"></i>
        Daten werden geladen...
      </div>

      <!-- Error Display -->
      <div v-if="initError" class="mt-4 p-3 bg-red-100 text-red-700 rounded-md">
        <i class="fas fa-exclamation-triangle mr-2"></i>
        {{ initError }}
        <button @click="retryInitialization" class="ml-4 text-red-800 underline">
          Erneut versuchen
        </button>
      </div>
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
          <!-- Loading State -->
          <div v-if="roomStore.loading" class="text-center py-8">
            <i class="fas fa-spinner fa-spin text-blue-500 text-2xl mb-2"></i>
            <p class="text-gray-600">Räume werden geladen...</p>
          </div>

          <!-- Empty State -->
          <div v-else-if="rooms.length === 0" class="text-center text-gray-500 py-8">
            <i class="fas fa-door-open text-gray-300 text-4xl mb-4"></i>
            <p class="mb-4">Keine Räume vorhanden</p>
            <button @click="showAddRoomModal = true" class="btn btn-primary">
              <i class="fas fa-plus mr-2"></i>
              Ersten Raum hinzufügen
            </button>
          </div>

          <!-- Rooms List -->
          <div v-else class="space-y-3">
            <div
                v-for="room in rooms"
                :key="room.id"
                class="flex items-center justify-between p-3 border rounded-md hover:bg-gray-50 transition-colors"
            >
              <div>
                <h3 class="font-medium">{{ room.name }}</h3>
                <p class="text-sm text-gray-600">
                  {{ room.location }} • {{ room.capacity }} Personen
                </p>
                <div v-if="room.features && room.features.length" class="flex flex-wrap gap-1 mt-1">
                  <span
                      v-for="feature in room.features.slice(0, 3)"
                      :key="feature"
                      class="px-2 py-0.5 bg-gray-100 text-xs rounded"
                  >
                    {{ feature }}
                  </span>
                  <span v-if="room.features.length > 3" class="text-xs text-gray-500">
                    +{{ room.features.length - 3 }} weitere
                  </span>
                </div>
              </div>
              <div class="flex space-x-2">
                <button
                    @click="editRoom(room)"
                    class="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded transition-colors"
                    title="Bearbeiten"
                >
                  <i class="fas fa-edit"></i>
                </button>
                <button
                    @click="deleteRoomConfirm(room)"
                    class="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded transition-colors"
                    title="Löschen"
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
          <!-- Loading State -->
          <div v-if="usersLoading" class="text-center py-8">
            <i class="fas fa-spinner fa-spin text-blue-500 text-2xl mb-2"></i>
            <p class="text-gray-600">Benutzer werden geladen...</p>
          </div>

          <!-- Empty State -->
          <div v-else-if="users.length === 0" class="text-center text-gray-500 py-8">
            <i class="fas fa-users text-gray-300 text-4xl mb-4"></i>
            <p>Keine Benutzer vorhanden</p>
          </div>

          <!-- Users List -->
          <div v-else class="space-y-3">
            <div
                v-for="user in users"
                :key="user.id"
                class="flex items-center justify-between p-3 border rounded-md hover:bg-gray-50 transition-colors"
            >
              <div>
                <h3 class="font-medium">{{ user.username }}</h3>
                <p class="text-sm text-gray-600">
                  {{ user.email }} • {{ user.role }}
                </p>
                <p v-if="user.created_at" class="text-xs text-gray-500">
                  Mitglied seit {{ formatDate(user.created_at) }}
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
                    class="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded transition-colors"
                    title="Status ändern"
                    :disabled="user.id === userStore.user?.id"
                >
                  <i class="fas fa-toggle-on" v-if="user.is_active"></i>
                  <i class="fas fa-toggle-off" v-else></i>
                </button>
                <button
                    @click="deleteUserConfirm(user)"
                    class="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded transition-colors"
                    title="Benutzer löschen"
                    :disabled="user.id === userStore.user?.id"
                >
                  <i class="fas fa-user-times"></i>
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
        <div class="flex justify-between items-center">
          <h2 class="text-xl font-semibold">Aktuelle Buchungen</h2>
          <div class="flex space-x-2">
            <button @click="refreshBookings" class="btn btn-outline btn-sm" :disabled="bookingStore.loading">
              <i class="fas fa-refresh mr-2" :class="{ 'fa-spin': bookingStore.loading }"></i>
              Aktualisieren
            </button>
            <select v-model="bookingFilter" class="text-sm border rounded px-2 py-1">
              <option value="all">Alle Buchungen</option>
              <option value="today">Nur heute</option>
              <option value="upcoming">Kommende</option>
              <option value="past">Vergangene</option>
            </select>
          </div>
        </div>
      </div>

      <div class="p-6">
        <!-- Loading State -->
        <div v-if="bookingStore.loading" class="text-center py-8">
          <i class="fas fa-spinner fa-spin text-blue-500 text-2xl mb-2"></i>
          <p class="text-gray-600">Buchungen werden geladen...</p>
        </div>

        <!-- Empty State -->
        <div v-else-if="filteredBookings.length === 0" class="text-center text-gray-500 py-8">
          <i class="fas fa-calendar-times text-gray-300 text-4xl mb-4"></i>
          <p>{{ getEmptyStateMessage() }}</p>
        </div>

        <!-- Bookings Table -->
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
                Status
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Aktionen
              </th>
            </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="booking in filteredBookings" :key="booking.id" class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">{{ booking.title }}</div>
                <div v-if="booking.description" class="text-sm text-gray-500 truncate max-w-xs">
                  {{ booking.description }}
                </div>
                <div v-if="booking.is_recurring" class="flex items-center mt-1 text-xs text-purple-600">
                  <i class="fas fa-repeat mr-1"></i>
                  Wiederkehrend
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">{{ getRoomName(booking.room_id || booking.roomId) }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">{{ formatBookingDateTime(booking) }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">{{ booking.contact_name || booking.contactName }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                      :class="getBookingStatusClass(booking)">
                  {{ getBookingStatus(booking) }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                <button
                    @click="editBookingFromTable(booking)"
                    class="text-blue-600 hover:text-blue-900"
                    title="Bearbeiten"
                >
                  <i class="fas fa-edit"></i>
                </button>
                <button
                    @click="deleteBookingFromTable(booking)"
                    class="text-red-600 hover:text-red-900"
                    title="Löschen"
                >
                  <i class="fas fa-trash"></i>
                </button>
              </td>
            </tr>
            </tbody>
          </table>

          <!-- Pagination -->
          <div v-if="filteredBookings.length > 10" class="mt-4 flex justify-center">
            <p class="text-sm text-gray-500">
              Zeige {{ Math.min(10, filteredBookings.length) }} von {{ filteredBookings.length }} Buchungen
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Room Modal -->
    <div v-if="showAddRoomModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div class="p-4 border-b flex justify-between items-center">
          <h2 class="text-xl font-semibold">Neuen Raum hinzufügen</h2>
          <button @click="closeAddRoomModal" class="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
        </div>

        <form @submit.prevent="addRoom" class="p-6">
          <div v-if="roomError" class="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
            {{ roomError }}
          </div>

          <div class="mb-4">
            <label class="block text-gray-700 font-medium mb-2">Name *</label>
            <input
                type="text"
                v-model="newRoom.name"
                class="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                placeholder="z.B. Konferenzraum A"
            >
          </div>

          <div class="mb-4">
            <label class="block text-gray-700 font-medium mb-2">Kapazität *</label>
            <input
                type="number"
                v-model="newRoom.capacity"
                class="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                min="1"
                max="1000"
                placeholder="z.B. 12"
            >
          </div>

          <div class="mb-4">
            <label class="block text-gray-700 font-medium mb-2">Standort *</label>
            <input
                type="text"
                v-model="newRoom.location"
                class="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                placeholder="z.B. Gebäude A, 2. Stock"
            >
          </div>

          <div class="mb-4">
            <label class="block text-gray-700 font-medium mb-2">Ausstattung</label>
            <input
                type="text"
                v-model="featuresInput"
                class="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="z.B. Beamer, Whiteboard, Klimaanlage (mit Komma trennen)"
            >
            <p class="text-xs text-gray-500 mt-1">Features mit Komma trennen</p>
          </div>

          <div class="mb-6">
            <label class="block text-gray-700 font-medium mb-2">Beschreibung</label>
            <textarea
                v-model="newRoom.description"
                class="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3"
                placeholder="Beschreibung des Raums..."
            ></textarea>
          </div>

          <div class="flex justify-end gap-3">
            <button
                type="button"
                @click="closeAddRoomModal"
                class="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
            >
              Abbrechen
            </button>
            <button
                type="submit"
                class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                :disabled="roomLoading"
            >
              <i v-if="roomLoading" class="fas fa-spinner fa-spin mr-2"></i>
              {{ roomLoading ? 'Wird hinzugefügt...' : 'Hinzufügen' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Add User Modal -->
    <div v-if="showAddUserModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div class="p-4 border-b flex justify-between items-center">
          <h2 class="text-xl font-semibold">Neuen Benutzer hinzufügen</h2>
          <button @click="closeAddUserModal" class="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
        </div>

        <form @submit.prevent="addUser" class="p-6">
          <div v-if="userError" class="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
            {{ userError }}
          </div>

          <div class="mb-4">
            <label class="block text-gray-700 font-medium mb-2">Benutzername *</label>
            <input
                type="text"
                v-model="newUser.username"
                class="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                placeholder="z.B. max.mustermann"
            >
          </div>

          <div class="mb-4">
            <label class="block text-gray-700 font-medium mb-2">E-Mail *</label>
            <input
                type="email"
                v-model="newUser.email"
                class="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                placeholder="z.B. max@company.com"
            >
          </div>

          <div class="mb-4">
            <label class="block text-gray-700 font-medium mb-2">Passwort *</label>
            <input
                type="password"
                v-model="newUser.password"
                class="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                placeholder="Mindestens 8 Zeichen"
                minlength="8"
            >
            <p class="text-xs text-gray-500 mt-1">
              Mindestens 8 Zeichen, mit Groß-/Kleinbuchstaben, Zahlen und Sonderzeichen
            </p>
          </div>

          <div class="mb-6">
            <label class="block text-gray-700 font-medium mb-2">Rolle *</label>
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
                @click="closeAddUserModal"
                class="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
            >
              Abbrechen
            </button>
            <button
                type="submit"
                class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                :disabled="userLoading"
            >
              <i v-if="userLoading" class="fas fa-spinner fa-spin mr-2"></i>
              {{ userLoading ? 'Wird hinzugefügt...' : 'Hinzufügen' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, inject } from 'vue'
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

// Toast injection
const toast = inject('toast')

// Data
const users = ref([])
const showAddRoomModal = ref(false)
const showAddUserModal = ref(false)
const bookingFilter = ref('all')

// Loading states
const isInitialLoading = ref(true)
const usersLoading = ref(false)
const roomLoading = ref(false)
const userLoading = ref(false)

// Error states
const initError = ref('')
const roomError = ref('')
const userError = ref('')

// Form data
const newRoom = ref({
  name: '',
  capacity: '',
  location: '',
  description: ''
})

const newUser = ref({
  username: '',
  email: '',
  password: '',
  role: 'user'
})

const featuresInput = ref('')

// Computed
const rooms = computed(() => roomStore.rooms)
const bookings = computed(() => bookingStore.bookings)

const stats = computed(() => ({
  totalRooms: rooms.value.length,
  totalBookings: bookings.value.length,
  totalUsers: users.value.length,
  todayBookings: bookings.value.filter(b => {
    const bookingDate = b.date || b.booking_date
    return bookingDate === new Date().toISOString().split('T')[0]
  }).length
}))

const filteredBookings = computed(() => {
  const today = new Date().toISOString().split('T')[0]
  const now = new Date()

  let filtered = [...bookings.value]

  switch (bookingFilter.value) {
    case 'today':
      filtered = filtered.filter(b => {
        const bookingDate = b.date || b.booking_date
        return bookingDate === today
      })
      break
    case 'upcoming':
      filtered = filtered.filter(b => {
        const bookingDate = b.date || b.booking_date
        const timeSlot = b.start_time || b.timeSlot || b.time_slot
        const bookingDateTime = new Date(`${bookingDate}T${timeSlot}:00`)
        return bookingDateTime >= now
      })
      break
    case 'past':
      filtered = filtered.filter(b => {
        const bookingDate = b.date || b.booking_date
        const timeSlot = b.start_time || b.timeSlot || b.time_slot
        const bookingDateTime = new Date(`${bookingDate}T${timeSlot}:00`)
        return bookingDateTime < now
      })
      break
  }

  return filtered.slice(0, 50) // Limit to 50 for performance
})

// Methods
function getRoomName(roomId) {
  const room = rooms.value.find(r => r.id === roomId || r.id === Number(roomId))
  return room ? room.name : 'Unbekannt'
}

function formatDate(dateString) {
  if (!dateString) return 'Unbekannt'
  const date = new Date(dateString)
  if (isNaN(date)) return 'Unbekannt'
  return date.toLocaleDateString('de-DE')
}

function formatBookingDateTime(booking) {
  const date = booking.date || booking.booking_date
  const startTime = booking.start_time || booking.timeSlot || booking.time_slot
  const endTime = booking.end_time || booking.endTime

  if (!date || !startTime) return 'Unbekannt'

  const [year, month, day] = date.split('-')
  const formattedDate = `${day}.${month}.${year}`

  if (endTime && endTime !== startTime) {
    return `${formattedDate} ${startTime} - ${endTime}`
  }
  return `${formattedDate} ${startTime}`
}

function getBookingStatus(booking) {
  const date = booking.date || booking.booking_date
  const timeSlot = booking.start_time || booking.timeSlot || booking.time_slot

  if (!date || !timeSlot) return 'Unbekannt'

  const bookingDateTime = new Date(`${date}T${timeSlot}:00`)
  const now = new Date()

  if (bookingDateTime < now) {
    return 'Vergangen'
  } else if (bookingDateTime.toDateString() === now.toDateString()) {
    return 'Heute'
  } else {
    return 'Geplant'
  }
}

function getBookingStatusClass(booking) {
  const status = getBookingStatus(booking)

  switch (status) {
    case 'Vergangen':
      return 'bg-gray-100 text-gray-800'
    case 'Heute':
      return 'bg-green-100 text-green-800'
    case 'Geplant':
      return 'bg-blue-100 text-blue-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

function getEmptyStateMessage() {
  switch (bookingFilter.value) {
    case 'today':
      return 'Keine Buchungen für heute'
    case 'upcoming':
      return 'Keine kommenden Buchungen'
    case 'past':
      return 'Keine vergangenen Buchungen'
    default:
      return 'Keine Buchungen vorhanden'
  }
}

async function retryInitialization() {
  initError.value = ''
  await initializeData()
}

async function initializeData() {
  isInitialLoading.value = true
  initError.value = ''

  try {
    // Parallel loading with proper error handling
    const results = await Promise.allSettled([
      roomStore.fetchRooms(),
      bookingStore.fetchBookings(),
      loadUsers()
    ])

    // Check for any failures
    const failures = results.filter(result => result.status === 'rejected')
    if (failures.length > 0) {
      console.warn('Some data failed to load:', failures)
      // Don't throw error if at least some data loaded
    }

    console.log('✅ Admin data initialized:', {
      rooms: rooms.value.length,
      bookings: bookings.value.length,
      users: users.value.length
    })

  } catch (error) {
    console.error('❌ Admin initialization failed:', error)
    initError.value = 'Fehler beim Laden der Daten. Bitte versuchen Sie es erneut.'
  } finally {
    isInitialLoading.value = false
  }
}

async function loadUsers() {
  usersLoading.value = true
  try {
    // Mock data for now - replace with actual API call
    users.value = [
      {
        id: 1,
        username: 'admin',
        email: 'admin@company.com',
        role: 'admin',
        is_active: true,
        created_at: '2025-01-01T00:00:00Z'
      },
      {
        id: 2,
        username: 'demo',
        email: 'demo@company.com',
        role: 'user',
        is_active: true,
        created_at: '2025-01-15T00:00:00Z'
      },
      {
        id: 3,
        username: 'testuser',
        email: 'test@company.com',
        role: 'user',
        is_active: false,
        created_at: '2025-02-01T00:00:00Z'
      }
    ]
  } catch (error) {
    console.error('User loading failed:', error)
    users.value = []
  } finally {
    usersLoading.value = false
  }
}

async function refreshBookings() {
  try {
    await bookingStore.fetchBookings()
    if (toast) {
      toast.success('Buchungen aktualisiert!', { duration: 2000 })
    }
  } catch (error) {
    if (toast) {
      toast.error('Fehler beim Aktualisieren der Buchungen', { duration: 3000 })
    }
  }
}

// Room Management
function closeAddRoomModal() {
  showAddRoomModal.value = false
  newRoom.value = { name: '', capacity: '', location: '', description: '' }
  featuresInput.value = ''
  roomError.value = ''
}

async function addRoom() {
  roomLoading.value = true
  roomError.value = ''

  try {
    const roomData = {
      ...newRoom.value,
      capacity: parseInt(newRoom.value.capacity),
      features: featuresInput.value ? featuresInput.value.split(',').map(f => f.trim()).filter(f => f) : []
    }

    await roomStore.addRoom(roomData)

    if (toast) {
      toast.success('Raum erfolgreich hinzugefügt!', {
        title: 'Erfolg',
        duration: 4000
      })
    }

    closeAddRoomModal()

  } catch (error) {
    roomError.value = error.message || 'Fehler beim Hinzufügen des Raums'

    if (toast) {
      toast.error(roomError.value, {
        title: 'Fehler',
        duration: 5000
      })
    }
  } finally {
    roomLoading.value = false
  }
}

function editRoom(room) {
  // TODO: Implement room editing
  if (toast) {
    toast.info('Raum-Bearbeitung wird in einem zukünftigen Update verfügbar sein', {
      title: 'Info',
      duration: 3000
    })
  }
}

async function deleteRoomConfirm(room) {
  if (!confirm(`Möchten Sie den Raum "${room.name}" wirklich löschen?`)) {
    return
  }

  try {
    // TODO: Implement room deletion API
    if (toast) {
      toast.info('Raum-Löschung wird in einem zukünftigen Update verfügbar sein', {
        title: 'Info',
        duration: 3000
      })
    }
  } catch (error) {
    if (toast) {
      toast.error(`Fehler beim Löschen: ${error.message}`, {
        title: 'Fehler',
        duration: 5000
      })
    }
  }
}

// User Management
function closeAddUserModal() {
  showAddUserModal.value = false
  newUser.value = { username: '', email: '', password: '', role: 'user' }
  userError.value = ''
}

async function addUser() {
  userLoading.value = true
  userError.value = ''

  try {
    await userStore.register(newUser.value)

    if (toast) {
      toast.success('Benutzer erfolgreich hinzugefügt!', {
        title: 'Erfolg',
        duration: 4000
      })
    }

    // Add to local users list (mock)
    users.value.push({
      id: Date.now(),
      ...newUser.value,
      password: undefined, // Don't store password
      is_active: true,
      created_at: new Date().toISOString()
    })

    closeAddUserModal()

  } catch (error) {
    userError.value = error.message || 'Fehler beim Hinzufügen des Benutzers'

    if (toast) {
      toast.error(userError.value, {
        title: 'Fehler',
        duration: 5000
      })
    }
  } finally {
    userLoading.value = false
  }
}

function toggleUserStatus(user) {
  user.is_active = !user.is_active

  if (toast) {
    toast.success(
        `Benutzer ${user.username} wurde ${user.is_active ? 'aktiviert' : 'deaktiviert'}`,
        { duration: 3000 }
    )
  }
}

function deleteUserConfirm(user) {
  if (!confirm(`Möchten Sie den Benutzer "${user.username}" wirklich löschen?`)) {
    return
  }

  const index = users.value.findIndex(u => u.id === user.id)
  if (index !== -1) {
    users.value.splice(index, 1)

    if (toast) {
      toast.success(`Benutzer ${user.username} wurde gelöscht`, {
        title: 'Gelöscht',
        duration: 3000
      })
    }
  }
}

// Booking Management
function editBookingFromTable(booking) {
  if (process.client) {
    window.dispatchEvent(new CustomEvent('openBookingModal', {
      detail: { booking }
    }))
  }
}

async function deleteBookingFromTable(booking) {
  const isRecurring = booking.is_recurring
  let message = `Möchten Sie die Buchung "${booking.title}" wirklich löschen?`

  if (isRecurring) {
    message += '\n\nDiese Buchung ist wiederkehrend. Sollen alle Termine der Serie gelöscht werden?'

    const result = confirm(message + '\n\nOK = Alle löschen, Abbrechen = Nichts löschen')
    if (!result) return
  } else {
    if (!confirm(message)) return
  }

  try {
    await bookingStore.deleteBooking(booking.id, isRecurring)

    if (toast) {
      toast.success(
          isRecurring ? 'Buchungsserie gelöscht!' : 'Buchung gelöscht!',
          { title: 'Gelöscht', duration: 3000 }
      )
    }
  } catch (error) {
    if (toast) {
      toast.error(`Fehler beim Löschen: ${error.message}`, {
        title: 'Fehler',
        duration: 5000
      })
    }
  }
}

// Initialize
onMounted(async () => {
  console.log('🚀 Admin panel initializing...')
  await initializeData()
})
</script>

<style scoped>
.btn {
  @apply px-4 py-2 rounded transition-colors font-medium;
}

.btn-primary {
  @apply bg-blue-500 text-white hover:bg-blue-600;
}

.btn-outline {
  @apply border border-gray-300 text-gray-700 rounded px-4 py-2 hover:bg-gray-50;
}

.table {
  @apply min-w-full divide-y divide-gray-200;
}

.table th {
  @apply px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider;
}

.table td {
  @apply px-6 py-4 whitespace-nowrap;
}

.table .status-indicator {
  @apply px-2 inline-flex text-xs leading-5 font-semibold rounded-full;
}

.table .status-indicator.geplant {
  @apply bg-blue-100 text-blue-800;
}

.table .status-indicator.heute {
  @apply bg-green-100 text-green-800;
}

.table .status-indicator.vergangen {
  @apply bg-gray-100 text-gray-800;
}

.modal {
  @apply fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50;
}

.modal-content {
  @apply bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto;
}

.modal-header {
  @apply p-4 border-b flex justify-between items-center;
}

.modal-title {
  @apply text-xl font-semibold;
}

.modal-close {
  @apply text-gray-500 hover:text-gray-700 text-2xl;
}

.modal-body {
  @apply p-6;
}

.modal-footer {
  @apply p-4 border-t flex justify-end gap-3;
}

.spinner {
  @apply text-blue-500 text-2xl mb-2;
}

.empty-state-icon {
  @apply text-gray-300 text-4xl mb-4;
}

.empty-state-text {
  @apply text-center text-gray-500 py-8;
}

.error-message {
  @apply mb-4 p-3 bg-red-100 text-red-700 rounded-md;
}

.success-message {
  @apply p-3 bg-green-100 text-green-700 rounded-md;
}

.warning-message {
  @apply p-3 bg-yellow-100 text-yellow-700 rounded-md;
}
</style>
