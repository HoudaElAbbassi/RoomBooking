// server/plugins/db-init.js
import { MongoClient } from 'mongodb'

export default defineNitroPlugin(async () => {
    if (process.env.NODE_ENV === 'development') {
        console.log('Initialisierung der Datenbank für Entwicklungsumgebung...')

        try {
            const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017'
            const DB_NAME = 'VestRoom_volumedish'

            const client = new MongoClient(MONGODB_URI)
            await client.connect()

            const db = client.db(DB_NAME)

            // Collections auflisten
            const collections = await db.listCollections().toArray()
            const collectionNames = collections.map(c => c.name)

            console.log('Vorhandene Collections:', collectionNames)

            // Räume-Collection initialisieren, falls leer
            if (collectionNames.includes('rooms')) {
                const roomCount = await db.collection('rooms').countDocuments()

                if (roomCount === 0) {
                    console.log('Füge Beispielräume hinzu...')
                    await db.collection('rooms').insertMany([
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
                        }
                    ])
                }
            } else {
                // Collection erstellen und Beispielräume hinzufügen
                console.log('Erstelle rooms Collection...')
                await db.createCollection('rooms')

                console.log('Füge Beispielräume hinzu...')
                await db.collection('rooms').insertMany([
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
                    }
                ])
            }

            // Buchungen-Collection initialisieren, falls nicht vorhanden
            if (!collectionNames.includes('bookings')) {
                console.log('Erstelle bookings Collection...')
                await db.createCollection('bookings')
            }

            await client.close()
            console.log('Datenbankinitialisierung abgeschlossen.')
        } catch (error) {
            console.error('Fehler bei der Datenbankinitialisierung:', error)
        }
    }
})