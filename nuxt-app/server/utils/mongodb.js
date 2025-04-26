// server/utils/mongodb.js
import mongoose from 'mongoose'

/**
 * Helper to check if an ID is a valid MongoDB ObjectId
 */
export function isValidObjectId(id) {
    return mongoose.Types.ObjectId.isValid(id)
}

/**
 * Convert a string ID to a MongoDB ObjectId
 */
export function toObjectId(id) {
    return new mongoose.Types.ObjectId(id)
}

/**
 * Handle MongoDB errors in a consistent way
 */
export function handleMongoError(error) {
    console.error('MongoDB error:', error)

    if (error.code === 11000) {
        // Duplicate key error
        return createError({
            statusCode: 409,
            statusMessage: 'A duplicate entry was found'
        })
    }

    if (error.name === 'ValidationError') {
        // Mongoose validation error
        return createError({
            statusCode: 400,
            statusMessage: error.message
        })
    }

    // Default server error
    return createError({
        statusCode: 500,
        statusMessage: `Database error: ${error.message}`
    })
}