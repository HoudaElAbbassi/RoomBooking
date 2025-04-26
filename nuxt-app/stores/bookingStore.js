// stores/bookingStore.js
import { defineStore } from 'pinia'

export const useBookingStore = defineStore('booking', {
    state: () => ({
        bookings: [
            {
                _id: '1',
                roomId: '1',
                title: "Team-Meeting",
                description: "Wöchentliches Team-Meeting",
                contactName: "Max Mustermann",
                date: "2025-04-24",
                timeSlot: "09:00"
            },
            {
                _id: '2',
                roomId: '2',
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
        ],
        loading: false,
        error: null
    }),

    getters: {
        getBookingsForRoomAndDate: (state) => (roomId, date) => {
            return state.bookings.filter(booking =>
                booking.roomId === roomId && booking.date === date
            )
        },

        isTimeSlotBooked: (state) => (roomId, date, timeSlot) => {
            return state.bookings.some(booking =>
                booking.roomId === roomId &&
                booking.date === date &&
                booking.timeSlot === timeSlot
            )
        }
    },

    actions: {
        // Add the fetchBookings method
        async fetchBookings(filters = {}) {
            this.loading = true;
            this.error = null;

            try {
                // For now, just simulate an API call with the hardcoded data
                console.log('Fetching bookings with filters:', filters);

                // We're not making a real API call yet since MongoDB isn't connected
                // Filter the existing bookings based on the provided filters
                let filteredBookings = [...this.bookings];

                if (filters.roomId) {
                    filteredBookings = filteredBookings.filter(booking =>
                        booking.roomId === filters.roomId
                    );
                }

                if (filters.date) {
                    filteredBookings = filteredBookings.filter(booking =>
                        booking.date === filters.date
                    );
                }

                // Simulate a short delay
                await new Promise(resolve => setTimeout(resolve, 300));

                // In a real implementation with MongoDB, replace with:
                // const queryParams = new URLSearchParams();
                // if (filters.roomId) queryParams.append('roomId', filters.roomId);
                // if (filters.date) queryParams.append('date', filters.date);
                // const response = await fetch(`/api/bookings?${queryParams}`);
                // const data = await response.json();
                // this.bookings = data;

                return filteredBookings;
            } catch (error) {
                console.error('Error fetching bookings:', error);
                this.error = error.message || 'Failed to fetch bookings';
                throw error;
            } finally {
                this.loading = false;
            }
        },

        async addBooking(booking) {
            this.loading = true;
            this.error = null;

            try {
                console.log('Adding booking:', booking);

                // Create a new booking with a generated ID
                const newId = Math.max(0, ...this.bookings.map(b => parseInt(b._id) || 0)) + 1;
                const newBooking = {
                    _id: newId.toString(),
                    ...booking
                };

                // In a real implementation with MongoDB, replace with:
                // const response = await fetch('/api/bookings', {
                //     method: 'POST',
                //     headers: { 'Content-Type': 'application/json' },
                //     body: JSON.stringify(booking)
                // });
                // const newBooking = await response.json();

                // Add to local state
                this.bookings.push(newBooking);

                // Simulate a short delay
                await new Promise(resolve => setTimeout(resolve, 300));

                return newBooking;
            } catch (error) {
                console.error('Error adding booking:', error);
                this.error = error.message || 'Failed to add booking';
                throw error;
            } finally {
                this.loading = false;
            }
        },

        // Keep backward compatibility
        loadFromLocalStorage() {
            console.log('Bookings loaded (compatibility method)')
        }
    }
})