const { MongoClient } = require('mongodb');

// Connection details from your provided code
const username = 'VestRoom_volumedish';
const password = '928018602172bc8cf6a647ca8caecea27decbfec';
const hostname = 'jz0o3.h.filess.io';
const port = '27018';
const database = 'VestRoom_volumedish';

// Format exactly as in your original code
const url = "mongodb://" + username + ":" + password + "@" + hostname + ":" + port + "/" + database;

console.log("Attempting to connect to MongoDB...");
console.log(`Host: ${hostname}:${port}`);
console.log(`Database: ${database}`);

// Testing connection
async function testConnection() {
    let client;
    try {
        // Set a shorter timeout for faster feedback
        client = new MongoClient(url, {
            serverSelectionTimeoutMS: 1000000,
            connectTimeoutMS: 1000000
        });

        await client.connect();
        console.log("Connected successfully to MongoDB!");

        // Try a simple command to verify database access
        const dbList = await client.db().admin().listDatabases();
        console.log("Available databases:");
        dbList.databases.forEach(db => console.log(` - ${db.name}`));

        return true;
    } catch (error) {
        console.error("Connection error:", error);
        return false;
    } finally {
        if (client) {
            await client.close();
            console.log("Connection closed");
        }
    }
}

testConnection();