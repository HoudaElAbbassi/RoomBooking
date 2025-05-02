// server/api/rooms.post.js
export default defineEventHandler(async (event) => {
    try {
        const body = await readBody(event);

        // Validate required fields
        if (!body.name || !body.capacity || !body.location) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Missing required fields: name, capacity, and location'
            });
        }

        // Create new room
        const room = new Room(body);
        await room.save();

        return room;
    } catch (error) {
        console.error('Error creating room:', error);
        throw handleMongoError(error);
    }
});