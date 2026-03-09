import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['worker', 'contractor'], required: true },
    location: { type: String },
    // Worker specific
    age: { type: Number },
    skills: [{ type: String }],
    availability: { type: String },
    idProof: { type: String }, // Store filename or URL
    // Contractor specific
    company: { type: String },
    totalEarnings: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

userSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

export default mongoose.model('User', userSchema);
