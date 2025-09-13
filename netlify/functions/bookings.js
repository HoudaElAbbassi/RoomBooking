// netlify/functions/bookings.js - Extended version with time ranges and recurring bookings
const { Pool } = require('pg');

// Environment Variable Validation
function validateEnvironment() {
    const dbUrl = process.env.DATABASE_URL;

    if (!dbUrl) {
        throw new Error('DATABASE_URL environment variable not configured');
    }

    if (!dbUrl.startsWith('postgresql://')) {
        throw new Error('DATABASE_URL must start with postgresql://');
    }

    return dbUrl;
}

// Helper function to format time consistently
function formatTimeSlot(timeValue) {
    if (!timeValue) return null;

    if (typeof timeValue === 'string' && timeValue.match(/^\d{2}:\d{2}$/)) {
        return timeValue;
    }

    if (typeof timeValue === 'object' && timeValue !== null) {
        const hours = String(timeValue.hours || timeValue.hour || 0).padStart(2, '0');
        const minutes = String(timeValue.minutes || timeValue.minute || 0).padStart(2, '0');
        return `${hours}:${minutes}`;
    }

    if (typeof timeValue === 'string') {
        const match = timeValue.match(/(\d{1,2}):?(\d{2})?/);
        if (match) {
            const hours = String(match[1]).padStart(2, '0');
            const minutes = String(match[2] || '00').padStart(2, '0');
            return `${hours}:${minutes}`;
        }
    }

    return String(timeValue);
}

// Helper function to format date consistently
function formatDate(dateValue) {
    if (!dateValue) return null;

    if (dateValue instanceof Date) {
        return dateValue.toISOString().split('T')[0];
    }

    return String(dateValue);
}

// Helper function to generate recurring dates
function generateRecurringDates(startDate, recurrenceType, endDate) {
    const dates = [];
    const current = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T00:00:00');

    while (current <= end) {
        dates.push(current.toISOString().split('T')[0]);

        switch (recurrenceType) {
            case 'daily':
                current.setDate(current.getDate() + 1);
                break;
            case 'weekly':
                current.setDate(current.getDate() + 7);
                break;
            case 'monthly':
                current.setMonth(current.getMonth() + 1);
                break;
            default:
                return dates; // Stop if unknown type
        }
    }

    return dates;
}

