// server/api/rooms.js
import { MongoClient } from 'mongodb'

export default defineEventHandler(async (event) => {
    try {
        // MongoDB Connection
        const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017')
        await client.connect()

        const db = client.db('raumbelegung')
        const collection = db.collection('rooms')

        // Alle Räume abrufen
        const rooms = await collection.find().toArray()
        await client.close()

        return rooms
    } catch (error) {
        console.error('MongoDB Error:', error)

        // Fallback: Lokale Testdaten zurückgeben
        return [
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
        ]
    }
})