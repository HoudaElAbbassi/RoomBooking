// netlify/functions/debug-env.js
// Temporäre Function zum Prüfen der Environment Variables

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers };
    }

    // Sammle Environment Variable Informationen
    const envInfo = {
        timestamp: new Date().toISOString(),

        // DATABASE_URL Info (ohne sensitive Daten preiszugeben)
        databaseUrl: {
            exists: !!process.env.DATABASE_URL,
            prefix: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 20) + '...' : 'NOT_SET',
            length: process.env.DATABASE_URL ? process.env.DATABASE_URL.length : 0,
            isPostgresql: process.env.DATABASE_URL ? process.env.DATABASE_URL.startsWith('postgresql://') : false,
            containsNeon: process.env.DATABASE_URL ? process.env.DATABASE_URL.includes('neon.tech') : false,
            containsLocalhost: process.env.DATABASE_URL ?
                (process.env.DATABASE_URL.includes('localhost') || process.env.DATABASE_URL.includes('127.0.0.1')) : false
        },

        // Alle Database-related Environment Variables (ohne Werte)
        databaseEnvVars: Object.keys(process.env)
            .filter(key =>
                key.toLowerCase().includes('database') ||
                key.toLowerCase().includes('neon') ||
                key.toLowerCase().includes('postgres') ||
                key.toLowerCase().includes('pg')
            )
            .map(key => ({
                name: key,
                exists: !!process.env[key],
                length: process.env[key] ? process.env[key].length : 0
            })),

        // Netlify-specific Environment Variables
        netlifyInfo: {
            deployId: process.env.DEPLOY_ID || 'not_set',
            deployUrl: process.env.DEPLOY_URL || 'not_set',
            context: process.env.CONTEXT || 'not_set',
            branch: process.env.BRANCH || 'not_set',
            commitRef: process.env.COMMIT_REF || 'not_set'
        },

        // Node.js Info
        nodeInfo: {
            version: process.version,
            platform: process.platform,
            arch: process.arch
        },

        // Function Context
        functionInfo: {
            httpMethod: event.httpMethod,
            path: event.path,
            headers: Object.keys(event.headers),
            awsRequestId: context.awsRequestId
        }
    };

    return {
        statusCode: 200,
        headers,
        body: JSON.stringify(envInfo, null, 2)
    };
};