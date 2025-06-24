// stores/bookingStore.js
import { defineStore } from 'pinia';

export const useBookingStore = defineStore('booking', {
    state: () => ({
        bookings: [],
        timeSlots: [
            "08:00", "09:00", "10:00", "11:00",
            "12:00", "13:00", "14:00", "15:00",
            "16:00", "17:00", "18:00", "19:00"
        ],
        loading: false,
        error: null
    }),

    getters: {
        getBookingsForRoomAndDate: (state) => (roomId, date) => {
            return state.bookings.filter(booking =>
                booking.room_id == roomId && booking.date === date
            );
        },

        isTimeSlotBooked: (state) => (roomId, date, timeSlot) => {
            return state.bookings.some(booking =>
                booking.room_id == roomId &&
                booking.date === date &&
                booking.time_slot === timeSlot
            );
        }
    },

    actions: {
        async fetchBookings(filters = {}) {
            this.loading = true;
            this.error = null;

            try {
                // Build query parameters
                const queryParams = new URLSearchParams();
                if (filters.roomId) queryParams.append('roomId', filters.roomId);
                if (filters.date) queryParams.append('date', filters.date);
                if (filters.startDate) queryParams.append('startDate', filters.startDate);
                if (filters.endDate) queryParams.append('endDate', filters.endDate);

                // Verwende Netlify Functions
                const response = await fetch(`/.netlify/functions/bookings?${queryParams}`);

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();

                // If specific filters are provided, only update the relevant bookings
                if (filters.roomId || filters.date) {
                    // Remove existing bookings that match the filter criteria
                    this.bookings = this.bookings.filter(booking => {
                        if (filters.roomId && filters.date) {
                            return booking.room_id != filters.roomId || booking.date !== filters.date;
                        } else if (filters.roomId) {
                            return booking.room_id != filters.roomId;
                        } else if (filters.date) {
                            return booking.date !== filters.date;
                        }
                        return true;
                    });

                    // Add the new bookings
                    this.bookings = [...this.bookings, ...data];
                } else {
                    // If no specific filters, replace all bookings
                    this.bookings = data;
                }

                return data;
            } catch (error) {
                console.error('Error fetching bookings:', error);
                this.error = error.message;

                // Fallback zu lokalen Daten wenn API fehlschlägt
                if (this.bookings.length === 0 && !filters.roomId && !filters.date) {
                    this.bookings = [
                        {
                            id: 1,
                            room_id: 1,
                            title: "Team-Meeting",
                            description: "Wöchentliches Team-Meeting",
                            contact_name: "Max Mustermann",
                            date: new Date().toISOString().split('T')[0],
                            time_slot: "09:00"
                        },
                        {
                            id: 2,
                            room_id: 2,
                            title: "Firmenpräsentation",
                            description: "Präsentation des Jahresberichts",
                            contact_name: "Anna Schmidt",
                            date: new Date().toISOString().split('T')[0],
                            time_slot: "14:00"
                        }
                    ];
                }

                throw error;
            } finally {
                this.loading = false;
            }
        },

        async addBooking(booking) {
            this.loading = true;
            this.error = null;

            try {
                const response = await fetch('/.netlify/functions/bookings', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        roomId: booking.roomId,
                        title: booking.title,
                        description: booking.description,
                        contactName: booking.contactName,
                        date: booking.date,
                        timeSlot: booking.timeSlot
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to add booking');
                }

                const newBooking = await response.json();

                // Add to local state
                this.bookings.push(newBooking);

                return newBooking;
            } catch (error) {
                console.error('Error adding booking:', error);
                this.error = error.message;

                // Fallback für Development
                if (process.env.NODE_ENV === 'development') {
                    console.warn('Development mode: Creating fake booking');
                    const newId = Math.max(0, ...this.bookings.map(b => parseInt(b.id) || 0)) + 1;
                    const newBooking = {
                        id: newId,
                        room_id: booking.roomId,
                        title: booking.title,
                        description: booking.description,
                        contact_name: booking.contactName,
                        date: booking.date,
                        time_slot: booking.timeSlot
                    };
                    this.bookings.push(newBooking);
                    return newBooking;
                }

                throw error;
            } finally {
                this.loading = false;
            }
        },

        async deleteBooking(bookingId) {
            this.loading = true;
            this.error = null;

            try {
                const response = await fetch(`/.netlify/functions/bookings/${bookingId}`, {
                    method: 'DELETE'
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to delete booking');
                }

                // Remove from local state
                this.bookings = this.bookings.filter(booking => booking.id != bookingId);

                return { success: true };
            } catch (error) {
                console.error('Error deleting booking:', error);
                this.error = error.message;
                throw error;
            } finally {
                this.loading = false;
            }
        }
    }
})