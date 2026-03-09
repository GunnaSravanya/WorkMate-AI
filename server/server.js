import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import schemesRoutes from './routes/schemes.js';
import loansRoutes from './routes/loans.js';
import jobsRoutes from './routes/jobs.js';
import verificationRoutes from './routes/verification.js';
import equipmentRoutes from './routes/equipmentRoutes.js';
import chatRoutes from './routes/chat.js';
import User from './models/User.js';
import { notifications, users as inMemoryUsers } from './data/store.js';

let isDbConnected = false;

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Request Logger
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// MongoDB Connection with Auto-Reconnect
const connectDB = async () => {
    try {
        console.log('Attempting to connect to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 5000,
        });
        isDbConnected = true;
        console.log('Connected to MongoDB Atlas');
    } catch (err) {
        isDbConnected = false;
        console.error('MongoDB connection error:', err.message);
        console.log('Retrying in 10 seconds...');
        setTimeout(connectDB, 10000);
    }
};

connectDB();

// In-memory store for notifications (can be migrated to DB later if needed)

// Auth Routes
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        let user;

        if (isDbConnected) {
            user = await User.findOne({ email });
        } else {
            console.log('Login: Using in-memory fallback');
            user = inMemoryUsers.find(u => u.email === email);
        }

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isMatch = isDbConnected
            ? await bcrypt.compare(password, user.password)
            : password === user.password; // Simple check for in-memory

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user._id || user.id }, process.env.JWT_SECRET || 'workmate_secret', { expiresIn: '7d' });
        return res.json({ token, user });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'Server error during login', error: err.message });
    }
});

app.post('/api/auth/register', async (req, res) => {
    try {
        console.log('--- Registration Attempt ---');
        console.log('Body:', JSON.stringify({ ...req.body, password: '***' }, null, 2));

        const { name, email, password, role, age, location, skills, availability, company } = req.body;

        if (!name || !email || !password || !role) {
            console.log('Error: Missing required fields');
            return res.status(400).json({ message: 'Missing required fields' });
        }

        let existingUser;
        if (isDbConnected) {
            existingUser = await User.findOne({ email });
        } else {
            console.log('DB disconnected - searching in-memory');
            existingUser = inMemoryUsers.find(u => u.email === email);
        }

        if (existingUser) {
            console.log('Error: User already exists');
            return res.status(409).json({ message: 'User already exists' });
        }

        const hashedPassword = isDbConnected ? await bcrypt.hash(password, 10) : password;

        let parsedAge = undefined;
        if (age !== undefined && age !== null && age !== '') {
            const num = Number(age);
            if (!isNaN(num)) {
                parsedAge = num;
            } else {
                console.log('Warning: Age is not a number, treating as undefined:', age);
            }
        }

        // Prepare data for Mongoose/In-Memory
        const userData = {
            name,
            email,
            password: hashedPassword,
            role,
            age: parsedAge,
            location,
            skills: Array.isArray(skills) ? skills : [],
            availability,
            company
        };

        let savedUser;
        if (isDbConnected) {
            try {
                console.log('Attempting DB save...');
                const user = new User(userData);
                savedUser = await user.save();
                console.log('DB save successful. ID:', savedUser._id);
            } catch (dbErr) {
                console.error('Mongoose Save Error Details:');
                if (dbErr.errors) {
                    Object.keys(dbErr.errors).forEach(key => {
                        console.error(`- Field "${key}": ${dbErr.errors[key].message}`);
                    });
                } else {
                    console.error(dbErr);
                }
                throw dbErr; // Let the outer catch handle response
            }
        } else {
            savedUser = {
                ...userData,
                _id: 'mem_' + Date.now(),
                id: 'mem_' + Date.now()
            };
            inMemoryUsers.push(savedUser);
            console.log('In-memory save successful');
        }

        const token = jwt.sign(
            { id: savedUser._id || savedUser.id },
            process.env.JWT_SECRET || 'workmate_secret',
            { expiresIn: '7d' }
        );

        console.log('Registration success complete');
        return res.status(201).json({ token, user: savedUser });
    } catch (err) {
        console.error('Final Registration Catch:', err.name, err.message);
        res.status(500).json({
            message: 'Server error during registration',
            error: err.message,
            type: err.name
        });
    }
});

app.use('/api/schemes', schemesRoutes);
app.use('/api/loans', loansRoutes);
app.use('/api/jobs', jobsRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/chat', chatRoutes);

// Notifications endpoints
app.get('/api/notifications/:userId', (req, res) => {
    const userNotifications = notifications.filter(n => String(n.userId) === String(req.params.userId));
    res.json(userNotifications);
});

app.post('/api/notifications', (req, res) => {
    const { userId, message } = req.body;
    const newNotification = {
        id: 'notif-' + Date.now(),
        userId,
        message,
        createdAt: new Date().toISOString()
    };
    notifications.push(newNotification);
    res.status(201).json(newNotification);
});

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'OK', db: isDbConnected ? 'connected' : 'disconnected' }));

// 404 Handler for API routes (Return JSON instead of HTML)
app.use(/^\/api\/.*/, (req, res) => {
    console.warn(`[404] API route not found: ${req.method} ${req.originalUrl}`);
    res.status(404).json({
        message: 'API route not found',
        method: req.method,
        path: req.originalUrl
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error(`[INTERNAL ERROR] ${req.method} ${req.url}:`, err);
    res.status(500).json({
        message: 'Internal server error',
        error: err.message,
        path: req.url
    });
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

export { notifications };
