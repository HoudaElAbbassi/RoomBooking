// testconnection.js - Database Connection Tester für Neon
const { Pool } = require('pg');

// ANSI Color codes für bessere Ausgabe
const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    reset: '\x1b[0m',
    bright: '\x1b[1m'
};

function log(color, symbol, message) {
    console.log(`${colors[color]}${colors.bright}${symbol} ${message}${colors.reset}`);
}

function logSection(title) {
    console.log(`\n${colors.cyan}${colors.bright}${'='.repeat(60)}`);
    console.log(`${title.toUpperCase()}`);
    console.log(`${'='.repeat(60)}${colors.reset}\n`);
}

async function testDatabaseConnection() {
    logSection('Neon Database Connection Test');

    // 1. Environment Variable Check
    log('blue', '🔍', 'Checking Environment Variables...');

    const dbUrl = "postgresql://neondb_owner:npg_1BDErbzCipU5@ep-dark-surf-a56z37zq-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require"


    if (!dbUrl) {
        log('red', '❌', 'DATABASE_URL environment variable not found!');
        log('yellow', '💡', 'Set it with: export DATABASE_URL="postgresql://..."');
        return false;
    }

    log('green', '✅', 'DATABASE_URL found');
    log('cyan', 'ℹ️', `URL prefix: ${dbUrl.substring(0, 30)}...`);

    // 2. URL Format Validation
    log('blue', '🔍', 'Validating Connection String Format...');

    if (!dbUrl.startsWith('postgresql://') && !dbUrl.startsWith('postgres://')) {
        log('red', '❌', 'Invalid protocol! Must start with postgresql:// or postgres://');
        return false;
    }

    if (dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1')) {
        log('red', '❌', 'URL points to localhost instead of Neon!');
        return false;
    }

    if (!dbUrl.includes('neon.tech')) {
        log('yellow', '⚠️', 'URL does not contain neon.tech - is this correct?');
    }

    log('green', '✅', 'Connection string format looks valid');

    // 3. Parse Connection Details
    try {
        const url = new URL(dbUrl);
        log('cyan', 'ℹ️', `Host: ${url.hostname}`);
        log('cyan', 'ℹ️', `Port: ${url.port || '5432'}`);
        log('cyan', 'ℹ️', `Database: ${url.pathname.replace('/', '')}`);
        log('cyan', 'ℹ️', `Username: ${url.username}`);
        log('cyan', 'ℹ️', `SSL Mode: ${url.searchParams.get('sslmode') || 'not specified'}`);
    } catch (error) {
        log('red', '❌', `Invalid URL format: ${error.message}`);
        return false;
    }

    // 4. Connection Test
    logSection('Testing Database Connection');

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
        log('blue', '🔄', 'Attempting to connect...');

        // Timeout für Connection
        const connectPromise = pool.connect();
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Connection timeout after 15 seconds')), 15000)
        );

        client = await Promise.race([connectPromise, timeoutPromise]);
        const connectionTime = Date.now() - startTime;

        log('green', '✅', `Connected successfully in ${connectionTime}ms`);

        // 5. Basic Query Test
        log('blue', '🔍', 'Testing basic query...');
        const testResult = await client.query('SELECT NOW() as current_time, version() as pg_version');
        log('green', '✅', `Query successful`);
        log('cyan', 'ℹ️', `PostgreSQL Version: ${testResult.rows[0].pg_version.split(' ')[0] + ' ' + testResult.rows[0].pg_version.split(' ')[1]}`);
        log('cyan', 'ℹ️', `Server Time: ${testResult.rows[0].current_time}`);

        // 6. Schema Check
        logSection('Checking Database Schema');

        log('blue', '🔍', 'Checking if tables exist...');

        const tablesResult = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
            ORDER BY table_name
        `);

        const tables = tablesResult.rows.map(row => row.table_name);

        if (tables.length === 0) {
            log('yellow', '⚠️', 'No tables found in database');
            log('yellow', '💡', 'You may need to run the schema creation script');
        } else {
            log('green', '✅', `Found ${tables.length} table(s):`);
            tables.forEach(table => log('cyan', '  •', table));
        }

        // Check specific tables
        const requiredTables = ['rooms', 'bookings'];
        const missingTables = requiredTables.filter(table => !tables.includes(table));

        if (missingTables.length > 0) {
            log('yellow', '⚠️', `Missing required tables: ${missingTables.join(', ')}`);
            log('yellow', '💡', 'Run the schema creation SQL to create missing tables');
        } else {
            log('green', '✅', 'All required tables exist');

            // 7. Data Check
            log('blue', '🔍', 'Checking table data...');

            try {
                const roomsCount = await client.query('SELECT COUNT(*) as count FROM rooms');
                const bookingsCount = await client.query('SELECT COUNT(*) as count FROM bookings');

                log('cyan', 'ℹ️', `Rooms: ${roomsCount.rows[0].count} records`);
                log('cyan', 'ℹ️', `Bookings: ${bookingsCount.rows[0].count} records`);

                if (parseInt(roomsCount.rows[0].count) === 0) {
                    log('yellow', '⚠️', 'No rooms found - you may want to insert sample data');
                }
            } catch (error) {
                log('red', '❌', `Error checking data: ${error.message}`);
            }
        }

        // 8. Performance Test
        logSection('Performance Test');

        log('blue', '🔍', 'Running performance test...');
        const perfStart = Date.now();

        for (let i = 0; i < 5; i++) {
            await client.query('SELECT 1');
        }

        const perfTime = Date.now() - perfStart;
        log('green', '✅', `5 queries completed in ${perfTime}ms (avg: ${(perfTime/5).toFixed(2)}ms per query)`);

        // 9. Final Summary
        logSection('Connection Test Summary');
        log('green', '🎉', 'All tests passed successfully!');
        log('green', '✅', 'Database connection is working properly');
        log('cyan', 'ℹ️', 'Your Netlify Functions should be able to connect to this database');

        return true;

    } catch (error) {
        const connectionTime = Date.now() - startTime;
        log('red', '❌', `Connection failed after ${connectionTime}ms`);
        log('red', '💥', `Error: ${error.message}`);

        // Detailed error analysis
        if (error.code) {
            log('red', '🔍', `Error Code: ${error.code}`);
        }

        if (error.message.includes('ECONNREFUSED')) {
            log('yellow', '💡', 'Connection refused - check if the hostname and port are correct');
        } else if (error.message.includes('ENOTFOUND')) {
            log('yellow', '💡', 'Host not found - verify the hostname in your DATABASE_URL');
        } else if (error.message.includes('timeout')) {
            log('yellow', '💡', 'Connection timeout - the database might be sleeping or unreachable');
        } else if (error.message.includes('authentication')) {
            log('yellow', '💡', 'Authentication failed - check username and password');
        } else if (error.message.includes('SSL')) {
            log('yellow', '💡', 'SSL connection issue - verify SSL settings');
        }

        return false;

    } finally {
        if (client) {
            try {
                client.release();
                log('blue', '🔄', 'Connection released');
            } catch (e) {
                log('yellow', '⚠️', `Warning: ${e.message}`);
            }
        }

        try {
            await pool.end();
        } catch (e) {
            // Ignore pool cleanup errors
        }
    }
}

// Helper function for creating schema
function printSchemaSQL() {
    logSection('Database Schema Creation SQL');

    console.log(`${colors.green}-- Copy and run this SQL in your Neon Console if tables are missing:${colors.reset}\n`);

    const schemaSql = `-- Create rooms table
