import mongoose from 'mongoose';

const verificationCallSchema = new mongoose.Schema({
    // Worker details to verify
    workerName: {
        type: String,
        required: true,
        trim: true
    },
    workerId: {
        type: String,
        required: true,
        trim: true
    },
    jobRole: {
        type: String,
        required: true,
        trim: true
    },
    contractorPhone: {
        type: String,
        required: true,
        trim: true
    },
    startDate: {
        type: String,
        required: true
    },
    endDate: {
        type: String,
        required: true
    },
    wageAmount: {
        type: Number,
        required: true
    },

    // Call configuration
    language: {
        type: String,
        enum: ['en', 'hi', 'te'],
        default: 'en'
    },

    // Twilio call tracking
    callSid: {
        type: String,
        default: null
    },

    // Call status
    status: {
        type: String,
        enum: ['pending', 'in-progress', 'completed', 'failed', 'no-answer'],
        default: 'pending'
    },

    // Response from contractor
    // 1 = confirmed, 2 = denied, null = no response
    response: {
        type: Number,
        enum: [1, 2, null],
        default: null
    },

    // Additional call metadata
    callDuration: {
        type: Number,
        default: 0
    },
    callStartedAt: {
        type: Date,
        default: null
    },
    callEndedAt: {
        type: Date,
        default: null
    },
    errorMessage: {
        type: String,
        default: null
    }
}, {
    timestamps: true
});

// Index for faster queries
verificationCallSchema.index({ callSid: 1 });
verificationCallSchema.index({ status: 1 });
verificationCallSchema.index({ createdAt: -1 });

const VerificationCall = mongoose.model('VerificationCall', verificationCallSchema);

export default VerificationCall;
