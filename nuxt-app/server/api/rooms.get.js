// server/api/rooms.get.js
import Room from '../models/room.model';
import { handleMongoError } from '../utils/mongodb';

export default defineEventHandler(async (event) => {
    try {
        // Get query parameters (for filtering, if needed)
        const query = getQuery(event);

        // Build filter object
        const filter = {};

        // Add filters if provided in query
        if (query.capacity) {
            filter.capacity = { $gte: parseInt(query.capacity) };
        }

        if (query.features) {
            // If features is provided as a comma-separated list
            const featuresArray = query.features.split(',').map(f => f.trim());
            filter.features = { $all: featuresArray };
        }

        // Fetch rooms based on filter
        const rooms = await Room.find(filter).sort({ name: 1 });

        return rooms;
    } catch (error) {
        console.error('Error fetching rooms:', error);
        throw handleMongoError(error);
    }
});


