import mongoose from 'mongoose';

const equipmentSchema = new mongoose.Schema({
    toolName: {
        type: String,
        required: true,
        trim: true
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    location: {
        type: String,
        required: true
    },
    pricePerHour: {
        type: Number,
        required: true
    },
    phoneNumber: {
        type: String,
        required: true,
        trim: true
    },
    available: {
        type: Boolean,
        default: true
    },
    description: {
        type: String,
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Equipment = mongoose.model('Equipment', equipmentSchema);

export default Equipment;
