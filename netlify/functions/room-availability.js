// netlify/functions/room-availability.js
const { Pool } = require('pg');

function validateEnvironment() {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
        throw new Error('DATABASE_URL environment variable not configured');
    }
    return dbUrl;
}

// Hilfsfunktion: Überprüfe Raumverfügbarkeit
function isRoomAvailable(room, date, timeSlot) {
    // Wenn keine Verfügbarkeitsregeln oder "always_available"
    if (!room.availability_rules || room.availability_rules.type === 'always_available') {
        return true;
    }

    // Für zeitbeschränkte Räume
    if (room.availability_rules.type === 'time_restricted') {
        const requestDate = new Date(date);
        const dayOfWeek = requestDate.getDay(); // 0=Sonntag, 1=Montag, ..., 6=Samstag
        const requestTime = timeSlot;

        // Prüfe alle Verfügbarkeitsregeln
        const rules = room.availability_rules.rules || [];

        for (const rule of rules) {
            if (rule.day === dayOfWeek) {
                if (requestTime >= rule.start_time && requestTime <= rule.end_time) {
                    return true;
                }
            }
        }

        return false; // Nicht in verfügbaren Zeitfenstern
    }

    return false; // Unbekannter Regeltyp
}

// Hilfsfunktion: Hole verfügbare Zeitslots für einen Raum
function getAvailableTimeSlots(room, date) {
    const allTimeSlots = [
        "08:00", "09:00", "10:00", "11:00",
        "12:00", "13:00", "14:00", "15:00",
        "16:00", "17:00", "18:00", "19:00",
        "20:00", "21:00", "22:00"
    ];

    // Wenn immer verfügbar, gib alle Zeitslots zurück
    if (!room.availability_rules || room.availability_rules.type === 'always_available') {
        return allTimeSlots;
    }

    // Für zeitbeschränkte Räume
    if (room.availability_rules.type === 'time_restricted') {
        const requestDate = new Date(date);
        const dayOfWeek = requestDate.getDay();
        const availableSlots = [];

        const rules = room.availability_rules.rules || [];

        for (const timeSlot of allTimeSlots) {
            for (const rule of rules) {
                if (rule.day === dayOfWeek) {
                    if (timeSlot >= rule.start_time && timeSlot <= rule.end_time) {
                        availableSlots.push(timeSlot);
                        break; // Zeitslot gefunden, weiter zum nächsten
                    }
                }
            }
        }

        return availableSlots;
    }

    return []; // Kein verfügbarer Zeitslot
}

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers };
    }

    let dbUrl;
    try {
        dbUrl = validateEnvironment();
    } catch (error) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Configuration error',
                details: error.message
            })
        };
    }

    const pool = new Pool({
        connectionString: dbUrl,
        ssl: { rejectUnauthorized: false, require: true },
        max: 1,
        min: 0
    });

    let client;

    try {
        client = await pool.connect();

        // GET - Verfügbarkeit für einen Raum prüfen
        if (event.httpMethod === 'GET') {
            const { roomId, date, timeSlot } = event.queryStringParameters || {};

            if (!roomId) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'roomId is required' })
                };
            }

            // Hole Rauminformationen
            const roomResult = await client.query(
                'SELECT id, name, availability_rules FROM rooms WHERE id = $1',
                [parseInt(roomId)]
            );

            if (roomResult.rows.length === 0) {
                return {
                    statusCode: 404,
                    headers,
                    body: JSON.stringify({ error: 'Room not found' })
                };
            }

            const room = roomResult.rows[0];

            // Wenn spezifischer Zeitslot angefragt
            if (date && timeSlot) {
                const available = isRoomAvailable(room, date, timeSlot);

                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({
                        roomId: room.id,
                        roomName: room.name,
                        date: date,
                        timeSlot: timeSlot,
                        available: available,
                        availabilityRules: room.availability_rules
                    })
                };
            }

            // Wenn nur Datum angegeben, hole alle verfügbaren Zeitslots
            if (date) {
                const availableSlots = getAvailableTimeSlots(room, date);

                // Prüfe welche Slots bereits gebucht sind
                const bookingsResult = await client.query(
                    'SELECT time_slot FROM bookings WHERE room_id = $1 AND booking_date = $2',
                    [parseInt(roomId), date]
                );

                const bookedSlots = bookingsResult.rows.map(row => row.time_slot);
                const freeSlots = availableSlots.filter(slot => !bookedSlots.includes(slot));

                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({
                        roomId: room.id,
                        roomName: room.name,
                        date: date,
                        availableSlots: availableSlots,
                        bookedSlots: bookedSlots,
                        freeSlots: freeSlots,
                        availabilityRules: room.availability_rules
                    })
                };
            }

            // Nur Rauminformationen
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    roomId: room.id,
                    roomName: room.name,
                    availabilityRules: room.availability_rules
                })
            };
        }

        // POST - Verfügbarkeit für mehrere Räume/Daten prüfen
        if (event.httpMethod === 'POST') {
            const { rooms: roomIds, dates } = JSON.parse(event.body);

            if (!roomIds || !Array.isArray(roomIds)) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'rooms array is required' })
                };
            }

            const results = [];

            for (const roomId of roomIds) {
                // Hole Rauminformationen
                const roomResult = await client.query(
                    'SELECT id, name, availability_rules FROM rooms WHERE id = $1',
                    [parseInt(roomId)]
                );

                if (roomResult.rows.length === 0) {
                    continue; // Raum nicht gefunden, überspringe
                }

                const room = roomResult.rows[0];

                if (dates && Array.isArray(dates)) {
                    // Prüfe für spezifische Daten
                    for (const date of dates) {
                        const availableSlots = getAvailableTimeSlots(room, date);

                        // Prüfe welche Slots bereits gebucht sind
                        const bookingsResult = await client.query(
                            'SELECT time_slot FROM bookings WHERE room_id = $1 AND booking_date = $2',
                            [parseInt(roomId), date]
                        );

                        const bookedSlots = bookingsResult.rows.map(row => row.time_slot);
                        const freeSlots = availableSlots.filter(slot => !bookedSlots.includes(slot));

                        results.push({
                            roomId: room.id,
                            roomName: room.name,
                            date: date,
                            availableSlots: availableSlots,
                            bookedSlots: bookedSlots,
                            freeSlots: freeSlots,
                            hasAvailability: freeSlots.length > 0
                        });
                    }
                } else {
                    // Nur Rauminformationen
                    results.push({
                        roomId: room.id,
                        roomName: room.name,
                        availabilityRules: room.availability_rules
                    });
                }
            }

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ results })
            };
        }

        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };

    } catch (error) {
        console.error('Room availability error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Room availability error',
                details: error.message
            })
        };
    } finally {
        if (client) {
            client.release();
        }
    }
};