// netlify/functions/auth.js
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// JWT Secret - In Produktion immer über Umgebungsvariable setzen!
function getJWTSecret() {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        console.warn('WARNUNG: JWT_SECRET Umgebungsvariable nicht gefunden. Verwende unsicheren Fallback-Wert. Dies sollte in Produktionsumgebungen vermieden werden!');
        // Fallback für Entwicklung und Tests - NICHT FÜR PRODUKTION VERWENDEN!
        return 'your-super-secret-jwt-key-change-in-production';
    }
    return secret;
}

const JWT_EXPIRES_IN = '24h';

// Environment Variable Validation
function validateEnvironment() {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
        throw new Error('DATABASE_URL environment variable not configured');
    }
    return dbUrl;
}

// Rate limiting: IP-basierte Zugriffszählung
const loginAttempts = new Map();
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 Minuten in Millisekunden

function checkRateLimit(ip) {
    const now = Date.now();
    const userAttempts = loginAttempts.get(ip) || { count: 0, timestamp: now };

    // Prüfen, ob die Sperrzeit vorbei ist
    if (userAttempts.count >= MAX_LOGIN_ATTEMPTS && now - userAttempts.timestamp < LOCKOUT_TIME) {
        const remainingTime = Math.ceil((LOCKOUT_TIME - (now - userAttempts.timestamp)) / 60000);
        return {
            allowed: false,
            remainingTime: remainingTime
        };
    }

    // Zurücksetzen des Zählers nach Ablauf der Sperrzeit
    if (userAttempts.count >= MAX_LOGIN_ATTEMPTS && now - userAttempts.timestamp >= LOCKOUT_TIME) {
        userAttempts.count = 0;
    }

    // Aktualisieren des Zählers
    userAttempts.count++;
    userAttempts.timestamp = now;
    loginAttempts.set(ip, userAttempts);

    return { allowed: true };
}

// Password hashing
async function hashPassword(password) {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
}

async function verifyPassword(password, hash) {
    return await bcrypt.compare(password, hash);
}

// Passwort-Komplexität überprüfen
function validatePassword(password) {
    // Mindestens 8 Zeichen
    if (password.length < 8) {
        return { valid: false, message: 'Passwort muss mindestens 8 Zeichen lang sein' };
    }

    // Prüfung auf Komplexität
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(password);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
        return {
            valid: false,
            message: 'Passwort muss mindestens einen Großbuchstaben, einen Kleinbuchstaben und eine Zahl enthalten'
        };
    }

    if (!hasSpecialChar) {
        return {
            valid: false,
            message: 'Passwort muss mindestens ein Sonderzeichen enthalten (z.B. !@#$%^&*)'
        };
    }

    return { valid: true };
}

// JWT Token generation
function generateToken(user) {
    return jwt.sign(
        {
            userId: user.id,
            username: user.username,
            role: user.role
        },
        getJWTSecret(),
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
        return jwt.verify(token, getJWTSecret());
    } catch (error) {
        return null;
    }
}

