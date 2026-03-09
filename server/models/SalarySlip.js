import mongoose from 'mongoose';

const salarySlipSchema = new mongoose.Schema({
    workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' }, // Can be null for manual entries
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    contractorName: { type: String },
    location: { type: String },
    role: { type: String },
    isVerified: { type: Boolean, default: false },
    slipId: { type: String, unique: true, required: true },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('SalarySlip', salarySlipSchema);
