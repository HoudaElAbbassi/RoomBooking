// netlify/functions/bookings.js
const { Pool } = require('pg');

// Connection Pool für bessere Performance
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 1, // Wichtig für Serverless Functions
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

exports.handler = async (event, context) => {
    // CORS Headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Content-Type': 'application/json'
    };

    // Handle preflight requests
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    let client;
    try {
        // Database connection
        client = await pool.connect();

        // GET - Buchungen abrufen (mit optionalen Filtern)
        if (event.httpMethod === 'GET') {
            const { roomId, date, startDate, endDate } = event.queryStringParameters || {};

            let query = `
        SELECT 
          b.id, 
          b.room_id, 
          b.title, 
          b.description, 
          b.contact_name, 
          b.booking_date as date, 
          TO_CHAR(b.time_slot, 'HH24:MI') as time_slot,
          b.created_at,
          r.name as room_name 
        FROM bookings b 
        JOIN rooms r ON b.room_id = r.id 
      `;
            const params = [];
            const conditions = [];

            // Filter nach Raum
            if (roomId) {
                conditions.push(`b.room_id = $${params.length + 1}`);
                params.push(parseInt(roomId));
            }

            // Filter nach spezifischem Datum
            if (date) {
                conditions.push(`b.booking_date = $${params.length + 1}`);
                params.push(date);
            }

            // Filter nach Datumsbereich
            if (startDate && endDate) {
                conditions.push(`b.booking_date BETWEEN $${params.length + 1} AND $${params.length + 2}`);
                params.push(startDate, endDate);
            }

            if (conditions.length > 0) {
                query += ' WHERE ' + conditions.join(' AND ');
            }

            query += ' ORDER BY b.booking_date, b.time_slot';

            const result = await client.query(query, params);

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(result.rows)
            };
        }

        // POST - Neue Buchung erstellen
        if (event.httpMethod === 'POST') {
            const { roomId, title, description, contactName, date, timeSlot } = JSON.parse(event.body);

            // Validierung der Pflichtfelder
            if (!roomId || !title || !contactName || !date || !timeSlot) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({
                        error: 'RoomId, title, contactName, date und timeSlot sind erforderlich'
                    })
                };
            }

            // Validierung des Datums (nicht in der Vergangenheit)
            const bookingDate = new Date(date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (bookingDate < today) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({
                        error: 'Buchungen können nicht in der Vergangenheit erstellt werden'
                    })
                };
            }

            // Prüfen ob der Raum existiert
            const roomCheck = await client.query(
                'SELECT id FROM rooms WHERE id = $1',
                [parseInt(roomId)]
            );

            if (roomCheck.rows.length === 0) {
                return {
                    statusCode: 404,
                    headers,
                    body: JSON.stringify({ error: 'Raum nicht gefunden' })
                };
            }

            // Prüfen ob der Zeitslot bereits belegt ist
            const existingBooking = await client.query(
                'SELECT id FROM bookings WHERE room_id = $1 AND booking_date = $2 AND time_slot = $3',
                [parseInt(roomId), date, timeSlot]
            );

            if (existingBooking.rows.length > 0) {
                return {
                    statusCode: 409,
                    headers,
                    body: JSON.stringify({ error: 'Dieser Zeitslot ist bereits belegt' })
                };
            }

            // Neue Buchung erstellen
            const result = await client.query(
                `INSERT INTO bookings (room_id, title, description, contact_name, booking_date, time_slot) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         RETURNING 
           id, 
           room_id, 
           title, 
           description, 
           contact_name, 
           booking_date as date, 
           TO_CHAR(time_slot, 'HH24:MI') as time_slot,
           created_at`,
                [
                    parseInt(roomId),
                    title,
                    description || '',
                    contactName,
                    date,
                    timeSlot
                ]
            );

            return {
                statusCode: 201,
                headers,
                body: JSON.stringify(result.rows[0])
            };
        }

        // PUT - Buchung aktualisieren
        if (event.httpMethod === 'PUT') {
            const bookingId = event.path.split('/').pop();
            const { roomId, title, description, contactName, date, timeSlot } = JSON.parse(event.body);

            // Validierung
            if (!roomId || !title || !contactName || !date || !timeSlot) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({
                        error: 'RoomId, title, contactName, date und timeSlot sind erforderlich'
                    })
                };
            }

            // Prüfen ob andere Buchung bereits diesen Zeitslot belegt (außer der aktuellen)
            const existingBooking = await client.query(
                'SELECT id FROM bookings WHERE room_id = $1 AND booking_date = $2 AND time_slot = $3 AND id != $4',
                [parseInt(roomId), date, timeSlot, parseInt(bookingId)]
            );

            if (existingBooking.rows.length > 0) {
                return {
                    statusCode: 409,
                    headers,
                    body: JSON.stringify({ error: 'Dieser Zeitslot ist bereits belegt' })
                };
            }

            const result = await client.query(
                `UPDATE bookings 
         SET room_id = $1, title = $2, description = $3, contact_name = $4, 
             booking_date = $5, time_slot = $6
         WHERE id = $7
         RETURNING 
           id, 
           room_id, 
           title, 
           description, 
           contact_name, 
           booking_date as date, 
           TO_CHAR(time_slot, 'HH24:MI') as time_slot,
           created_at`,
                [
                    parseInt(roomId),
                    title,
                    description || '',
                    contactName,
                    date,
                    timeSlot,
                    parseInt(bookingId)
                ]
            );

            if (result.rows.length === 0) {
                return {
                    statusCode: 404,
                    headers,
                    body: JSON.stringify({ error: 'Buchung nicht gefunden' })
                };
            }

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(result.rows[0])
            };
        }

        // DELETE - Buchung löschen
        if (event.httpMethod === 'DELETE') {
            const bookingId = event.path.split('/').pop();

            const result = await client.query(
                'DELETE FROM bookings WHERE id = $1 RETURNING *',
                [parseInt(bookingId)]
            );

            if (result.rows.length === 0) {
                return {
                    statusCode: 404,
                    headers,
                    body: JSON.stringify({ error: 'Buchung nicht gefunden' })
                };
            }

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ message: 'Buchung erfolgreich gelöscht' })
            };
        }

        // Method not allowed
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };

    } catch (error) {
        console.error('Database error:', error);

        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Datenbankfehler',
                details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            })
        };
    } finally {
        // Connection wieder freigeben
        if (client) client.release();
    }
};