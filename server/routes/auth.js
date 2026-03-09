import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { users as localUsers } from '../data/store.js';

const router = express.Router();

const isDBConnected = () => {
    // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
    return User.db.readyState === 1;
};

// Register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, role, skills, location, availability, age, company } = req.body;

        let user;
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Try MongoDB if connected
        try {
            if (isDBConnected()) {
                user = await User.findOne({ email });
                if (user) return res.status(400).json({ message: 'User already exists' });

                user = new User({
                    name, email, password: hashedPassword, role,
                    skills, location, availability, age, company
                });
                await user.save();
            } else {
                throw new Error('DB Disconnected');
            }
        } catch (dbErr) {
            console.log('MongoDB unavailable, using local memory store.');
            // Fallback to local memory
            if (localUsers.find(u => u.email === email)) {
                return res.status(400).json({ message: 'User already exists (offline)' });
            }
            user = {
                _id: 'local_' + Date.now(),
                name, email, password: hashedPassword, role,
                skills, location, availability, age, company,
                isOffline: true
            };
            localUsers.push(user);
        }

        const token = jwt.sign(
            { id: user._id || user.id, role: user.role },
            process.env.JWT_SECRET || 'workmate_secret',
            { expiresIn: '1d' }
        );

        res.status(201).json({
            token,
            user: {
                id: user._id || user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                skills: user.skills,
                location: user.location,
                availability: user.availability,
                age: user.age,
                company: user.company,
                isOffline: user.isOffline
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        let user;

        try {
            if (isDBConnected()) {
                user = await User.findOne({ email });
            } else {
                throw new Error('DB Disconnected');
            }
        } catch (dbErr) {
            console.log('MongoDB failed, checking local users.');
            user = localUsers.find(u => u.email === email);
        }

        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user._id || user.id, role: user.role },
            process.env.JWT_SECRET || 'workmate_secret',
            { expiresIn: '1d' }
        );

        res.json({
            token,
            user: {
                id: user._id || user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                skills: user.skills,
                location: user.location,
                availability: user.availability,
                age: user.age,
                company: user.company,
                isOffline: user.isOffline || false
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