CREATE TABLE IF NOT EXISTS rooms (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    capacity INTEGER NOT NULL,
    location VARCHAR(255) NOT NULL,
    features JSONB DEFAULT '[]',
    description TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    room_id INTEGER REFERENCES rooms(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT DEFAULT '',
    contact_name VARCHAR(255) NOT NULL,
    booking_date DATE NOT NULL,
    time_slot TIME NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Prevent double bookings
    UNIQUE(room_id, booking_date, time_slot)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bookings_room_date ON bookings(room_id, booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_date_time ON bookings(booking_date, time_slot);

-- Insert sample rooms
INSERT INTO rooms (name, capacity, location, features, description) VALUES
('Jemia', 30, 'Heinrich Lübcke Strasse 2', '["Beamer", "Whiteboard", "Mikrofone"]', 'Ideal für kleinere Team-Meetings und Präsentationen.'),
('TestRaum 2', 30, 'Gebäude B, 2. Stock', '["Beamer", "Soundsystem", "Klimaanlage", "Videokonferenz"]', 'Großer Konferenzsaal für Firmenpräsentationen und größere Veranstaltungen.'),
('MeetingRaum 3', 12, 'Gebäude A, 1. Stock', '["Whiteboard", "Bildschirm", "Klimaanlage"]', 'Kleiner Besprechungsraum für Team-Meetings und Diskussionen.')
ON CONFLICT DO NOTHING;

-- Insert sample bookings for today
INSERT INTO bookings (room_id, title, description, contact_name, booking_date, time_slot) VALUES
(1, 'Team-Meeting', 'Wöchentliches Team-Meeting', 'Max Mustermann', CURRENT_DATE, '09:00'),
(1, 'Projekt Besprechung', 'Diskussion über das neue Projekt', 'Maria Schmidt', CURRENT_DATE, '14:00'),
(2, 'Firmenpräsentation', 'Präsentation des Jahresberichts', 'Thomas Weber', CURRENT_DATE, '11:00')
ON CONFLICT DO NOTHING;`;

    console.log(schemaSql);
    console.log(`\n${colors.green}-- End of SQL${colors.reset}\n`);
}

// Main execution
async function main() {
    console.log(`${colors.magenta}${colors.bright}`);
    console.log('███╗   ███╗███████╗ ██████╗ ███╗   ██╗    ████████╗███████╗███████╗████████╗');
    console.log('████╗ ████║██╔════╝██╔═══██╗████╗  ██║    ╚══██╔══╝██╔════╝██╔════╝╚══██╔══╝');
    console.log('██╔████╔██║█████╗  ██║   ██║██╔██╗ ██║       ██║   █████╗  ███████╗   ██║   ');
    console.log('██║╚██╔╝██║██╔══╝  ██║   ██║██║╚██╗██║       ██║   ██╔══╝  ╚════██║   ██║   ');
    console.log('██║ ╚═╝ ██║███████╗╚██████╔╝██║ ╚████║       ██║   ███████╗███████║   ██║   ');
    console.log('╚═╝     ╚═╝╚══════╝ ╚═════╝ ╚═╝  ╚═══╝       ╚═╝   ╚══════╝╚══════╝   ╚═╝   ');
    console.log(`${colors.reset}`);

    console.log(`${colors.blue}Database Connection Tester for RoomBooking System${colors.reset}`);
    console.log(`${colors.blue}Testing connection to Neon PostgreSQL Database${colors.reset}\n`);

    const success = await testDatabaseConnection();

    if (!success) {
        console.log(`\n${colors.red}${colors.bright}Connection test failed!${colors.reset}`);
        console.log(`${colors.yellow}Please fix the issues above and try again.${colors.reset}\n`);
        printSchemaSQL();
        process.exit(1);
    } else {
        console.log(`\n${colors.green}${colors.bright}🎉 Connection test completed successfully!${colors.reset}`);
        console.log(`${colors.green}Your database is ready for the RoomBooking application.${colors.reset}\n`);
    }
}

// Handle command line arguments
if (process.argv.includes('--schema')) {
    printSchemaSQL();
} else {
    main().catch(error => {
        console.error(`${colors.red}${colors.bright}Unexpected error: ${error.message}${colors.reset}`);
        process.exit(1);
    });
}

// Export for use as module
module.exports = { testDatabaseConnection, printSchemaSQL };