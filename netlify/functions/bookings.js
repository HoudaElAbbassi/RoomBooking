// netlify/functions/bookings.js - Production-ready mit Environment Validation
const { Pool } = require('pg');

// Environment Variable Validation
function validateEnvironment() {
    const dbUrl = process.env.DATABASE_URL;

    console.log('🔍 Environment Validation:');
    console.log('- DATABASE_URL exists:', !!dbUrl);
    console.log('- Deploy Context:', process.env.CONTEXT || 'unknown');
    console.log('- Deploy ID:', process.env.DEPLOY_ID || 'unknown');

    if (!dbUrl) {
        console.error('❌ DATABASE_URL not found in environment');
        console.log('Available env vars:', Object.keys(process.env).filter(k =>
            k.toLowerCase().includes('database') || k.toLowerCase().includes('neon')
        ));
        throw new Error('DATABASE_URL environment variable not configured');
    }

    if (dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1')) {
        throw new Error('DATABASE_URL points to localhost - should point to Neon');
    }

    if (!dbUrl.startsWith('postgresql://')) {
        throw new Error('DATABASE_URL must start with postgresql://');
    }

    console.log('✅ Environment validation passed');
    console.log('- URL prefix:', dbUrl.substring(0, 25) + '...');
    console.log('- Contains neon.tech:', dbUrl.includes('neon.tech'));

    return dbUrl;
}

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
    };

    // Log request info
    console.log(`📡 ${event.httpMethod} ${event.path} - Deploy: ${process.env.DEPLOY_ID || 'unknown'}`);

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers };
    }

    let dbUrl;
    try {
        dbUrl = validateEnvironment();
    } catch (error) {
        console.error('Environment validation failed:', error.message);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Configuration error',
                details: error.message,
                timestamp: new Date().toISOString(),
                deployId: process.env.DEPLOY_ID || 'unknown'
            })
        };
    }

    // Database pool configuration
    const pool = new Pool({
        connectionString: dbUrl,
        ssl: {
            rejectUnauthorized: false,
            require: true
        },
        max: 1, // Important for serverless
        min: 0,
        acquireTimeoutMillis: 60000,
        createTimeoutMillis: 30000,
        destroyTimeoutMillis: 5000,
        idleTimeoutMillis: 30000,
    });

    let client;
    const startTime = Date.now();

    try {
        console.log('🔄 Acquiring database connection...');

        // Connection with timeout
        const connectPromise = pool.connect();
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Connection timeout')), 15000)
        );

        client = await Promise.race([connectPromise, timeoutPromise]);
        const connectionTime = Date.now() - startTime;

        console.log(`✅ Database connected in ${connectionTime}ms`);

        // Verify database is responding
        await client.query('SELECT 1');
        console.log('✅ Database responding to queries');

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
          b.created_at
        FROM bookings b 
      `;
            const params = [];
            const conditions = [];

            if (roomId) {
                conditions.push(`b.room_id = $${params.length + 1}`);
                params.push(parseInt(roomId));
            }

            if (date) {
                conditions.push(`b.booking_date = $${params.length + 1}`);
                params.push(date);
            }

            if (startDate && endDate) {
                conditions.push(`b.booking_date BETWEEN $${params.length + 1} AND $${params.length + 2}`);
                params.push(startDate, endDate);
            }

            if (conditions.length > 0) {
                query += ' WHERE ' + conditions.join(' AND ');
            }

            query += ' ORDER BY b.booking_date, b.time_slot';

            console.log(`📊 Executing query with ${params.length} parameters`);
            const result = await client.query(query, params);
            console.log(`✅ Query returned ${result.rows.length} rows`);

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(result.rows)
            };
        }

        if (event.httpMethod === 'POST') {
            const { roomId, title, description, contactName, date, timeSlot } = JSON.parse(event.body);

            console.log(`📝 Creating booking: Room ${roomId}, ${date} ${timeSlot}`);

            // Validation
            if (!roomId || !title || !contactName || !date || !timeSlot) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({
                        error: 'Fehlende Pflichtfelder',
                        required: ['roomId', 'title', 'contactName', 'date', 'timeSlot']
                    })
                };
            }

            // Check for existing booking
            const existingBooking = await client.query(
                'SELECT id FROM bookings WHERE room_id = $1 AND booking_date = $2 AND time_slot = $3',
                [parseInt(roomId), date, timeSlot]
            );

            if (existingBooking.rows.length > 0) {
                console.log('⚠️ Time slot already booked');
                return {
                    statusCode: 409,
                    headers,
                    body: JSON.stringify({ error: 'Dieser Zeitslot ist bereits belegt' })
                };
            }

            // Create booking
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
                [parseInt(roomId), title, description || '', contactName, date, timeSlot]
            );

            console.log(`✅ Booking created with ID ${result.rows[0].id}`);

            return {
                statusCode: 201,
                headers,
                body: JSON.stringify(result.rows[0])
            };
        }

        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };

    } catch (error) {
        const connectionTime = Date.now() - startTime;
        console.error(`❌ Database error after ${connectionTime}ms:`, error);

        // Detailed error classification
        let errorType = 'Database error';
        let suggestion = 'Check logs for details';

        if (error.message.includes('ECONNREFUSED')) {
            errorType = 'Connection refused';
            suggestion = 'Verify DATABASE_URL hostname and port';
        } else if (error.message.includes('ENOTFOUND')) {
            errorType = 'Host not found';
            suggestion = 'Check if Neon hostname is correct in DATABASE_URL';
        } else if (error.message.includes('timeout')) {
            errorType = 'Connection timeout';
            suggestion = 'Database may be sleeping, try again in a moment';
        } else if (error.message.includes('authentication')) {
            errorType = 'Authentication failed';
            suggestion = 'Verify username and password in DATABASE_URL';
        } else if (error.message.includes('does not exist')) {
            errorType = 'Database or table not found';
            suggestion = 'Run database schema setup';
        }

        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: errorType,
                suggestion: suggestion,
                details: error.message,
                timestamp: new Date().toISOString(),
                deployId: process.env.DEPLOY_ID || 'unknown',
                connectionTime: connectionTime
            })
        };
    } finally {
        if (client) {
            try {
                client.release();
                console.log('🔄 Database connection released');
            } catch (e) {
                console.warn('⚠️ Error releasing connection:', e.message);
            }
        }
    }
};