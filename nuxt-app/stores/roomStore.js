// stores/roomStore.js
import { defineStore } from 'pinia'

export const useRoomStore = defineStore('room', {
    state: () => ({
        rooms: [
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
        ],
        selectedRoomId: '1',
        loading: false,
        error: null
    }),

    getters: {
        getSelectedRoom() {
            return this.rooms.find(room => room._id === this.selectedRoomId)
        }
    },

    actions: {
        // Add the fetchRooms method
        async fetchRooms() {
            this.loading = true;
            this.error = null;

            try {
                // For now, just simulate an API call with the hardcoded data
                // Later this will be replaced with a real API call to MongoDB
                console.log('Fetching rooms...');

                // We're not making a real API call yet since MongoDB isn't connected
                // The rooms are already loaded in the state

                // If MongoDB connection is set up, replace with:
                // const response = await fetch('/api/rooms');
                // const data = await response.json();
                // this.rooms = data;

                // Simulate a short delay
                await new Promise(resolve => setTimeout(resolve, 300));

                return this.rooms;
            } catch (error) {
                console.error('Error fetching rooms:', error);
                this.error = error.message || 'Failed to fetch rooms';
                throw error;
            } finally {
                this.loading = false;
            }
        },

        selectRoom(roomId) {
            this.selectedRoomId = roomId
        }
    }
})