// server/scripts/seed.js
import mongoose from 'mongoose'
import Room from '../models/room.model'
import Booking from '../models/booking.model'

/**
 * Seeds database with initial data for development
 * Run with: node server/scripts/seed.js
 */
async function seedDatabase() {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/roombooking'

    try {
        await mongoose.connect(MONGODB_URI)
        console.log('Connected to MongoDB')

        // Clear existing data
        await Room.deleteMany({})
        await Booking.deleteMany({})
        console.log('Cleared existing data')

        // Insert sample rooms
        const roomsData = [
            {
                name: "Jemia",
                capacity: 30,
                location: "Heinrich Lübcke Strasse 2",
                features: ["Beamer", "Whiteboard", "Mikrofone"],
                description: "Ideal für kleinere Team-Meetings und Präsentationen."
            },
            {
                name: "TestRaum 2",
                capacity: 30,
                location: "Gebäude B, 2. Stock",
                features: ["Beamer", "Soundsystem", "Klimaanlage", "Videokonferenz"],
                description: "Großer Konferenzsaal für Firmenpräsentationen und größere Veranstaltungen."
            },
            {
                name: "MeetingRaum 3",
                capacity: 12,
                location: "Gebäude A, 1. Stock",
                features: ["Whiteboard", "Bildschirm", "Klimaanlage"],
                description: "Kleiner Besprechungsraum für Team-Meetings und Diskussionen."
            }
        ]

        const rooms = await Room.insertMany(roomsData)
        console.log(`${rooms.length} rooms inserted`)

        // Insert sample bookings
        const today = new Date().toISOString().split('T')[0]
        const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]

        const bookingsData = [
            {
                roomId: rooms[0]._id,
                title: "Team-Meeting",
                description: "Wöchentliches Team-Meeting",
                contactName: "Max Mustermann",
                date: today,
                timeSlot: "09:00"
            },
            {
                roomId: rooms[0]._id,
                title: "Projekt Besprechung",
                description: "Diskussion über das neue Projekt",
                contactName: "Maria Schmidt",
                date: today,
                timeSlot: "14:00"
            },
            {
                roomId: rooms[1]._id,
                title: "Firmenpräsentation",
                description: "Präsentation des Jahresberichts",
                contactName: "Thomas Weber",
                date: today,
                timeSlot: "11:00"
            },
            {
                roomId: rooms[2]._id,
                title: "Workshop",
                description: "Kreatives Brainstorming",
                contactName: "Julia Meyer",
                date: tomorrow,
                timeSlot: "10:00"
            }
        ]

        const bookings = await Booking.insertMany(bookingsData)
        console.log(`${bookings.length} bookings inserted`)

        console.log('Seed completed successfully')
    } catch (error) {
        console.error('Seed error:', error)
    } finally {
        await mongoose.connection.close()
        console.log('MongoDB connection closed')
    }
}

// Run the seeding
seedDatabase()