exports.handler = async (event, context) => {
    // CORS-Einstellungen verbessern: Nur spezifische Ursprünge erlauben
    const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:3000'];
    const origin = event.headers.origin || '*';

    // Prüfen, ob der Ursprung erlaubt ist, sonst Standard-Domain verwenden
    const allowedOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];

    const headers = {
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers };
    }

    // Client IP für Rate-Limiting
    const clientIP = event.headers['client-ip'] || event.headers['x-forwarded-for'] || 'unknown';

    let dbUrl;
    try {
        dbUrl = validateEnvironment();
    } catch (error) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Configuration error'
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
            // Rate-Limiting prüfen
            const rateCheck = checkRateLimit(clientIP);
            if (!rateCheck.allowed) {
                return {
                    statusCode: 429,
                    headers,
                    body: JSON.stringify({
                        error: `Zu viele Anmeldeversuche. Bitte versuchen Sie es in ${rateCheck.remainingTime} Minuten erneut.`
                    })
                };
            }

            const { username, password, rememberMe } = JSON.parse(event.body);

            if (!username || !password) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'Benutzername und Passwort sind erforderlich' })
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
                    body: JSON.stringify({ error: 'Ungültige Anmeldedaten' })
                };
            }

            const user = userResult.rows[0];

            if (!user.is_active) {
                return {
                    statusCode: 401,
                    headers,
                    body: JSON.stringify({ error: 'Konto ist deaktiviert' })
                };
            }

            // Verify password
            const passwordMatch = await verifyPassword(password, user.password_hash);
            if (!passwordMatch) {
                return {
                    statusCode: 401,
                    headers,
                    body: JSON.stringify({ error: 'Ungültige Anmeldedaten' })
                };
            }

            // Bei erfolgreicher Anmeldung Login-Versuche zurücksetzen
            loginAttempts.delete(clientIP);

            // Generate tokens
            const jwtToken = generateToken(user);
            const sessionToken = generateSessionToken();

            // Ablaufzeit je nach "Angemeldet bleiben" Option setzen
            const expiresAt = new Date(Date.now() + (rememberMe ? 30 : 1) * 24 * 60 * 60 * 1000); // 30 oder 1 Tag

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
                    body: JSON.stringify({ error: 'Kein Autorisierungstoken angegeben' })
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
                body: JSON.stringify({ message: 'Abmeldung erfolgreich' })
            };
        }

        // Verify Token Endpoint
        if (event.httpMethod === 'GET' && event.path.endsWith('/verify')) {
            const authHeader = event.headers.authorization;
            if (!authHeader) {
                return {
                    statusCode: 401,
                    headers,
                    body: JSON.stringify({ error: 'Kein Autorisierungstoken angegeben' })
                };
            }

            const token = authHeader.replace('Bearer ', '');
            const decoded = verifyToken(token);

            if (!decoded) {
                return {
                    statusCode: 401,
                    headers,
                    body: JSON.stringify({ error: 'Ungültiges Token' })
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
                    body: JSON.stringify({ error: 'Sitzung abgelaufen oder ungültig' })
                };
            }

            const session = sessionResult.rows[0];

            if (!session.is_active) {
                return {
                    statusCode: 401,
                    headers,
                    body: JSON.stringify({ error: 'Konto ist deaktiviert' })
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
                    body: JSON.stringify({ error: 'Benutzername, E-Mail und Passwort sind erforderlich' })
                };
            }

            // Passwort-Komplexität überprüfen
            const passwordValidation = validatePassword(password);
            if (!passwordValidation.valid) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: passwordValidation.message })
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
                    body: JSON.stringify({ error: 'Benutzername oder E-Mail existiert bereits' })
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
                    message: 'Benutzer erfolgreich erstellt',
                    user: newUser
                })
            };
        }

        // Update Profile Endpoint (neu)
        if (event.httpMethod === 'POST' && event.path.endsWith('/update-profile')) {
            const authHeader = event.headers.authorization;
            if (!authHeader) {
                return {
                    statusCode: 401,
                    headers,
                    body: JSON.stringify({ error: 'Kein Autorisierungstoken angegeben' })
                };
            }

            const token = authHeader.replace('Bearer ', '');
            const decoded = verifyToken(token);

            if (!decoded) {
                return {
                    statusCode: 401,
                    headers,
                    body: JSON.stringify({ error: 'Ungültiges Token' })
                };
            }

            const { username, email } = JSON.parse(event.body);

            if (!username || !email) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'Benutzername und E-Mail sind erforderlich' })
                };
            }

            // Überprüfen, ob Benutzername oder E-Mail bereits verwendet wird (außer vom aktuellen Benutzer)
            const existingUser = await client.query(
                'SELECT id FROM users WHERE (username = $1 OR email = $2) AND id != $3',
                [username, email, decoded.userId]
            );

            if (existingUser.rows.length > 0) {
                return {
                    statusCode: 409,
                    headers,
                    body: JSON.stringify({ error: 'Benutzername oder E-Mail wird bereits verwendet' })
                };
            }

            // Profil aktualisieren
            const updateResult = await client.query(
                'UPDATE users SET username = $1, email = $2 WHERE id = $3 RETURNING id, username, email, role',
                [username, email, decoded.userId]
            );

            if (updateResult.rows.length === 0) {
                return {
                    statusCode: 404,
                    headers,
                    body: JSON.stringify({ error: 'Benutzer nicht gefunden' })
                };
            }

            const updatedUser = updateResult.rows[0];

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    message: 'Profil erfolgreich aktualisiert',
                    user: updatedUser
                })
            };
        }

        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Methode nicht erlaubt' })
        };

    } catch (error) {
        console.error('Auth error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Authentifizierungsfehler'
            })
        };
    } finally {
        if (client) {
            client.release();
        }
    }
};