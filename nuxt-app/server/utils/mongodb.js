// server/utils/mongodb.js
import mongoose from 'mongoose'

/**
 * Configure and establish MongoDB connection
 */
export async function connectToMongoDB() {
    const username = process.env.MONGODB_USERNAME || 'VestRoom_volumedish';
    const password = process.env.MONGODB_PASSWORD || '928018602172bc8cf6a647ca8caecea27decbfec';
    const hostname = process.env.MONGODB_HOST || 'jz0o3.h.filess.io';
    const port = process.env.MONGODB_PORT || '27018';
    const database = process.env.MONGODB_DATABASE || 'VestRoom_volumedish';

    const url = `mongodb://${username}:${password}@${hostname}:${port}/${database}`;

    try {
        await mongoose.connect(url, {
            directConnection: true,
            serverSelectionTimeoutMS: 5000,
            appName: 'Raumbelegungssystem'
        });
        console.log('Connected to MongoDB successfully');
        return true;
    } catch (error) {
        console.error('MongoDB connection error:', error);
        return false;
    }
}

/**
 * Helper to check if an ID is a valid MongoDB ObjectId
 */
export function isValidObjectId(id) {
    return mongoose.Types.ObjectId.isValid(id);
}

/**
 * Convert a string ID to a MongoDB ObjectId
 */
export function toObjectId(id) {
    return new mongoose.Types.ObjectId(id);
}

/**
 * Handle MongoDB errors in a consistent way
 */
export function handleMongoError(error) {
    console.error('MongoDB error:', error);

    if (error.code === 11000) {
        // Duplicate key error
        return createError({
            statusCode: 409,
            statusMessage: 'A duplicate entry was found'
        });
    }

    if (error.name === 'ValidationError') {
        // Mongoose validation error
        return createError({
            statusCode: 400,
            statusMessage: error.message
        });
    }

    // Default server error
    return createError({
        statusCode: 500,
        statusMessage: `Database error: ${error.message}`
    });
}