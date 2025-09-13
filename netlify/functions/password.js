// netlify/functions/password.js
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// JWT Secret aus Umgebungsvariable
if (!process.env.JWT_SECRET) {
    console.error('WARNUNG: JWT_SECRET Umgebungsvariable ist nicht gesetzt. Die Anwendung ist nicht sicher!');
}
const JWT_SECRET = process.env.JWT_SECRET;

// Environment Variable Validation
function validateEnvironment() {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
        throw new Error('DATABASE_URL environment variable not configured');
    }

    if (!JWT_SECRET) {
        throw new Error('JWT_SECRET environment variable not configured');
    }

    return dbUrl;
}

// Verify JWT Token
function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
}

// Passwort-Validierung
function validatePassword(password) {
    // Mindestens 8 Zeichen
    if (password.length < 8) {
        return { valid: false, message: 'Passwort muss mindestens 8 Zeichen lang sein' };
    }

    // Prüfung auf Komplexität (mindestens ein Großbuchstabe, ein Kleinbuchstabe, eine Zahl und ein Sonderzeichen)
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

// Passwort hashen mit erhöhter Sicherheit
async function hashPassword(password) {
    const saltRounds = 12; // Erhöht von 10 auf 12 für bessere Sicherheit
    return await bcrypt.hash(password, saltRounds);
}

// Passwortvergleich
async function verifyPassword(password, hash) {
    return await bcrypt.compare(password, hash);
}

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers };
    }

    // Passwort-Änderungs-Endpunkt
    if (event.httpMethod === 'POST' && event.path.endsWith('/change-password')) {
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

        const { currentPassword, newPassword } = JSON.parse(event.body);

        // Validierung der Eingaben
        if (!currentPassword || !newPassword) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Aktuelles und neues Passwort sind erforderlich' })
            };
        }

        // Passwort-Komplexität überprüfen
        const passwordValidation = validatePassword(newPassword);
        if (!passwordValidation.valid) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: passwordValidation.message })
            };
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

            // Benutzer finden
            const userResult = await client.query(
                'SELECT id, password_hash FROM users WHERE id = $1',
                [decoded.userId]
            );

            if (userResult.rows.length === 0) {
                return {
                    statusCode: 404,
                    headers,
                    body: JSON.stringify({ error: 'Benutzer nicht gefunden' })
                };
            }

            const user = userResult.rows[0];

            // Aktuelles Passwort überprüfen
            const passwordMatch = await verifyPassword(currentPassword, user.password_hash);
            if (!passwordMatch) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'Aktuelles Passwort ist falsch' })
                };
            }

            // Neues Passwort hashen und speichern
            const newPasswordHash = await hashPassword(newPassword);
            await client.query(
                'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
                [newPasswordHash, decoded.userId]
            );

            // Alle aktiven Sessions löschen (erzwungenes Neu-Login mit neuem Passwort)
            await client.query(
                'DELETE FROM user_sessions WHERE user_id = $1',
                [decoded.userId]
            );

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    message: 'Passwort erfolgreich geändert. Bitte melden Sie sich erneut an.'
                })
            };

        } catch (error) {
            console.error('Passwort ändern Fehler:', error);
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({
                    error: 'Ein Fehler ist aufgetreten',
                    details: error.message
                })
            };
        } finally {
            if (client) {
                client.release();
            }
        }
    }

    return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Endpoint not found' })
    };
};
