import { d as defineEventHandler, a as getMethod, r as readBody, c as createError, g as getQuery } from '../../nitro/nitro.mjs';
import { MongoClient } from 'mongodb';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';

const bookings = defineEventHandler(async (event) => {
  const method = getMethod(event);
  if (method === "POST") {
    const body = await readBody(event);
    if (!body.roomId || !body.date || !body.timeSlot || !body.title || !body.contactName) {
      throw createError({
        statusCode: 400,
        statusMessage: "Fehlende Pflichtfelder"
      });
    }
    try {
      const client = new MongoClient(process.env.MONGODB_URI || "mongodb://localhost:27017");
      await client.connect();
      const db = client.db("raumbelegung");
      const collection = db.collection("bookings");
      const existingBooking = await collection.findOne({
        roomId: body.roomId,
        date: body.date,
        timeSlot: body.timeSlot
      });
      if (existingBooking) {
        await client.close();
        throw createError({
          statusCode: 409,
          statusMessage: "Dieser Zeitslot ist bereits belegt"
        });
      }
      const result = await collection.insertOne({
        roomId: body.roomId,
        date: body.date,
        timeSlot: body.timeSlot,
        title: body.title,
        description: body.description || "",
        contactName: body.contactName,
        createdAt: /* @__PURE__ */ new Date()
      });
      const savedBooking = await collection.findOne({ _id: result.insertedId });
      await client.close();
      return savedBooking;
    } catch (error) {
      if (error.statusCode) {
        throw error;
      }
      console.error("MongoDB Error:", error);
      throw createError({
        statusCode: 500,
        statusMessage: "Datenbank-Fehler"
      });
    }
  } else if (method === "GET") {
    try {
      const client = new MongoClient(process.env.MONGODB_URI || "mongodb://localhost:27017");
      await client.connect();
      const db = client.db("raumbelegung");
      const collection = db.collection("bookings");
      const query = getQuery(event);
      const filter = {};
      if (query.roomId) {
        filter.roomId = query.roomId;
      }
      if (query.date) {
        filter.date = query.date;
      }
      const bookings = await collection.find(filter).toArray();
      await client.close();
      return bookings;
    } catch (error) {
      console.error("MongoDB Error:", error);
      return [
        {
          id: 1,
          roomId: 1,
          title: "Team-Meeting",
          description: "W\xF6chentliches Team-Meeting",
          contactName: "Max Mustermann",
          date: "2025-04-24",
          timeSlot: "09:00"
        },
        {
          id: 2,
          roomId: 2,
          title: "Firmenpr\xE4sentation",
          description: "Pr\xE4sentation des Jahresberichts",
          contactName: "Anna Schmidt",
          date: "2025-04-24",
          timeSlot: "14:00"
        }
      ];
    }
  }
});

export { bookings as default };
//# sourceMappingURL=bookings.mjs.map
