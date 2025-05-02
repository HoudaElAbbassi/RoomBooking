// server/models/room.model.js
import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true
    },
    capacity: {
        type: Number,
        required: [true, 'Capacity is required'],
        min: [1, 'Capacity must be at least 1']
    },
    location: {
        type: String,
        required: [true, 'Location is required'],
        trim: true
    },
    features: {
        type: [String],
        default: []
    },
    description: {
        type: String,
        default: ''
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Only create the model on the server side
const Room = mongoose.models.Room || mongoose.model('Room', roomSchema);

export default Room;