// nuxt-app/stores/bookingStore.js - Extended version with time ranges and recurring bookings
import { defineStore } from 'pinia';

export const useBookingStore = defineStore('booking', {
    state: () => ({
        bookings: [],
        timeSlots: [
            "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
            "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
            "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
            "17:00", "17:30", "18:00", "18:30", "19:00", "19:30",
            "20:00", "20:30", "21:00", "21:30", "22:00"
        ],
        loading: false,
        error: null
    }),

    getters: {
        getBookingsForRoomAndDate: (state) => (roomId, date) => {
            return state.bookings.filter(booking => {
                const bookingRoomId = booking.room_id || booking.roomId;
                const bookingDate = booking.date || booking.booking_date;

                return bookingRoomId == roomId && bookingDate === date;
            });
        },

        // Enhanced time slot checking with time ranges
        isTimeSlotBooked: (state) => (roomId, date, timeSlot) => {
            return state.bookings.some(booking => {
                const bookingRoomId = booking.room_id || booking.roomId;
                const bookingDate = booking.date || booking.booking_date;
                const startTime = booking.start_time || booking.timeSlot || booking.time_slot;
                const endTime = booking.end_time || booking.endTime;

                // If no end time, assume 1-hour booking
                const effectiveEndTime = endTime || addHourToTime(startTime);

                return bookingRoomId == roomId &&
                    bookingDate === date &&
                    timeSlot >= startTime &&
                    timeSlot < effectiveEndTime;
            });
        },

        // Check for time range conflicts
        hasTimeConflict: (state) => (roomId, date, startTime, endTime, excludeId = null) => {
            return state.bookings.some(booking => {
                if (excludeId && booking.id === excludeId) return false;

                const bookingRoomId = booking.room_id || booking.roomId;
                const bookingDate = booking.date || booking.booking_date;
                const bookingStartTime = booking.start_time || booking.timeSlot || booking.time_slot;
                const bookingEndTime = booking.end_time || booking.endTime || addHourToTime(bookingStartTime);

                return bookingRoomId == roomId &&
                    bookingDate === date &&
                    startTime < bookingEndTime &&
                    endTime > bookingStartTime;
            });
        },

        // Get recurring bookings
        getRecurringBookings: (state) => {
            return state.bookings.filter(booking => booking.is_recurring === true);
        },

        // Get child bookings of a recurring series
        getChildBookings: (state) => (parentId) => {
            return state.bookings.filter(booking => booking.parent_booking_id === parentId);
        },

        // Enhanced normalized bookings with time range support
        normalizedBookings: (state) => {
            return state.bookings.map(booking => ({
                id: booking.id,
                roomId: booking.room_id || booking.roomId,
                title: booking.title,
                description: booking.description || '',
                contactName: booking.contact_name || booking.contactName,
                date: booking.date || booking.booking_date,
                startTime: booking.start_time || booking.timeSlot || booking.time_slot,
                endTime: booking.end_time || booking.endTime,
                timeSlot: booking.start_time || booking.timeSlot || booking.time_slot, // Backward compatibility
                isRecurring: booking.is_recurring || false,
                recurrenceType: booking.recurrence_type,
                recurrenceEndDate: booking.recurrence_end_date,
                parentBookingId: booking.parent_booking_id,
                bookingType: booking.booking_type || (booking.is_recurring ? 'parent' : 'single'),
                durationHours: booking.duration_hours || 1,
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
                if (filters.includeRecurring !== undefined) queryParams.append('includeRecurring', filters.includeRecurring);

                const url = `/.netlify/functions/bookings${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
                console.log('📡 Fetching enhanced bookings from:', url);

                const response = await fetch(url);

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                    throw new Error(`HTTP ${response.status}: ${errorData.error || errorData.details || 'Failed to fetch bookings'}`);
                }

                const data = await response.json();
                console.log('📅 Enhanced bookings data received:', data.length, 'bookings');

                if (!Array.isArray(data)) {
                    console.error('❌ Bookings data is not an array:', data);
                    throw new Error('Invalid data format received from server');
                }

                // Log enhanced data structure for debugging
                if (data.length > 0) {
                    const firstItem = data[0];
                    console.log('🔍 Enhanced booking structure:', {
                        hasId: !!firstItem.id,
                        hasRoomId: !!(firstItem.room_id || firstItem.roomId),
                        hasDate: !!(firstItem.date || firstItem.booking_date),
                        hasStartTime: !!(firstItem.start_time || firstItem.timeSlot || firstItem.time_slot),
                        hasEndTime: !!(firstItem.end_time || firstItem.endTime),
                        hasRecurring: firstItem.hasOwnProperty('is_recurring'),
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

                console.log(`✅ Successfully loaded ${data.length} enhanced bookings. Total in store: ${this.bookings.length}`);
                return data;

            } catch (error) {
                console.error('❌ Error fetching enhanced bookings:', error);
                this.error = error.message;

                // Fallback to sample data only if no bookings exist and no specific filters
                if (this.bookings.length === 0 && !filters.roomId && !filters.date) {
                    console.log('📦 Loading enhanced fallback data...');
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
                console.log('📝 Adding enhanced booking:', bookingData);

                const payload = {
                    roomId: bookingData.roomId,
                    title: bookingData.title,
                    description: bookingData.description || '',
                    contactName: bookingData.contactName,
                    date: bookingData.date,
                    startTime: bookingData.startTime,
                    endTime: bookingData.endTime,
                    // Handle backward compatibility
                    timeSlot: bookingData.timeSlot || bookingData.startTime,
                    // Recurring options
                    isRecurring: bookingData.isRecurring || false,
                    recurrenceType: bookingData.recurrenceType || null,
                    recurrenceEndDate: bookingData.recurrenceEndDate || null
                };

                const response = await fetch('/.netlify/functions/bookings', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                    throw new Error(errorData.error || errorData.details || 'Failed to add booking');
                }

                const newBooking = await response.json();
                console.log('✅ Enhanced booking created:', newBooking);

                // Add to local state
                this.bookings.push(newBooking);

                // If recurring, fetch updated bookings to get all instances
                if (bookingData.isRecurring && newBooking.recurring_created > 0) {
                    console.log(`🔄 Fetching ${newBooking.total_bookings} recurring bookings...`);
                    await this.fetchBookings();
                }

                return newBooking;

            } catch (error) {
                console.error('❌ Error adding enhanced booking:', error);
                this.error = error.message;

                // Development fallback for enhanced bookings
                if (process.client && window.location.hostname === 'localhost') {
                    console.warn('🔧 Development mode: Creating fake enhanced booking');
                    const newId = Math.max(0, ...this.bookings.map(b => parseInt(b.id) || 0)) + 1;
                    const newBooking = {
                        id: newId,
                        room_id: bookingData.roomId,
                        title: bookingData.title,
                        description: bookingData.description,
                        contact_name: bookingData.contactName,
                        booking_date: bookingData.date,
                        start_time: bookingData.startTime,
                        end_time: bookingData.endTime,
                        is_recurring: bookingData.isRecurring || false,
                        recurrence_type: bookingData.recurrenceType,
                        recurrence_end_date: bookingData.recurrenceEndDate,
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

        async updateBooking(bookingId, bookingData) {
            this.loading = true;
            this.error = null;

            try {
                console.log('📝 Updating booking:', bookingId, bookingData);

                const payload = {
                    roomId: bookingData.roomId,
                    title: bookingData.title,
                    description: bookingData.description || '',
                    contactName: bookingData.contactName,
                    date: bookingData.date,
                    startTime: bookingData.startTime,
                    endTime: bookingData.endTime,
                    isRecurring: bookingData.isRecurring || false,
                    recurrenceType: bookingData.recurrenceType || null,
                    recurrenceEndDate: bookingData.recurrenceEndDate || null
                };

                const response = await fetch(`/.netlify/functions/bookings?id=${bookingId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                    throw new Error(errorData.error || 'Failed to update booking');
                }

                const updatedBooking = await response.json();
                console.log('✅ Booking updated:', updatedBooking);

                // Update in local state
                const index = this.bookings.findIndex(b => b.id == bookingId);
                if (index !== -1) {
                    this.bookings[index] = updatedBooking;
                }

                return updatedBooking;

            } catch (error) {
                console.error('❌ Error updating booking:', error);
                this.error = error.message;
                throw error;
            } finally {
                this.loading = false;
            }
        },

        async deleteBooking(bookingId, deleteRecurring = false) {
            this.loading = true;
            this.error = null;

            try {
                console.log('🗑️ Deleting booking:', bookingId, 'deleteRecurring:', deleteRecurring);

                const response = await fetch(`/.netlify/functions/bookings?id=${bookingId}&deleteRecurring=${deleteRecurring}`, {
                    method: 'DELETE'
                });

                if (!response.ok && response.status !== 404) {
                    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                    throw new Error(errorData.error || 'Failed to delete booking');
                }

                const result = await response.json();
                console.log('✅ Booking(s) deleted:', result);

                // Remove from local state
                if (deleteRecurring) {
                    // Remove all related bookings (parent and children)
                    this.bookings = this.bookings.filter(booking =>
                        booking.id != bookingId && booking.parent_booking_id != bookingId
                    );
                } else {
                    // Remove only the specific booking
                    this.bookings = this.bookings.filter(booking => booking.id != bookingId);
                }

                return result;

            } catch (error) {
                console.error('❌ Error deleting booking:', error);
                this.error = error.message;

                // Still remove from local state in development
                if (process.client && window.location.hostname === 'localhost') {
                    if (deleteRecurring) {
                        this.bookings = this.bookings.filter(booking =>
                            booking.id != bookingId && booking.parent_booking_id != bookingId
                        );
                    } else {
                        this.bookings = this.bookings.filter(booking => booking.id != bookingId);
                    }
                    console.log('🔧 Development: Removed booking from store anyway');
                    return { success: true, deletedCount: 1 };
                }

                throw error;
            } finally {
                this.loading = false;
            }
        },

        // Enhanced fallback data with time ranges and recurring bookings
        getFallbackBookings() {
            const today = new Date().toISOString().split('T')[0];
            const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
            const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

            return [
                {
                    id: 1,
                    room_id: 1,
                    title: "Team-Meeting",
                    description: "Wöchentliches Team-Meeting mit Retrospektive",
                    contact_name: "Max Mustermann",
                    booking_date: today,
                    start_time: "09:00",
                    end_time: "10:30",
                    is_recurring: true,
                    recurrence_type: "weekly",
                    recurrence_end_date: "2025-12-31",
                    booking_type: "parent",
                    duration_hours: 1.5,
                    created_at: new Date().toISOString()
                },
                {
                    id: 2,
                    room_id: 1,
                    title: "Projekt Besprechung",
                    description: "Diskussion über das neue Projekt",
                    contact_name: "Maria Schmidt",
                    booking_date: today,
                    start_time: "14:00",
                    end_time: "15:30",
                    is_recurring: false,
                    booking_type: "single",
                    duration_hours: 1.5,
                    created_at: new Date().toISOString()
                },
                {
                    id: 3,
                    room_id: 2,
                    title: "Ganztags Workshop",
                    description: "Design Thinking Workshop für das gesamte Team",
                    contact_name: "Thomas Weber",
                    booking_date: tomorrow,
                    start_time: "09:00",
                    end_time: "17:00",
                    is_recurring: false,
                    booking_type: "single",
                    duration_hours: 8,
                    created_at: new Date().toISOString()
                },
                {
                    id: 4,
                    room_id: 1,
                    title: "Daily Standup",
                    description: "Tägliches Standup Meeting",
                    contact_name: "Julia Meyer",
                    booking_date: today,
                    start_time: "08:30",
                    end_time: "09:00",
                    is_recurring: true,
                    recurrence_type: "daily",
                    recurrence_end_date: "2025-12-31",
                    booking_type: "parent",
                    duration_hours: 0.5,
                    created_at: new Date().toISOString()
                },
                {
                    id: 5,
                    room_id: 2,
                    title: "Client Präsentation",
                    description: "Präsentation des Projektstatus für den Kunden",
                    contact_name: "Anna Weber",
                    booking_date: nextWeek,
                    start_time: "10:00",
                    end_time: "12:00",
                    is_recurring: false,
                    booking_type: "single",
                    duration_hours: 2,
                    created_at: new Date().toISOString()
                }
            ];
        },

        // Helper method to clear all data (useful for logout)
        clearData() {
            this.bookings = [];
            this.error = null;
            this.loading = false;
        },

        // Utility methods for time handling
        formatTime(timeString) {
            return formatTimeSlot(timeString);
        },

        parseTimeSlot(timeString) {
            return formatTimeSlot(timeString);
        },

        calculateDuration(startTime, endTime) {
            if (!startTime || !endTime) return 1;

            const start = new Date(`2000-01-01T${startTime}:00`);
            const end = new Date(`2000-01-01T${endTime}:00`);

            return (end - start) / (1000 * 60 * 60); // Duration in hours
        },

        // Generate time slots for a given duration
        getTimeSlotRange(startTime, durationHours) {
            const startIndex = this.timeSlots.indexOf(startTime);
            if (startIndex === -1) return [startTime];

            const slotsNeeded = Math.ceil(durationHours * 2); // 30-minute intervals
            const endIndex = Math.min(startIndex + slotsNeeded, this.timeSlots.length);

            return this.timeSlots.slice(startIndex, endIndex);
        },

        // Check if a booking spans multiple time slots
        isMultiSlotBooking(booking) {
            const startTime = booking.start_time || booking.timeSlot || booking.time_slot;
            const endTime = booking.end_time || booking.endTime;

            if (!startTime || !endTime) return false;

            const startIndex = this.timeSlots.indexOf(startTime);
            const endIndex = this.timeSlots.indexOf(endTime);

            return startIndex !== -1 && endIndex !== -1 && (endIndex - startIndex) > 1;
        }
    }
})

// Helper function for time formatting (same as in other files)
function formatTimeSlot(timeValue) {
    if (!timeValue) return null;

    if (typeof timeValue === 'string' && timeValue.match(/^\d{2}:\d{2}$/)) {
        return timeValue;
    }

    if (typeof timeValue === 'object' && timeValue !== null) {
        const hours = String(timeValue.hours || timeValue.hour || 0).padStart(2, '0');
        const minutes = String(timeValue.minutes || timeValue.minute || 0).padStart(2, '0');
        return `${hours}:${minutes}`;
    }

    if (typeof timeValue === 'string') {
        const match = timeValue.match(/(\d{1,2}):?(\d{2})?/);
        if (match) {
            const hours = String(match[1]).padStart(2, '0');
            const minutes = String(match[2] || '00').padStart(2, '0');
            return `${hours}:${minutes}`;
        }
    }

    return String(timeValue);
}

// Helper function to add time
function addHourToTime(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    const newHours = (hours + 1) % 24;
    return `${String(newHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}