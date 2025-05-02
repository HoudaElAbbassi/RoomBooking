// server/api/bookings.get.js
import Booking from '../models/booking.model';
import Room from '../models/room.model';
import { handleMongoError, isValidObjectId } from '../utils/mongodb';

export default defineEventHandler(async (event) => {
    try {
        // Get query parameters
        const query = getQuery(event);

        // Build filter object
        const filter = {};

        // Add filters if provided in query
        if (query.roomId && isValidObjectId(query.roomId)) {
            filter.roomId = query.roomId;
        }

        if (query.date) {
            filter.date = query.date;
        }

        if (query.startDate && query.endDate) {
            filter.date = {
                $gte: query.startDate,
                $lte: query.endDate
            };
        }

        // Fetch bookings based on filter
        const bookings = await Booking.find(filter)
            .sort({ date: 1, timeSlot: 1 })
            .populate('roomId', 'name location'); // Optionally populate room details

        return bookings;
    } catch (error) {
        console.error('Error fetching bookings:', error);
        throw handleMongoError(error);
    }
});



