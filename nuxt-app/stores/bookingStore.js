// stores/bookingStore.js
import { defineStore } from 'pinia';
import {toObjectId} from "~~/server/utils/mongodb.js";

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
                booking.roomId === roomId && booking.date === date
            );
        },

        isTimeSlotBooked: (state) => (roomId, date, timeSlot) => {
            return state.bookings.some(booking =>
                booking.roomId === roomId &&
                booking.date === date &&
                booking.timeSlot === timeSlot
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

                // Make the API call
                const response = await fetch(`/api/bookings?${queryParams}`);

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.statusMessage || 'Failed to fetch bookings');
                }

                const data = await response.json();

                // If specific filters are provided, only update the relevant bookings
                if (filters.roomId || filters.date) {
                    // Remove existing bookings that match the filter criteria
                    this.bookings = this.bookings.filter(booking => {
                        if (filters.roomId && filters.date) {
                            return booking.roomId !== filters.roomId || booking.date !== filters.date;
                        } else if (filters.roomId) {
                            return booking.roomId !== filters.roomId;
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
                this.error = error.message || 'Failed to fetch bookings';

                // If the API call fails, use fallback data
                if (this.bookings.length === 0 && !filters.roomId && !filters.date) {
                    this.bookings = [
                        {
                            _id: '1',
                            roomId: '1',
                            title: "Team-Meeting",
                            description: "Wöchentliches Team-Meeting",
                            contactName: "Max Mustermann",
                            date: "2025-05-02", // Using current date
                            timeSlot: "09:00"
                        },
                        {
                            _id: '2',
                            roomId: '2',
                            title: "Firmenpräsentation",
                            description: "Präsentation des Jahresberichts",
                            contactName: "Anna Schmidt",
                            date: "2025-05-02", // Using current date
                            timeSlot: "14:00"
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
            const formattedBooking = {
                ...booking,
                roomId: booking.roomId.includes('-') ? booking.roomId : toObjectId(booking.roomId)
            };

            try {
                const response = await fetch('/api/bookings', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formattedBooking)
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.statusMessage || 'Failed to add booking');
                }

                const newBooking = await response.json();


                // Add to local state
                this.bookings.push(newBooking);

                return newBooking;
            } catch (error) {
                console.error('Error adding booking:', error);
                this.error = error.message || 'Failed to add booking';

                // If in development mode, create a fake booking with an ID
                if (process.env.NODE_ENV === 'development') {
                    console.warn('Development mode: Creating fake booking');
                    const newId = Math.max(0, ...this.bookings.map(b => parseInt(b._id) || 0)) + 1;
                    const newBooking = {
                        _id: newId.toString(),
                        ...booking
                    };
                    this.bookings.push(newBooking);
                    return newBooking;
                }

                throw error;
            } finally {ç
                this.loading = false;
            }
        },

        async deleteBooking(bookingId) {
            this.loading = true;
            this.error = null;

            try {
                const response = await fetch(`/api/bookings/${bookingId}`, {
                    method: 'DELETE'
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.statusMessage || 'Failed to delete booking');
                }

                // Remove from local state
                this.bookings = this.bookings.filter(booking => booking._id !== bookingId);

                return { success: true };
            } catch (error) {
                console.error('Error deleting booking:', error);
                this.error = error.message || 'Failed to delete booking';
                throw error;
            } finally {
                this.loading = false;
            }
        }
    }
})