// nuxt-app/server/api/room-availability.get.js
import { Pool } from 'pg'

// Database pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false,
        require: true
    },
    max: 1,
    min: 0
})

// Hilfsfunktion: Überprüfe Raumverfügbarkeit
function isRoomAvailable(room, date, timeSlot) {
    // Wenn keine Verfügbarkeitsregeln oder "always_available"
    if (!room.availability_rules || room.availability_rules.type === 'always_available') {
        return true
    }

    // Für zeitbeschränkte Räume
    if (room.availability_rules.type === 'time_restricted') {
        const requestDate = new Date(date)
        const dayOfWeek = requestDate.getDay() // 0=Sonntag, 1=Montag, ..., 6=Samstag
        const requestTime = timeSlot

        // Prüfe alle Verfügbarkeitsregeln
        const rules = room.availability_rules.rules || []

        for (const rule of rules) {
            if (rule.day === dayOfWeek) {
                if (requestTime >= rule.start_time && requestTime <= rule.end_time) {
                    return true
                }
            }
        }

        return false // Nicht in verfügbaren Zeitfenstern
    }

    return false // Unbekannter Regeltyp
}

// Hilfsfunktion: Hole verfügbare Zeitslots für einen Raum
function getAvailableTimeSlots(room, date) {
    const allTimeSlots = [
        "08:00", "09:00", "10:00", "11:00",
        "12:00", "13:00", "14:00", "15:00",
        "16:00", "17:00", "18:00", "19:00",
        "20:00", "21:00", "22:00"
    ]

    // Wenn immer verfügbar, gib alle Zeitslots zurück
    if (!room.availability_rules || room.availability_rules.type === 'always_available') {
        return allTimeSlots
    }

    // Für zeitbeschränkte Räume
    if (room.availability_rules.type === 'time_restricted') {
        const requestDate = new Date(date)
        const dayOfWeek = requestDate.getDay()
        const availableSlots = []

        const rules = room.availability_rules.rules || []

        for (const timeSlot of allTimeSlots) {
            for (const rule of rules) {
                if (rule.day === dayOfWeek) {
                    if (timeSlot >= rule.start_time && timeSlot <= rule.end_time) {
                        availableSlots.push(timeSlot)
                        break // Zeitslot gefunden, weiter zum nächsten
                    }
                }
            }
        }

        return availableSlots
    }

    return [] // Kein verfügbarer Zeitslot
}

export default defineEventHandler(async (event) => {
    if (getMethod(event) !== 'GET') {
        throw createError({
            statusCode: 405,
            statusMessage: 'Method not allowed'
        })
    }

    const { roomId, date, timeSlot } = getQuery(event)

    if (!roomId) {
        throw createError({
            statusCode: 400,
            statusMessage: 'roomId is required'
        })
    }

    let client
    try {
        client = await pool.connect()

        // Hole Rauminformationen
        const roomResult = await client.query(
            'SELECT id, name, availability_rules FROM rooms WHERE id = $1',
            [parseInt(roomId)]
        )

        if (roomResult.rows.length === 0) {
            throw createError({
                statusCode: 404,
                statusMessage: 'Room not found'
            })
        }

        const room = roomResult.rows[0]

        // Wenn spezifischer Zeitslot angefragt
        if (date && timeSlot) {
            const available = isRoomAvailable(room, date, timeSlot)

            return {
                roomId: room.id,
                roomName: room.name,
                date: date,
                timeSlot: timeSlot,
                available: available,
                availabilityRules: room.availability_rules
            }
        }

        // Wenn nur Datum angegeben, hole alle verfügbaren Zeitslots
        if (date) {
            const availableSlots = getAvailableTimeSlots(room, date)

            // Prüfe welche Slots bereits gebucht sind
            const bookingsResult = await client.query(
                'SELECT time_slot FROM bookings WHERE room_id = $1 AND booking_date = $2',
                [parseInt(roomId), date]
            )

            const bookedSlots = bookingsResult.rows.map(row => row.time_slot)
            const freeSlots = availableSlots.filter(slot => !bookedSlots.includes(slot))

            return {
                roomId: room.id,
                roomName: room.name,
                date: date,
                availableSlots: availableSlots,
                bookedSlots: bookedSlots,
                freeSlots: freeSlots,
                availabilityRules: room.availability_rules
            }
        }

        // Nur Rauminformationen
        return {
            roomId: room.id,
            roomName: room.name,
            availabilityRules: room.availability_rules
        }

    } catch (error) {
        console.error('Room availability error:', error)

        if (error.statusCode) {
            throw error
        }

        throw createError({
            statusCode: 500,
            statusMessage: 'Room availability error'
        })
    } finally {
        if (client) {
            client.release()
        }
    }
})