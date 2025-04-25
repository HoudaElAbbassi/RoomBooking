// stores/roomStore.js
import { defineStore } from 'pinia'

export const useRoomStore = defineStore('room', {
    state: () => ({
        rooms: [
            {
                id: 1,
                name: "Jemia",
                capacity: 30,
                location: "Heinrich Lübcke Strasse 2",
                features: ["Beamer", "Whiteboard", "Mikrofone"],
                description: "Ideal für kleinere Team-Meetings und Präsentationen."
            },
            {
                id: 2,
                name: "TestRaum 2",
                capacity: 30,
                location: "Gebäude B, 2. Stock",
                features: ["Beamer", "Soundsystem", "Klimaanlage", "Videokonferenz"],
                description: "Großer Konferenzsaal für Firmenpräsentationen und größere Veranstaltungen."
            }
        ],
        selectedRoomId: 1
    }),

    getters: {
        getSelectedRoom() {
            return this.rooms.find(room => room.id === this.selectedRoomId)
        }
    },

    actions: {
        selectRoom(roomId) {
            this.selectedRoomId = roomId
        }
    }
})