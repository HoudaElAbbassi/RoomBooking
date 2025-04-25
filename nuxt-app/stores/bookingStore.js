// stores/bookingStore.js
import { defineStore } from 'pinia'

export const useBookingStore = defineStore('booking', {
    state: () => ({
        bookings: [
            {
                id: 1,
                roomId: 1,
                title: "Team-Meeting",
                description: "Wöchentliches Team-Meeting",
                contactName: "Max Mustermann",
                date: "2025-04-24",
                timeSlot: "09:00"
            },
            {
                id: 2,
                roomId: 2,
                title: "Firmenpräsentation",
                description: "Präsentation des Jahresberichts",
                contactName: "Anna Schmidt",
                date: "2025-04-24",
                timeSlot: "14:00"
            }
        ],
        timeSlots: [
            "08:00", "09:00", "10:00", "11:00",
            "12:00", "13:00", "14:00", "15:00",
            "16:00", "17:00", "18:00", "19:00"
        ]
    }),

    getters: {
        getBookingsForRoomAndDate: (state) => (roomId, date) => {
            return state.bookings.filter(booking =>
                booking.roomId === roomId && booking.date === date
            )
        }
    },

    actions: {
        addBooking(booking) {
            // Neue ID generieren
            const newId = Math.max(0, ...this.bookings.map(b => b.id)) + 1

            // Neuen Eintrag hinzufügen
            this.bookings.push({
                id: newId,
                ...booking
            })

            return newId
        },

        // Vereinfachte Version ohne localStorage
        loadFromLocalStorage() {
            // In dieser vereinfachten Version tun wir nichts,
            // um Probleme mit SSR zu vermeiden
            console.log('Bookings loaded')
        }
    }
})