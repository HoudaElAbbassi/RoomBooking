// netlify/functions/availability.js
// Optional: Spezielle Funktion für Verfügbarkeitsabfragen
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 1,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    let client;
    try {
        client = await pool.connect();

        const { roomId, date, capacity } = event.queryStringParameters || {};

        // Verfügbare Zeitslots für einen bestimmten Raum und Datum
        if (roomId && date) {
            const timeSlots = [
                '08:00', '09:00', '10:00', '11:00',
                '12:00', '13:00', '14:00', '15:00',
                '16:00', '17:00', '18:00', '19:00'
            ];

            // Gebuchte Zeitslots abrufen
            const bookedSlots = await client.query(
                `SELECT TO_CHAR(time_slot, 'HH24:MI') as time_slot 
         FROM bookings 
         WHERE room_id = $1 AND booking_date = $2`,
                [parseInt(roomId), date]
            );

            const bookedTimes = bookedSlots.rows.map(row => row.time_slot);
            const availableSlots = timeSlots.filter(slot => !bookedTimes.includes(slot));

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    roomId: parseInt(roomId),
                    date,
                    availableSlots,
                    bookedSlots: bookedTimes
                })
            };
        }

        // Verfügbare Räume für ein bestimmtes Datum und Zeitslot
        if (date && event.queryStringParameters.timeSlot) {
            const timeSlot = event.queryStringParameters.timeSlot;

            let query = `
        SELECT r.id, r.name, r.capacity, r.location, r.features, r.description
        FROM rooms r
        WHERE r.id NOT IN (
          SELECT DISTINCT room_id 
          FROM bookings 
          WHERE booking_date = $1 AND time_slot = $2
        )
      `;
            const params = [date, timeSlot];

            // Optional: Filter nach Kapazität
            if (capacity) {
                query += ' AND r.capacity >= $3';
                params.push(parseInt(capacity));
            }

            query += ' ORDER BY r.name';

            const result = await client.query(query, params);

            // Features von JSON zu Array konvertieren
            const availableRooms = result.rows.map(room => ({
                ...room,
                features: typeof room.features === 'string' ?
                    JSON.parse(room.features) : room.features
            }));

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    date,
                    timeSlot,
                    availableRooms
                })
            };
        }

        // Wöchentliche Übersicht für alle Räume
        if (event.queryStringParameters.week) {
            const startDate = event.queryStringParameters.week; // Format: YYYY-MM-DD (Montag)

            const result = await client.query(`
        SELECT 
          r.id as room_id,
          r.name as room_name,
          b.booking_date as date,
          TO_CHAR(b.time_slot, 'HH24:MI') as time_slot,
          b.title,
          b.contact_name
        FROM rooms r
        LEFT JOIN bookings b ON r.id = b.room_id 
          AND b.booking_date BETWEEN $1 AND $1::date + INTERVAL '6 days'
        ORDER BY r.name, b.booking_date, b.time_slot
      `, [startDate]);

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    startDate,
                    bookings: result.rows
                })
            };
        }

        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
                error: 'Fehlende Parameter. Benötigt: roomId + date ODER date + timeSlot ODER week'
            })
        };

    } catch (error) {
        console.error('Database error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Datenbankfehler', details: error.message })
        };
    } finally {
        if (client) client.release();
    }
};