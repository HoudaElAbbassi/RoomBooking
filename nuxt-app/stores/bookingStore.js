// nuxt-app/stores/bookingStore.js
import { defineStore } from 'pinia';

export const useBookingStore = defineStore('booking', {
    state: () => ({
        bookings: [],
        timeSlots: [
            "08:00", "09:00", "10:00", "11:00",
            "12:00", "13:00", "14:00", "15:00",
            "16:00", "17:00", "18:00", "19:00",
            "20:00", "21:00", "22:00"
        ],
        loading: false,
        error: null
    }),

    getters: {
        getBookingsForRoomAndDate: (state) => (roomId, date) => {
            return state.bookings.filter(booking => {
                // Handle both PostgreSQL (room_id) and potential MongoDB (roomId) formats
                const bookingRoomId = booking.room_id || booking.roomId;
                const bookingDate = booking.date || booking.booking_date;

                return bookingRoomId == roomId && bookingDate === date;
            });
        },

        isTimeSlotBooked: (state) => (roomId, date, timeSlot) => {
            return state.bookings.some(booking => {
                const bookingRoomId = booking.room_id || booking.roomId;
                const bookingDate = booking.date || booking.booking_date;
                const bookingTimeSlot = booking.time_slot || booking.timeSlot;

                return bookingRoomId == roomId &&
                    bookingDate === date &&
                    bookingTimeSlot === timeSlot;
            });
        },

        // Getter für normalisierte Buchungen (für Kompatibilität)
        normalizedBookings: (state) => {
            return state.bookings.map(booking => ({
                id: booking.id,
                roomId: booking.room_id || booking.roomId,
                title: booking.title,
                description: booking.description || '',
                contactName: booking.contact_name || booking.contactName,
                date: booking.date || booking.booking_date,
                timeSlot: booking.time_slot || booking.timeSlot,
                createdAt: booking.created_at || booking.createdAt
            }));
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

                const url = `/.netlify/functions/bookings${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
                console.log('📡 Fetching bookings from:', url);

                const response = await fetch(url);

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                    throw new Error(`HTTP ${response.status}: ${errorData.error || errorData.details || 'Failed to fetch bookings'}`);
                }

                const data = await response.json();
                console.log('📅 Raw bookings data:', data);

                // Data structure validation and normalization
                if (!Array.isArray(data)) {
                    console.error('❌ Bookings data is not an array:', data);
                    throw new Error('Invalid data format received from server');
                }

                // Log data structure for debugging
                if (data.length > 0) {
                    const firstItem = data[0];
                    console.log('🔍 First booking structure:', {
                        keys: Object.keys(firstItem),
                        hasId: !!firstItem.id,
                        hasRoomId: !!(firstItem.room_id || firstItem.roomId),
                        hasDate: !!(firstItem.date || firstItem.booking_date),
                        hasTimeSlot: !!(firstItem.time_slot || firstItem.timeSlot),
                        sample: firstItem
                    });
                }

                // Update bookings with merge strategy for filtered results
                if (filters.roomId || filters.date) {
                    // Remove existing bookings that match the filter criteria
                    this.bookings = this.bookings.filter(booking => {
                        const bookingRoomId = booking.room_id || booking.roomId;
                        const bookingDate = booking.date || booking.booking_date;

                        if (filters.roomId && filters.date) {
                            return bookingRoomId != filters.roomId || bookingDate !== filters.date;
                        } else if (filters.roomId) {
                            return bookingRoomId != filters.roomId;
                        } else if (filters.date) {
                            return bookingDate !== filters.date;
                        }
                        return true;
                    });

                    // Add the new bookings
                    this.bookings = [...this.bookings, ...data];
                } else {
                    // If no specific filters, replace all bookings
                    this.bookings = data;
                }

                console.log(`✅ Successfully loaded ${data.length} bookings. Total in store: ${this.bookings.length}`);
                return data;

            } catch (error) {
                console.error('❌ Error fetching bookings:', error);
                this.error = error.message;

                // Fallback to sample data only if no bookings exist and no specific filters
                if (this.bookings.length === 0 && !filters.roomId && !filters.date) {
                    console.log('📦 Loading fallback data...');
                    this.bookings = this.getFallbackBookings();
                }

                throw error;
            } finally {
                this.loading = false;
            }
        },

        async addBooking(bookingData) {
            this.loading = true;
            this.error = null;

            try {
                console.log('📝 Adding booking:', bookingData);

                const response = await fetch('/.netlify/functions/bookings', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        roomId: bookingData.roomId,
                        title: bookingData.title,
                        description: bookingData.description || '',
                        contactName: bookingData.contactName,
                        date: bookingData.date,
                        timeSlot: bookingData.timeSlot
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                    throw new Error(errorData.error || errorData.details || 'Failed to add booking');
                }

                const newBooking = await response.json();
                console.log('✅ Booking created:', newBooking);

                // Add to local state
                this.bookings.push(newBooking);

                return newBooking;

            } catch (error) {
                console.error('❌ Error adding booking:', error);
                this.error = error.message;

                // Development fallback
                if (process.client && window.location.hostname === 'localhost') {
                    console.warn('🔧 Development mode: Creating fake booking');
                    const newId = Math.max(0, ...this.bookings.map(b => parseInt(b.id) || 0)) + 1;
                    const newBooking = {
                        id: newId,
                        room_id: bookingData.roomId,
                        title: bookingData.title,
                        description: bookingData.description,
                        contact_name: bookingData.contactName,
                        date: bookingData.date,
                        time_slot: bookingData.timeSlot,
                        created_at: new Date().toISOString()
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
                console.log('🗑️ Deleting booking:', bookingId);

                // Note: This endpoint may not exist yet in your Netlify functions
                // You might need to add DELETE support to your bookings.js function
                const response = await fetch(`/.netlify/functions/bookings?id=${bookingId}`, {
                    method: 'DELETE'
                });

                if (!response.ok && response.status !== 404) {
                    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                    throw new Error(errorData.error || 'Failed to delete booking');
                }

                // Remove from local state regardless of API response
                this.bookings = this.bookings.filter(booking => booking.id != bookingId);
                console.log('✅ Booking deleted from store');

                return { success: true };

            } catch (error) {
                console.error('❌ Error deleting booking:', error);
                this.error = error.message;

                // Still remove from local state in development
                if (process.client && window.location.hostname === 'localhost') {
                    this.bookings = this.bookings.filter(booking => booking.id != bookingId);
                    console.log('🔧 Development: Removed booking from store anyway');
                    return { success: true };
                }

                throw error;
            } finally {
                this.loading = false;
            }
        },

        // Fallback data for development/offline mode
        getFallbackBookings() {
            const today = new Date().toISOString().split('T')[0];
            const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

            return [
                {
                    id: 1,
                    room_id: 1,
                    title: "Team-Meeting",
                    description: "Wöchentliches Team-Meeting",
                    contact_name: "Max Mustermann",
                    date: today,
                    time_slot: "09:00",
                    created_at: new Date().toISOString()
                },
                {
                    id: 2,
                    room_id: 1,
                    title: "Projekt Besprechung",
                    description: "Diskussion über das neue Projekt",
                    contact_name: "Maria Schmidt",
                    date: today,
                    time_slot: "14:00",
                    created_at: new Date().toISOString()
                },
                {
                    id: 3,
                    room_id: 2,
                    title: "Firmenpräsentation",
                    description: "Präsentation des Jahresberichts",
                    contact_name: "Thomas Weber",
                    date: today,
                    time_slot: "11:00",
                    created_at: new Date().toISOString()
                },
                {
                    id: 4,
                    room_id: 1,
                    title: "Workshop",
                    description: "Kreatives Brainstorming",
                    contact_name: "Julia Meyer",
                    date: tomorrow,
                    time_slot: "10:00",
                    created_at: new Date().toISOString()
                }
            ];
        },

        // Helper method to clear all data (useful for logout)
        clearData() {
            this.bookings = [];
            this.error = null;
            this.loading = false;
        }
    }
})