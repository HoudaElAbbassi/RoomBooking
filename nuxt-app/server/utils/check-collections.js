// server/utils/check-collections.js
import { MongoClient } from 'mongodb'

// MongoDB Connection URI mit dem korrekten Datenbanknamen
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017'
const DB_NAME = 'VestRoom_volumedish'

// Hilfsfunktion zum Überprüfen der vorhandenen Collections
export async function checkCollections() {
    try {
        const client = new MongoClient(MONGODB_URI)
        await client.connect()

        const db = client.db(DB_NAME)

        // Alle Collections in der Datenbank abrufen
        const collections = await db.listCollections().toArray()

        console.log('Vorhandene Collections in der Datenbank:', DB_NAME)
        collections.forEach(collection => {
            console.log(`- ${collection.name}`)
        })

        // Prüfen, ob die benötigten Collections existieren
        const hasRoomsCollection = collections.some(c => c.name === 'rooms')
        const hasBookingsCollection = collections.some(c => c.name === 'bookings')

        console.log('\nStatus der benötigten Collections:')
        console.log(`- rooms: ${hasRoomsCollection ? 'Vorhanden' : 'Nicht vorhanden'}`)
        console.log(`- bookings: ${hasBookingsCollection ? 'Vorhanden' : 'Nicht vorhanden'}`)

        // Collections erstellen, falls sie nicht existieren
        if (!hasRoomsCollection) {
            console.log('\nErstelle "rooms" Collection...')
            await db.createCollection('rooms')
        }

        if (!hasBookingsCollection) {
            console.log('\nErstelle "bookings" Collection...')
            await db.createCollection('bookings')
        }

        await client.close()

        return {
            hasRoomsCollection,
            hasBookingsCollection,
            allCollections: collections.map(c => c.name)
        }
    } catch (error) {
        console.error('Fehler beim Überprüfen der Collections:', error)
        throw error
    }
}

// Diese Funktion kann aufgerufen werden, um die Collections zu überprüfen
// checkCollections().then(result => console.log(result))