import { d as defineEventHandler, r as readBody, c as createError } from '../../nitro/nitro.mjs';
import { R as Room } from '../../_/room.model.mjs';
import { B as Booking } from '../../_/booking.model.mjs';
import { h as handleMongoError } from '../../_/mongodb.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'mongoose';

const bookings_post = defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    if (!body.roomId || !body.date || !body.timeSlot || !body.title || !body.contactName) {
      throw createError({
        statusCode: 400,
        statusMessage: "Missing required fields"
      });
    }
    const roomExists = await Room.exists({ _id: body.roomId });
    if (!roomExists) {
      throw createError({
        statusCode: 404,
        statusMessage: "Room not found"
      });
    }
    const existingBooking = await Booking.findOne({
      roomId: body.roomId,
      date: body.date,
      timeSlot: body.timeSlot
    });
    if (existingBooking) {
      throw createError({
        statusCode: 409,
        statusMessage: "This time slot is already booked"
      });
    }
    const booking = new Booking(body);
    await booking.save();
    return booking;
  } catch (error) {
    console.error("Error creating booking:", error);
    throw handleMongoError(error);
  }
});

export { bookings_post as default };
//# sourceMappingURL=bookings.post.mjs.map
