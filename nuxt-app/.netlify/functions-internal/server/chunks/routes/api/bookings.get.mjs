import { d as defineEventHandler, g as getQuery } from '../../nitro/nitro.mjs';
import { B as Booking } from '../../_/booking.model.mjs';
import { i as isValidObjectId, h as handleMongoError } from '../../_/mongodb.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'mongoose';

const bookings_get = defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const filter = {};
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
    const bookings = await Booking.find(filter).sort({ date: 1, timeSlot: 1 }).populate("roomId", "name location");
    return bookings;
  } catch (error) {
    console.error("Error fetching bookings:", error);
    throw handleMongoError(error);
  }
});

export { bookings_get as default };
//# sourceMappingURL=bookings.get.mjs.map
