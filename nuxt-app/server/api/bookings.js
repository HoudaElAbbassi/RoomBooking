// server/api/bookings.js
import { MongoClient } from 'mongodb'

export default defineEventHandler(async (event) => {
    const method = getMethod(event)

    // Handle POST request
    if (method === 'POST') {
        const body = await readBody(event)

        // Validierung
        if (!body.roomId || !body.date || !body.timeSlot || !body.title || !body.contactName) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Fehlende Pflichtfelder'
            })
        }

        try {
            // MongoDB Connection
            const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017')
            await client.connect()

            const db = client.db('raumbelegung')
            const collection = db.collection('bookings')

            // Prüfen, ob der Zeitslot bereits gebucht ist
            const existingBooking = await collection.findOne({
                roomId: body.roomId,
                date: body.date,
                timeSlot: body.timeSlot
            })

            if (existingBooking) {
                await client.close()
                throw createError({
                    statusCode: 409,
                    statusMessage: 'Dieser Zeitslot ist bereits belegt'
                })
            }

            // Speichern der neuen Buchung
            const result = await collection.insertOne({
                roomId: body.roomId,
                date: body.date,
                timeSlot: body.timeSlot,
                title: body.title,
                description: body.description || '',
                contactName: body.contactName,
                createdAt: new Date()
            })

            // Buchung mit ID zurückgeben
            const savedBooking = await collection.findOne({ _id: result.insertedId })
            await client.close()

            return savedBooking
        } catch (error) {
            // Wenn es ein Fehler ist, den wir schon geworfen haben, leiten wir ihn weiter
            if (error.statusCode) {
                throw error
            }

            console.error('MongoDB Error:', error)

            // Sonst werfen wir einen allgemeinen Fehler
            throw createError({
                statusCode: 500,
                statusMessage: 'Datenbank-Fehler'
            })
        }
    }
    // Handle GET request
    else if (method === 'GET') {
        try {
            // MongoDB Connection
            const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017')
            await client.connect()

            const db = client.db('raumbelegung')
            const collection = db.collection('bookings')

            // Query-Parameter auslesen (für Filterung nach Raum oder Datum)
            const query = getQuery(event)
            const filter = {}

            if (query.roomId) {
                filter.roomId = query.roomId
            }

            if (query.date) {
                filter.date = query.date
            }

            // Alle Buchungen abrufen (mit optionalem Filter)
            const bookings = await collection.find(filter).toArray()
            await client.close()

            return bookings
        } catch (error) {
            console.error('MongoDB Error:', error)

            // Fallback: Lokale Testdaten zurückgeben
            return [
                {
                    id: 1,
                    roomId: 1,
                    title: "Team-Meeting",
                    description: "Wöchentliches Team-Meeting",
                    contactName: "Max Mustermann",
                    date: "2025-04-24",
                    timeSlot: "09:00"
                },
                {
                    id: 2,
                    roomId: 2,
                    title: "Firmenpräsentation",
                    description: "Präsentation des Jahresberichts",
                    contactName: "Anna Schmidt",
                    date: "2025-04-24",
                    timeSlot: "14:00"
                }
            ]
        }
    }
})