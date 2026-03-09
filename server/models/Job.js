import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema({
    contractorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    workerIdManual: { type: String }, // For manual entry tracking
    parentJobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' }, // For multi-worker jobs
    title: { type: String, required: true },
    description: { type: String },
    skill: { type: String, required: true },
    location: { type: String, required: true },
    latitude: { type: Number },
    longitude: { type: Number },
    pay: { type: Number, required: true },
    duration: { type: Number, default: 1 }, // in days
    startDate: { type: Date, default: Date.now },
    schedule: { type: String },
    vacancies: { type: Number, default: 1 },
    workersAccepted: { type: Number, default: 0 },
    status: {
        type: String,
        enum: ['open', 'accepted', 'completed', 'paid'],
        default: 'open'
    },
    attendance: { type: String, enum: ['present', 'absent', null], default: null },
    dailyAttendance: [{
        date: { type: Date },
        status: { type: String, enum: ['present', 'absent', 'pending'], default: 'pending' }
    }],
    finalPayout: { type: Number },
    createdAt: { type: Date, default: Date.now }
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

jobSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

export default mongoose.model('Job', jobSchema);
