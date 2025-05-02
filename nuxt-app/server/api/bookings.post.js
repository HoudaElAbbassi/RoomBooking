// server/api/bookings.post.js
import Room from "~~/server/models/room.model.js";
import Booking from "~~/server/models/booking.model.js";
import {handleMongoError} from "~~/server/utils/mongodb.js";

export default defineEventHandler(async (event) => {
    try {
        const body = await readBody(event);

        // Validate required fields
        if (!body.roomId || !body.date || !body.timeSlot || !body.title || !body.contactName) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Missing required fields'
            });
        }

        // Check if the room exists
        const roomExists = await Room.exists({ _id: body.roomId });
        if (!roomExists) {
            throw createError({
                statusCode: 404,
                statusMessage: 'Room not found'
            });
        }

        // Check if the time slot is already booked
        const existingBooking = await Booking.findOne({
            roomId: body.roomId,
            date: body.date,
            timeSlot: body.timeSlot
        });

        if (existingBooking) {
            throw createError({
                statusCode: 409,
                statusMessage: 'This time slot is already booked'
            });
        }

        // Create new booking
        const booking = new Booking(body);
        await booking.save();

        return booking;
    } catch (error) {
        console.error('Error creating booking:', error);
        throw handleMongoError(error);
    }
});