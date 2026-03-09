import mongoose from 'mongoose';

const rentalSchema = new mongoose.Schema({
    equipment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Equipment',
        required: true
    },
    renter: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['confirmed', 'cancelled', 'completed'],
        default: 'confirmed'
    },
    priceAtBooking: {
        type: Number,
        required: true
    },
    bookingDate: {
        type: Date,
        default: Date.now
    },
    equipmentGiven: {
        type: Boolean,
        default: false
    },
    equipmentReturned: {
        type: Boolean,
        default: false
    },
    paymentDone: {
        type: Boolean,
        default: false
    }
});

const Rental = mongoose.model('Rental', rentalSchema);

export default Rental;
