import express from 'express';
import { notifications, users } from '../data/store.js';
import Job from '../models/Job.js';
import auth from '../middleware/auth.js';
const router = express.Router();

// In-memory jobs store now imported from ../data/store.js

// Get all jobs
router.get('/', async (req, res) => {
    try {
        const jobs = await Job.find().populate('contractorId', 'name').populate('workerId', 'name');
        res.json(jobs);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching jobs', error: err.message });
    }
});

// Get single job by ID
router.get('/:id', async (req, res) => {
    try {
        const job = await Job.findById(req.params.id).populate('contractorId', 'name').populate('workerId', 'name');
        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }
        res.json(job);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching job', error: err.message });
    }
});

// Create a new job
router.post('/', auth, async (req, res) => {
    try {
        const { title, description, skill, location, latitude, longitude, pay, days, schedule, type, workersNeeded, workerIdManual } = req.body; // Added workersNeeded, workerIdManual
        const contractorId = req.user.id; // Get from token

        if (!title || !location || !pay || !contractorId) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const newJob = new Job({
            title,
            description,
            skill: skill || 'General',
            location,
            latitude,
            longitude,
            pay: parseFloat(pay) || 0,
            duration: parseInt(days) || 1,
            startDate: new Date(),
            schedule: schedule || `${days} Days`,
            vacancies: parseInt(workersNeeded) || 1,
            contractorId,
            workerIdManual: workerIdManual || null,
            status: type === 'manual' ? 'paid' : 'open'
        });

        // Generate day-wise attendance
        if (days && days > 0) {
            const start = new Date();
            for (let i = 0; i < days; i++) {
                const d = new Date(start);
                d.setDate(d.getDate() + i);
                newJob.dailyAttendance.push({ date: d, status: 'pending' });
            }
        }

        await newJob.save();

        // Notify all workers (Simplified: needs User model update to truly filter by role)
        // For now, keeping legacy notification logic but could be improved
        res.status(201).json(newJob);
    } catch (err) {
        res.status(500).json({ message: 'Error creating job', error: err.message });
    }
});

// Accept a job (worker)
router.patch('/:id/accept', auth, async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);
        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }

        if (job.status !== 'open') {
            return res.status(400).json({ message: 'Job is not open' });
        }

        if (job.vacancies <= 0) {
            return res.status(400).json({ message: 'Job is full' });
        }

        const workerId = req.user.id; // Get from token

        // Create a clone for this worker
        const workerJob = new Job({
            title: job.title,
            description: job.description,
            skill: job.skill,
            location: job.location,
            latitude: job.latitude,
            longitude: job.longitude,
            pay: job.pay,
            duration: job.duration,
            startDate: job.startDate,
            schedule: job.schedule,
            contractorId: job.contractorId,
            workerId: workerId, // Assign to this worker
            parentJobId: job._id, // Link to master job
            status: 'accepted',
            vacancies: 0, // Individual job has no vacancies
            dailyAttendance: job.dailyAttendance.map(d => ({ date: d.date, status: 'pending' })) // Copy empty attendance
        });

        await workerJob.save();

        // Update Master Job
        job.vacancies -= 1;
        job.workersAccepted += 1;

        // If no vacancies left, close the master job (or keeping it 'accepted' is confusing, let's keep it open but 0 vacancies means hidden from search)
        // Or if we want to remove it from feed:
        if (job.vacancies <= 0) {
            job.status = 'accepted'; // Effectively closed for new apps
        }

        await job.save();

        // Notify contractor
        notifications.push({
            id: 'notif-' + Date.now(),
            userId: String(job.contractorId._id || job.contractorId),
            message: `Your job "${job.title}" has been accepted by a worker. ${job.vacancies} spots left.`,
            createdAt: new Date().toISOString(),
            read: false,
            type: 'job_accepted'
        });

        // Return the NEW worker job so frontend redirects to it
        res.json(workerJob);
    } catch (err) {
        res.status(500).json({ message: 'Error accepting job', error: err.message });
    }
});

// Mark attendance
router.patch('/:id/attendance', auth, async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);
        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }

        const { status, dayIndex } = req.body;

        if (dayIndex !== undefined && dayIndex >= 0) {
            // Day-wise update
            if (job.dailyAttendance && job.dailyAttendance[dayIndex]) {
                job.dailyAttendance[dayIndex].status = status;
            }
        } else {
            // Legacy/Overall update
            job.attendance = status;
        }
        await job.save();

        res.json(job);
    } catch (err) {
        res.status(500).json({ message: 'Error marking attendance', error: err.message });
    }
});

// Complete job
router.patch('/:id/complete', auth, async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);
        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }

        job.status = 'completed';
        await job.save();

        // Notify worker
        notifications.push({
            id: 'notif-' + Date.now(),
            userId: String(job.workerId._id || job.workerId),
            message: `Job "${job.title}" has been completed.`,
            createdAt: new Date().toISOString(),
            read: false,
            type: 'job_completed'
        });

        res.json(job);
    } catch (err) {
        res.status(500).json({ message: 'Error completing job', error: err.message });
    }
});

// Pay job
router.patch('/:id/pay', auth, async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);
        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }

        job.status = 'paid';

        // Calculate proportional pay
        const totalDays = job.dailyAttendance ? job.dailyAttendance.length : 0;
        let finalAmount = job.pay;

        if (totalDays > 0) {
            const presentDays = job.dailyAttendance.filter(d => d.status === 'present').length;
            const ratio = presentDays / totalDays;
            finalAmount = Math.round(job.pay * ratio);
        }

        job.finalPayout = finalAmount;
        await job.save();

        // Notify worker of payment
        notifications.push({
            id: 'notif-pay-' + Date.now(),
            userId: String(job.workerId._id || job.workerId),
            message: `Payment released for "${job.title}". Check your dashboard for the Salary Slip.`,
            createdAt: new Date().toISOString(),
            read: false,
            type: 'payment_received'
        });

        res.json(job);
    } catch (err) {
        res.status(500).json({ message: 'Error paying job', error: err.message });
    }
});

export default router;
