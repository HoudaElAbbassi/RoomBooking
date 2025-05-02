// stores/roomStore.js
import { defineStore } from 'pinia'

export const useRoomStore = defineStore('room', {
    state: () => ({
        rooms: [],
        selectedRoomId: null,
        loading: false,
        error: null
    }),

    getters: {
        getSelectedRoom() {
            return this.rooms.find(room => room._id === this.selectedRoomId)
        }
    },

    actions: {
        async fetchRooms() {
            this.loading = true;
            this.error = null;

            try {
                // Make a real API call to the MongoDB backend
                const response = await fetch('/api/rooms');

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.statusMessage || 'Failed to fetch rooms');
                }

                const data = await response.json();
                this.rooms = data;

                // Set default selected room if none is selected
                if (this.rooms.length > 0 && !this.selectedRoomId) {
                    this.selectedRoomId = this.rooms[0]._id;
                }

                return this.rooms;
            } catch (error) {
                console.error('Error fetching rooms:', error);
                this.error = error.message || 'Failed to fetch rooms';

                // Fallback to sample data if API fails
                if (this.rooms.length === 0) {
                    this.rooms = [
                        {
                            _id: '1',
                            name: "Jemia",
                            capacity: 30,
                            location: "Heinrich Lübcke Strasse 2",
                            features: ["Beamer", "Whiteboard", "Mikrofone"],
                            description: "Ideal für kleinere Team-Meetings und Präsentationen."
                        },
                        {
                            _id: '2',
                            name: "TestRaum 2",
                            capacity: 30,
                            location: "Gebäude B, 2. Stock",
                            features: ["Beamer", "Soundsystem", "Klimaanlage", "Videokonferenz"],
                            description: "Großer Konferenzsaal für Firmenpräsentationen und größere Veranstaltungen."
                        }
                    ];

                    if (!this.selectedRoomId) {
                        this.selectedRoomId = '1';
                    }
                }

                throw error;
            } finally {
                this.loading = false;
            }
        },

        async addRoom(roomData) {
            this.loading = true;
            this.error = null;

            try {
                const response = await fetch('/api/rooms', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(roomData)
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.statusMessage || 'Failed to add room');
                }

                const newRoom = await response.json();
                this.rooms.push(newRoom);
                return newRoom;
            } catch (error) {
                console.error('Error adding room:', error);
                this.error = error.message || 'Failed to add room';
                throw error;
            } finally {
                this.loading = false;
            }
        },

        selectRoom(roomId) {
            this.selectedRoomId = roomId;
        }
    }
})