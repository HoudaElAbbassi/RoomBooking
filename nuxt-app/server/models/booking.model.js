// server/models/booking.model.js
import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
    roomId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room',
        required: [true, 'Room ID is required']
    },
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true
    },
    description: {
        type: String,
        default: ''
    },
    contactName: {
        type: String,
        required: [true, 'Contact name is required'],
        trim: true
    },
    date: {
        type: String, // Using string format YYYY-MM-DD for easy querying
        required: [true, 'Date is required'],
        validate: {
            validator: function(v) {
                return /^\d{4}-\d{2}-\d{2}$/.test(v);
            },
            message: props => `${props.value} is not a valid date format! Use YYYY-MM-DD`
        }
    },
    timeSlot: {
        type: String,
        required: [true, 'Time slot is required'],
        validate: {
            validator: function(v) {
                return /^([01]\d|2[0-3]):00$/.test(v);
            },
            message: props => `${props.value} is not a valid time slot! Use HH:00 format`
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Add a compound index to ensure no double bookings
bookingSchema.index({ roomId: 1, date: 1, timeSlot: 1 }, { unique: true });

// Only create the model on the server side
const Booking = mongoose.models.Booking || mongoose.model('Booking', bookingSchema);

export default Booking;