// Helper function to check for booking conflicts
async function checkBookingConflicts(client, roomId, date, startTime, endTime, excludeId = null) {
    const query = `
        SELECT id, title, start_time, end_time 
        FROM bookings 
        WHERE room_id = $1 
        AND booking_date = $2 
        AND ($3 < end_time AND $4 > start_time)
        ${excludeId ? 'AND id != $5' : ''}
    `;

    const params = [roomId, date, startTime, endTime];
    if (excludeId) params.push(excludeId);

    const result = await client.query(query, params);
    return result.rows;
}

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Content-Type': 'application/json'
    };

    console.log(`📡 ${event.httpMethod} ${event.path} - Extended Booking Handler`);

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
                timestamp: new Date().toISOString()
            })
        };
    }

    const pool = new Pool({
        connectionString: dbUrl,
        ssl: {
            rejectUnauthorized: false,
            require: true
        },
        max: 1,
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
        client = await pool.connect();
        console.log(`✅ Database connected in ${Date.now() - startTime}ms`);

        // GET - Fetch bookings with extended information
        if (event.httpMethod === 'GET') {
            const { roomId, date, startDate, endDate, includeRecurring = 'true' } = event.queryStringParameters || {};

            let query = `
                SELECT 
                  b.id, 
                  b.room_id, 
                  b.title, 
                  b.description, 
                  b.contact_name, 
                  b.booking_date, 
                  COALESCE(b.start_time, b.time_slot) as start_time,
                  COALESCE(b.end_time, (b.time_slot::time + interval '1 hour')::time) as end_time,
                  b.is_recurring,
                  b.recurrence_type,
                  b.recurrence_end_date,
                  b.parent_booking_id,
                  b.created_at,
                  CASE 
                    WHEN b.parent_booking_id IS NOT NULL THEN 'child'
                    WHEN b.is_recurring = true THEN 'parent'
                    ELSE 'single'
                  END as booking_type,
                  EXTRACT(EPOCH FROM (COALESCE(b.end_time, (b.time_slot::time + interval '1 hour')::time) - COALESCE(b.start_time, b.time_slot)))/3600 AS duration_hours
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

            // Option to exclude child bookings from recurring series
            if (includeRecurring === 'false') {
                conditions.push(`b.parent_booking_id IS NULL`);
            }

            if (conditions.length > 0) {
                query += ' WHERE ' + conditions.join(' AND ');
            }

            query += ' ORDER BY b.booking_date, COALESCE(b.start_time, b.time_slot)';

            console.log(`📊 Executing query with ${params.length} parameters`);
            const result = await client.query(query, params);
            console.log(`✅ Query returned ${result.rows.length} rows`);

            // Format the results consistently
            const formattedResults = result.rows.map(row => ({
                id: row.id,
                room_id: row.room_id,
                title: row.title,
                description: row.description,
                contact_name: row.contact_name,
                booking_date: formatDate(row.booking_date),
                start_time: formatTimeSlot(row.start_time),
                end_time: formatTimeSlot(row.end_time),
                is_recurring: row.is_recurring,
                recurrence_type: row.recurrence_type,
                recurrence_end_date: row.recurrence_end_date,
                parent_booking_id: row.parent_booking_id,
                booking_type: row.booking_type,
                duration_hours: parseFloat(row.duration_hours || 1),
                created_at: row.created_at,
                // Backward compatibility
                time_slot: formatTimeSlot(row.start_time)
            }));

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(formattedResults)
            };
        }

        // POST - Create new booking (single or recurring)
        if (event.httpMethod === 'POST') {
            const {
                roomId, title, description, contactName, date,
                startTime, endTime, timeSlot,
                isRecurring = false, recurrenceType, recurrenceEndDate
            } = JSON.parse(event.body);

            console.log(`📝 Creating booking: Room ${roomId}, ${date} ${startTime || timeSlot}-${endTime || 'N/A'}`);

            // Validation
            if (!roomId || !title || !contactName || !date) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({
                        error: 'Fehlende Pflichtfelder',
                        required: ['roomId', 'title', 'contactName', 'date']
                    })
                };
            }

            // Handle backward compatibility with old timeSlot format
            const formattedStartTime = formatTimeSlot(startTime || timeSlot);
            const formattedEndTime = formatTimeSlot(endTime ||
                (timeSlot ? addHourToTime(timeSlot) : addHourToTime(startTime)));
            const formattedDate = formatDate(date);

            // Validate time range
            if (formattedStartTime >= formattedEndTime) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({
                        error: 'Endzeit muss nach der Startzeit liegen'
                    })
                };
            }

            console.log(`📝 Formatted times: ${formattedDate} ${formattedStartTime}-${formattedEndTime}`);

            // Check for conflicts on main date
            const conflicts = await checkBookingConflicts(
                client, parseInt(roomId), formattedDate, formattedStartTime, formattedEndTime
            );

            if (conflicts.length > 0) {
                console.log('⚠️ Time slot conflicts detected');
                return {
                    statusCode: 409,
                    headers,
                    body: JSON.stringify({
                        error: 'Zeitkonflikt mit bestehender Buchung',
                        conflicts: conflicts.map(c => ({
                            id: c.id,
                            title: c.title,
                            time: `${formatTimeSlot(c.start_time)} - ${formatTimeSlot(c.end_time)}`
                        }))
                    })
                };
            }

            // Create main booking
            const mainBookingResult = await client.query(
                `INSERT INTO bookings (
                    room_id, title, description, contact_name, booking_date, 
                    start_time, end_time, is_recurring, recurrence_type, recurrence_end_date
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
                RETURNING 
                   id, room_id, title, description, contact_name, booking_date, 
                   start_time, end_time, is_recurring, recurrence_type, 
                   recurrence_end_date, created_at`,
                [
                    parseInt(roomId), title, description || '', contactName,
                    formattedDate, formattedStartTime, formattedEndTime,
                    isRecurring, isRecurring ? recurrenceType : null,
                    isRecurring ? recurrenceEndDate : null
                ]
            );

            const mainBooking = mainBookingResult.rows[0];
            console.log(`✅ Main booking created with ID ${mainBooking.id}`);

            let recurringBookings = [];
            let conflictCount = 0;

            // Create recurring bookings if specified
            if (isRecurring && recurrenceType && recurrenceEndDate) {
                console.log(`🔄 Creating recurring bookings: ${recurrenceType} until ${recurrenceEndDate}`);

                const recurringDates = generateRecurringDates(formattedDate, recurrenceType, recurrenceEndDate);
                console.log(`📅 Generated ${recurringDates.length} recurring dates`);

                // Skip the first date (already created as main booking)
                for (const recurringDate of recurringDates.slice(1)) {
                    try {
                        // Check for conflicts
                        const dateConflicts = await checkBookingConflicts(
                            client, parseInt(roomId), recurringDate, formattedStartTime, formattedEndTime
                        );

                        if (dateConflicts.length > 0) {
                            console.log(`⚠️ Skipping ${recurringDate} due to conflicts`);
                            conflictCount++;
                            continue;
                        }

                        // Create recurring booking
                        const recurringResult = await client.query(
                            `INSERT INTO bookings (
                                room_id, title, description, contact_name, booking_date,
                                start_time, end_time, is_recurring, parent_booking_id
                            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
                            RETURNING id, booking_date`,
                            [
                                parseInt(roomId), title, description || '', contactName,
                                recurringDate, formattedStartTime, formattedEndTime, false, mainBooking.id
                            ]
                        );

                        recurringBookings.push(recurringResult.rows[0]);
                    } catch (error) {
                        console.warn(`⚠️ Failed to create recurring booking for ${recurringDate}:`, error.message);
                        conflictCount++;
                    }
                }

                console.log(`✅ Created ${recurringBookings.length} recurring bookings, ${conflictCount} skipped due to conflicts`);
            }

            // Format response
            const response = {
                ...mainBooking,
                booking_date: formatDate(mainBooking.booking_date),
                start_time: formatTimeSlot(mainBooking.start_time),
                end_time: formatTimeSlot(mainBooking.end_time),
                // Backward compatibility
                time_slot: formatTimeSlot(mainBooking.start_time),
                // Additional info
                recurring_created: recurringBookings.length,
                recurring_conflicts: conflictCount,
                total_bookings: 1 + recurringBookings.length
            };

            return {
                statusCode: 201,
                headers,
                body: JSON.stringify(response)
            };
        }

        // PUT - Update existing booking
        if (event.httpMethod === 'PUT') {
            const bookingId = event.queryStringParameters?.id;

            if (!bookingId) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'Booking ID is required for updates' })
                };
            }

            const {
                roomId, title, description, contactName, date,
                startTime, endTime, isRecurring, recurrenceType, recurrenceEndDate
            } = JSON.parse(event.body);

            console.log(`📝 Updating booking ${bookingId}`);

            // Check if booking exists
            const existingBooking = await client.query(
                'SELECT * FROM bookings WHERE id = $1',
                [parseInt(bookingId)]
            );

            if (existingBooking.rows.length === 0) {
                return {
                    statusCode: 404,
                    headers,
                    body: JSON.stringify({ error: 'Booking not found' })
                };
            }

            const formattedStartTime = formatTimeSlot(startTime);
            const formattedEndTime = formatTimeSlot(endTime);
            const formattedDate = formatDate(date);

            // Check for conflicts (excluding current booking)
            const conflicts = await checkBookingConflicts(
                client, parseInt(roomId), formattedDate, formattedStartTime, formattedEndTime, parseInt(bookingId)
            );

            if (conflicts.length > 0) {
                return {
                    statusCode: 409,
                    headers,
                    body: JSON.stringify({
                        error: 'Zeitkonflikt mit bestehender Buchung',
                        conflicts: conflicts.map(c => ({
                            id: c.id,
                            title: c.title,
                            time: `${formatTimeSlot(c.start_time)} - ${formatTimeSlot(c.end_time)}`
                        }))
                    })
                };
            }

            // Update booking
            const updateResult = await client.query(
                `UPDATE bookings SET 
                    room_id = $1, title = $2, description = $3, contact_name = $4,
                    booking_date = $5, start_time = $6, end_time = $7,
                    is_recurring = $8, recurrence_type = $9, recurrence_end_date = $10
                WHERE id = $11
                RETURNING *`,
                [
                    parseInt(roomId), title, description || '', contactName,
                    formattedDate, formattedStartTime, formattedEndTime,
                    isRecurring, isRecurring ? recurrenceType : null,
                    isRecurring ? recurrenceEndDate : null, parseInt(bookingId)
                ]
            );

            const updatedBooking = updateResult.rows[0];
            console.log(`✅ Booking ${bookingId} updated`);

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    ...updatedBooking,
                    booking_date: formatDate(updatedBooking.booking_date),
                    start_time: formatTimeSlot(updatedBooking.start_time),
                    end_time: formatTimeSlot(updatedBooking.end_time),
                    time_slot: formatTimeSlot(updatedBooking.start_time)
                })
            };
        }

        // DELETE - Delete booking (and child bookings if recurring)
        if (event.httpMethod === 'DELETE') {
            const bookingId = event.queryStringParameters?.id;
            const deleteRecurring = event.queryStringParameters?.deleteRecurring === 'true';

            if (!bookingId) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'Booking ID is required for deletion' })
                };
            }

            console.log(`🗑️ Deleting booking ${bookingId}, deleteRecurring: ${deleteRecurring}`);

            // Check if booking exists
            const existingBooking = await client.query(
                'SELECT * FROM bookings WHERE id = $1',
                [parseInt(bookingId)]
            );

            if (existingBooking.rows.length === 0) {
                return {
                    statusCode: 404,
                    headers,
                    body: JSON.stringify({ error: 'Booking not found' })
                };
            }

            let deletedCount = 0;

            // Delete child bookings if this is a recurring parent and deleteRecurring is true
            if (deleteRecurring && existingBooking.rows[0].is_recurring) {
                const deleteChildrenResult = await client.query(
                    'DELETE FROM bookings WHERE parent_booking_id = $1',
                    [parseInt(bookingId)]
                );
                deletedCount += deleteChildrenResult.rowCount;
                console.log(`🗑️ Deleted ${deleteChildrenResult.rowCount} child bookings`);
            }

            // Delete main booking
            const deleteMainResult = await client.query(
                'DELETE FROM bookings WHERE id = $1',
                [parseInt(bookingId)]
            );
            deletedCount += deleteMainResult.rowCount;

            console.log(`✅ Deleted ${deletedCount} booking(s)`);

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    message: 'Booking deleted successfully',
                    deletedCount: deletedCount
                })
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

        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Database error',
                details: error.message,
                timestamp: new Date().toISOString(),
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

// Helper function to add an hour to a time string
function addHourToTime(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    const newHours = (hours + 1) % 24;
    return `${String(newHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}