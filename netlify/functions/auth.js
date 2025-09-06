// netlify/functions/auth.js
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// JWT Secret - in Produktion über Environment Variable setzen
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = '24h';

// Environment Variable Validation
function validateEnvironment() {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
        throw new Error('DATABASE_URL environment variable not configured');
    }
    return dbUrl;
}

// Password hashing
async function hashPassword(password) {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
}

async function verifyPassword(password, hash) {
    return await bcrypt.compare(password, hash);
}

// JWT Token generation
function generateToken(user) {
    return jwt.sign(
        {
            userId: user.id,
            username: user.username,
            role: user.role
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );
}

// Session token generation
function generateSessionToken() {
    return crypto.randomBytes(32).toString('hex');
}

// Verify JWT Token
function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
}

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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
        min: 0,
        acquireTimeoutMillis: 60000,
        createTimeoutMillis: 30000,
        destroyTimeoutMillis: 5000,
        idleTimeoutMillis: 30000,
    });

    let client;

    try {
        client = await pool.connect();

        // Login Endpoint
        if (event.httpMethod === 'POST' && event.path.endsWith('/login')) {
            const { username, password } = JSON.parse(event.body);

            if (!username || !password) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'Username and password are required' })
                };
            }

            // Find user
            const userResult = await client.query(
                'SELECT id, username, email, password_hash, role, is_active FROM users WHERE username = $1',
                [username]
            );

            if (userResult.rows.length === 0) {
                return {
                    statusCode: 401,
                    headers,
                    body: JSON.stringify({ error: 'Invalid credentials' })
                };
            }

            const user = userResult.rows[0];

            if (!user.is_active) {
                return {
                    statusCode: 401,
                    headers,
                    body: JSON.stringify({ error: 'Account is deactivated' })
                };
            }

            // Verify password
            const passwordMatch = await verifyPassword(password, user.password_hash);
            if (!passwordMatch) {
                return {
                    statusCode: 401,
                    headers,
                    body: JSON.stringify({ error: 'Invalid credentials' })
                };
            }

            // Generate tokens
            const jwtToken = generateToken(user);
            const sessionToken = generateSessionToken();
            const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

            // Save session
            await client.query(
                'INSERT INTO user_sessions (user_id, session_token, expires_at) VALUES ($1, $2, $3)',
                [user.id, sessionToken, expiresAt]
            );

            // Clean up expired sessions
            await client.query(
                'DELETE FROM user_sessions WHERE expires_at < NOW()'
            );

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    message: 'Login successful',
                    token: jwtToken,
                    sessionToken: sessionToken,
                    user: {
                        id: user.id,
                        username: user.username,
                        email: user.email,
                        role: user.role
                    }
                })
            };
        }

        // Logout Endpoint
        if (event.httpMethod === 'POST' && event.path.endsWith('/logout')) {
            const authHeader = event.headers.authorization;
            if (!authHeader) {
                return {
                    statusCode: 401,
                    headers,
                    body: JSON.stringify({ error: 'No authorization token provided' })
                };
            }

            const token = authHeader.replace('Bearer ', '');
            const decoded = verifyToken(token);

            if (decoded) {
                // Remove all sessions for this user
                await client.query(
                    'DELETE FROM user_sessions WHERE user_id = $1',
                    [decoded.userId]
                );
            }

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ message: 'Logout successful' })
            };
        }

        // Verify Token Endpoint
        if (event.httpMethod === 'GET' && event.path.endsWith('/verify')) {
            const authHeader = event.headers.authorization;
            if (!authHeader) {
                return {
                    statusCode: 401,
                    headers,
                    body: JSON.stringify({ error: 'No authorization token provided' })
                };
            }

            const token = authHeader.replace('Bearer ', '');
            const decoded = verifyToken(token);

            if (!decoded) {
                return {
                    statusCode: 401,
                    headers,
                    body: JSON.stringify({ error: 'Invalid token' })
                };
            }

            // Check if session exists and is not expired
            const sessionResult = await client.query(
                'SELECT s.*, u.username, u.email, u.role, u.is_active FROM user_sessions s JOIN users u ON s.user_id = u.id WHERE s.user_id = $1 AND s.expires_at > NOW()',
                [decoded.userId]
            );

            if (sessionResult.rows.length === 0) {
                return {
                    statusCode: 401,
                    headers,
                    body: JSON.stringify({ error: 'Session expired or invalid' })
                };
            }

            const session = sessionResult.rows[0];

            if (!session.is_active) {
                return {
                    statusCode: 401,
                    headers,
                    body: JSON.stringify({ error: 'Account is deactivated' })
                };
            }

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    valid: true,
                    user: {
                        id: session.user_id,
                        username: session.username,
                        email: session.email,
                        role: session.role
                    }
                })
            };
        }

        // Register Endpoint (optional)
        if (event.httpMethod === 'POST' && event.path.endsWith('/register')) {
            const { username, email, password, role = 'user' } = JSON.parse(event.body);

            if (!username || !email || !password) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'Username, email, and password are required' })
                };
            }

            // Check if user already exists
            const existingUser = await client.query(
                'SELECT id FROM users WHERE username = $1 OR email = $2',
                [username, email]
            );

            if (existingUser.rows.length > 0) {
                return {
                    statusCode: 409,
                    headers,
                    body: JSON.stringify({ error: 'Username or email already exists' })
                };
            }

            // Hash password and create user
            const passwordHash = await hashPassword(password);
            const newUserResult = await client.query(
                'INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, username, email, role',
                [username, email, passwordHash, role]
            );

            const newUser = newUserResult.rows[0];

            return {
                statusCode: 201,
                headers,
                body: JSON.stringify({
                    message: 'User created successfully',
                    user: newUser
                })
            };
        }

        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };

    } catch (error) {
        console.error('Auth error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Authentication error',
                details: error.message
            })
        };
    } finally {
        if (client) {
            client.release();
        }
    }
};