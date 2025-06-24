// netlify/functions/rooms.js
const { Pool } = require('pg');

// Connection Pool für bessere Performance bei Serverless
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 1, // Wichtig für Serverless Functions
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

exports.handler = async (event, context) => {
    // CORS Headers für Frontend-Zugriff
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

        // GET - Alle Räume abrufen
        if (event.httpMethod === 'GET') {
            const { capacity, features } = event.queryStringParameters || {};

            let query = `
        SELECT id, name, capacity, location, features, description, created_at 
        FROM rooms 
      `;
            const params = [];
            const conditions = [];

            // Optional: Filter nach Kapazität
            if (capacity) {
                conditions.push(`capacity >= $${params.length + 1}`);
                params.push(parseInt(capacity));
            }

            // Optional: Filter nach Features (JSON Array)
            if (features) {
                const featuresArray = features.split(',').map(f => f.trim());
                for (let i = 0; i < featuresArray.length; i++) {
                    conditions.push(`features ? $${params.length + 1}`);
                    params.push(featuresArray[i]);
                }
            }

            if (conditions.length > 0) {
                query += ' WHERE ' + conditions.join(' AND ');
            }

            query += ' ORDER BY name';

            const result = await client.query(query, params);

            // Features von JSON String zu Array konvertieren für Frontend
            const rooms = result.rows.map(room => ({
                ...room,
                features: typeof room.features === 'string' ?
                    JSON.parse(room.features) : room.features
            }));

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(rooms)
            };
        }

        // POST - Neuen Raum erstellen
        if (event.httpMethod === 'POST') {
            const { name, capacity, location, features, description } = JSON.parse(event.body);

            // Validierung
            if (!name || !capacity || !location) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'Name, capacity und location sind erforderlich' })
                };
            }

            const result = await client.query(
                `INSERT INTO rooms (name, capacity, location, features, description) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING *`,
                [
                    name,
                    parseInt(capacity),
                    location,
                    JSON.stringify(features || []),
                    description || ''
                ]
            );

            const newRoom = result.rows[0];
            // Features zurück zu Array konvertieren
            newRoom.features = typeof newRoom.features === 'string' ?
                JSON.parse(newRoom.features) : newRoom.features;

            return {
                statusCode: 201,
                headers,
                body: JSON.stringify(newRoom)
            };
        }

        // PUT - Raum aktualisieren
        if (event.httpMethod === 'PUT') {
            const roomId = event.path.split('/').pop();
            const { name, capacity, location, features, description } = JSON.parse(event.body);

            const result = await client.query(
                `UPDATE rooms 
         SET name = $1, capacity = $2, location = $3, features = $4, description = $5
         WHERE id = $6
         RETURNING *`,
                [
                    name,
                    parseInt(capacity),
                    location,
                    JSON.stringify(features || []),
                    description || '',
                    roomId
                ]
            );

            if (result.rows.length === 0) {
                return {
                    statusCode: 404,
                    headers,
                    body: JSON.stringify({ error: 'Raum nicht gefunden' })
                };
            }

            const updatedRoom = result.rows[0];
            updatedRoom.features = typeof updatedRoom.features === 'string' ?
                JSON.parse(updatedRoom.features) : updatedRoom.features;

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(updatedRoom)
            };
        }

        // DELETE - Raum löschen
        if (event.httpMethod === 'DELETE') {
            const roomId = event.path.split('/').pop();

            // Erst prüfen ob Buchungen existieren
            const bookingsCheck = await client.query(
                'SELECT COUNT(*) as count FROM bookings WHERE room_id = $1',
                [roomId]
            );

            if (parseInt(bookingsCheck.rows[0].count) > 0) {
                return {
                    statusCode: 409,
                    headers,
                    body: JSON.stringify({
                        error: 'Raum kann nicht gelöscht werden, da noch Buchungen existieren'
                    })
                };
            }

            const result = await client.query(
                'DELETE FROM rooms WHERE id = $1 RETURNING *',
                [roomId]
            );

            if (result.rows.length === 0) {
                return {
                    statusCode: 404,
                    headers,
                    body: JSON.stringify({ error: 'Raum nicht gefunden' })
                };
            }

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ message: 'Raum erfolgreich gelöscht' })
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