import Equipment from '../models/Equipment.js';
import Rental from '../models/Rental.js';
import User from '../models/User.js';
import { equipment as inMemoryEquipment, rentals as inMemoryRentals, users as inMemoryUsers } from '../data/store.js';
import mongoose from 'mongoose';

// Add new equipment
export const addEquipment = async (req, res) => {
    try {
        const isDbConnected = mongoose.connection.readyState === 1;
        console.log(`[ADD EQUIPMENT] DB State: ${isDbConnected ? 'Connected' : 'Disconnected'}`);
        console.log(`[ADD EQUIPMENT] Request from user: ${req.user.id}`);

        const { toolName, location, pricePerHour, description, phoneNumber } = req.body;
        const ownerId = req.user.id; // From auth middleware

        if (!toolName || !location || !pricePerHour || !phoneNumber) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const equipmentData = {
            toolName,
            owner: ownerId,
            location,
            pricePerHour: Number(pricePerHour),
            description,
            phoneNumber,
            available: true,
            createdAt: new Date()
        };

        let savedEquipment;
        if (isDbConnected) {
            const equipment = new Equipment(equipmentData);
            savedEquipment = await equipment.save();
            console.log(`[ADD EQUIPMENT] DB Save Success! ID: ${savedEquipment._id}`);
        } else {
            savedEquipment = {
                ...equipmentData,
                _id: 'mem_eq_' + Date.now().toString(),
                id: 'mem_eq_' + Date.now().toString()
            };
            inMemoryEquipment.push(savedEquipment);
            console.log('[ADD EQUIPMENT] In-memory Save Success!');
        }

        res.status(201).json(savedEquipment);
    } catch (err) {
        console.error(`[ADD EQUIPMENT] Error:`, err);
        res.status(500).json({ message: 'Server error while adding equipment', error: err.message });
    }
};

// Search equipment
export const searchEquipment = async (req, res) => {
    try {
        const isDbConnected = mongoose.connection.readyState === 1;
        const { toolName, location, minPrice, maxPrice } = req.query;

        if (isDbConnected) {
            let query = { available: true };
            if (toolName) query.toolName = { $regex: toolName, $options: 'i' };
            if (location) query.location = { $regex: location, $options: 'i' };
            if (minPrice || maxPrice) {
                query.pricePerHour = {};
                if (minPrice) query.pricePerHour.$gte = Number(minPrice);
                if (maxPrice) query.pricePerHour.$lte = Number(maxPrice);
            }
            const results = await Equipment.find(query).populate('owner', 'name email');
            return res.json(results);
        } else {
            console.log('Search: Using in-memory fallback');
            let results = inMemoryEquipment.filter(item => item.available);

            if (toolName) {
                results = results.filter(item => item.toolName.toLowerCase().includes(toolName.toLowerCase()));
            }
            if (location) {
                results = results.filter(item => item.location.toLowerCase().includes(location.toLowerCase()));
            }
            if (minPrice) {
                results = results.filter(item => item.pricePerHour >= Number(minPrice));
            }
            if (maxPrice) {
                results = results.filter(item => item.pricePerHour <= Number(maxPrice));
            }

            // Mock population
            const resultsWithPopulatedOwner = results.map(item => {
                const owner = inMemoryUsers.find(u => (u._id || u.id) === item.owner);
                return { ...item, owner: owner ? { name: owner.name, email: owner.email } : { name: 'Unknown User', email: '' } };
            });

            return res.json(resultsWithPopulatedOwner);
        }
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Get all equipment by owner
export const getOwnerEquipment = async (req, res) => {
    try {
        const isDbConnected = mongoose.connection.readyState === 1;
        const ownerId = req.params.id;

        if (isDbConnected) {
            const items = await Equipment.find({ owner: ownerId }).lean();

            // For each item, if it's not available, find the active rental
            const results = await Promise.all(items.map(async (item) => {
                if (!item.available) {
                    const rental = await Rental.findOne({
                        equipment: item._id,
                        status: 'confirmed'
                    }).populate('renter', 'name email');
                    return { ...item, currentRental: rental };
                }
                return item;
            }));

            return res.json(results);
        } else {
            const results = inMemoryEquipment.filter(item => item.owner === ownerId).map(item => {
                if (!item.available) {
                    const rental = inMemoryRentals.find(r => r.equipment === (item._id || item.id) && r.status === 'confirmed');
                    if (rental) {
                        const renter = inMemoryUsers.find(u => (u._id || u.id) === rental.renter);
                        return { ...item, currentRental: { ...rental, renter: renter ? { name: renter.name, email: renter.email } : { name: 'Unknown', email: '' } } };
                    }
                }
                return item;
            });
            return res.json(results);
        }
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Toggle availability
export const toggleAvailability = async (req, res) => {
    try {
        const isDbConnected = mongoose.connection.readyState === 1;
        const { id } = req.params;

        if (isDbConnected) {
            const equipment = await Equipment.findById(id);
            if (!equipment) return res.status(404).json({ message: 'Equipment not found' });
            if (equipment.owner.toString() !== req.user.id) return res.status(403).json({ message: 'Unauthorized' });
            equipment.available = !equipment.available;
            await equipment.save();
            return res.json(equipment);
        } else {
            const item = inMemoryEquipment.find(i => (i._id || i.id) === id);
            if (!item) return res.status(404).json({ message: 'Equipment not found' });
            if (item.owner !== req.user.id) return res.status(403).json({ message: 'Unauthorized' });
            item.available = !item.available;
            return res.json(item);
        }
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};
// Book equipment (Instant Booking)
export const bookEquipment = async (req, res) => {
    try {
        const isDbConnected = mongoose.connection.readyState === 1;
        const { id } = req.params;
        const renterId = req.user.id;

        if (isDbConnected) {
            // Atomic update to prevent race conditions
            const equipment = await Equipment.findOneAndUpdate(
                { _id: id, available: true },
                { available: false },
                { new: true }
            ).populate('owner', 'name email');

            if (!equipment) {
                console.error(`[BOOKING ERROR]: Equipment not found or already booked. ID: ${id}`);
                return res.status(400).json({ message: 'Equipment is already booked or not found' });
            }

            if (!equipment.owner) {
                console.error('[BOOKING ERROR]: Equipment owner not found or population failed for ID:', id);
                equipment.available = true;
                await equipment.save();
                return res.status(500).json({ message: 'Internal server error: Owner details missing' });
            }

            const ownerId = equipment.owner._id ? equipment.owner._id.toString() : equipment.owner.toString();

            if (ownerId === renterId) {
                equipment.available = true;
                await equipment.save();
                return res.status(400).json({ message: 'You cannot book your own equipment' });
            }

            const rental = new Rental({
                equipment: equipment._id,
                renter: renterId,
                owner: equipment.owner._id,
                priceAtBooking: equipment.pricePerHour,
                status: 'confirmed'
            });

            await rental.save();
            return res.status(201).json({ message: 'Booking confirmed successfully', rental, equipment });
        } else {
            const item = inMemoryEquipment.find(i => (i._id || i.id) === id && i.available);
            if (!item) return res.status(400).json({ message: 'Equipment is already booked or not found' });

            if (item.owner === renterId) {
                return res.status(400).json({ message: 'You cannot book your own equipment' });
            }

            item.available = false;
            const rental = {
                _id: 'mem_rent_' + Date.now(),
                equipment: item._id || item.id,
                renter: renterId,
                owner: item.owner,
                priceAtBooking: item.pricePerHour,
                status: 'confirmed',
                bookingDate: new Date()
            };
            inMemoryRentals.push(rental);

            return res.status(201).json({ message: 'Booking confirmed successfully', rental, equipment: item });
        }
    } catch (err) {
        console.error('[BOOKING ERROR]:', err);
        res.status(500).json({ message: 'Booking failed', error: err.message, stack: err.stack });
    }
};

// Update rental checklist status
export const updateRentalStatus = async (req, res) => {
    try {
        const isDbConnected = mongoose.connection.readyState === 1;
        const { rentalId } = req.params;
        const { field, value } = req.body;

        if (!['equipmentGiven', 'equipmentReturned', 'paymentDone'].includes(field)) {
            return res.status(400).json({ message: 'Invalid field' });
        }

        if (isDbConnected) {
            const rental = await Rental.findById(rentalId);
            if (!rental) return res.status(404).json({ message: 'Rental not found' });

            // Check if user is the owner
            if (rental.owner.toString() !== req.user.id) {
                return res.status(403).json({ message: 'Unauthorized' });
            }

            // Detect if payment is being confirmed for the first time
            if (field === 'paymentDone' && value === true && !rental.paymentDone) {
                await User.findByIdAndUpdate(rental.owner, {
                    $inc: { totalEarnings: rental.priceAtBooking }
                });
                console.log(`[PAYMENT CONFIRMED] Credited ₹${rental.priceAtBooking} to owner ${rental.owner}`);
            }

            rental[field] = value;

            // If everything is done, mark rental as completed and item as available again
            if (rental.equipmentGiven && rental.equipmentReturned && rental.paymentDone) {
                rental.status = 'completed';
                await Equipment.findByIdAndUpdate(rental.equipment, { available: true });
            }

            await rental.save();
            return res.json(rental);
        } else {
            const rental = inMemoryRentals.find(r => (r._id || r.id) === rentalId);
            if (!rental) return res.status(404).json({ message: 'Rental not found' });
            if (rental.owner !== req.user.id) return res.status(403).json({ message: 'Unauthorized' });

            // Detect if payment is being confirmed for the first time in memory
            if (field === 'paymentDone' && value === true && !rental.paymentDone) {
                const owner = inMemoryUsers.find(u => (u._id || u.id) === rental.owner);
                if (owner) {
                    owner.totalEarnings = (owner.totalEarnings || 0) + rental.priceAtBooking;
                    console.log(`[MEM PAYMENT CONFIRMED] Credited ₹${rental.priceAtBooking} to owner ${rental.owner}`);
                }
            }

            rental[field] = value;

            if (rental.equipmentGiven && rental.equipmentReturned && rental.paymentDone) {
                rental.status = 'completed';
                const item = inMemoryEquipment.find(i => (i._id || i.id) === rental.equipment);
                if (item) item.available = true;
            }

            return res.json(rental);
        }
    } catch (err) {
        console.error('[UPDATE RENTAL STATUS ERROR]:', err);
        res.status(500).json({ message: 'Update failed', error: err.message });
    }
};

// Update existing equipment
export const updateEquipment = async (req, res) => {
    try {
        const isDbConnected = mongoose.connection.readyState === 1;
        const { id } = req.params;
        const { toolName, location, pricePerHour, description, phoneNumber } = req.body;

        if (isDbConnected) {
            const equipment = await Equipment.findById(id);
            if (!equipment) return res.status(404).json({ message: 'Equipment not found' });
            if (equipment.owner.toString() !== req.user.id) return res.status(403).json({ message: 'Unauthorized' });

            equipment.toolName = toolName || equipment.toolName;
            equipment.location = location || equipment.location;
            equipment.pricePerHour = pricePerHour !== undefined ? Number(pricePerHour) : equipment.pricePerHour;
            equipment.description = description || equipment.description;
            equipment.phoneNumber = phoneNumber || equipment.phoneNumber;

            await equipment.save();
            return res.json(equipment);
        } else {
            const index = inMemoryEquipment.findIndex(item => (item._id || item.id) === id);
            if (index === -1) return res.status(404).json({ message: 'Equipment not found' });
            if (inMemoryEquipment[index].owner !== req.user.id) return res.status(403).json({ message: 'Unauthorized' });

            inMemoryEquipment[index] = {
                ...inMemoryEquipment[index],
                toolName: toolName || inMemoryEquipment[index].toolName,
                location: location || inMemoryEquipment[index].location,
                pricePerHour: pricePerHour !== undefined ? Number(pricePerHour) : inMemoryEquipment[index].pricePerHour,
                description: description || inMemoryEquipment[index].description,
                phoneNumber: phoneNumber || inMemoryEquipment[index].phoneNumber
            };
            return res.json(inMemoryEquipment[index]);
        }
    } catch (err) {
        console.error('[UPDATE EQUIPMENT ERROR]:', err);
        res.status(500).json({ message: 'Update failed', error: err.message });
    }
};

// Delete equipment
export const deleteEquipment = async (req, res) => {
    try {
        const isDbConnected = mongoose.connection.readyState === 1;
        const { id } = req.params;

        if (isDbConnected) {
            const equipment = await Equipment.findById(id);
            if (!equipment) return res.status(404).json({ message: 'Equipment not found' });
            if (equipment.owner.toString() !== req.user.id) return res.status(403).json({ message: 'Unauthorized' });

            // If it's currently booked, maybe prevent deletion? Let's allow but maybe warn in UX.
            // For now, simple delete.
            await Equipment.findByIdAndDelete(id);
            // Also delete any active rentals?
            await Rental.deleteMany({ equipment: id });

            return res.json({ message: 'Equipment deleted successfully' });
        } else {
            const index = inMemoryEquipment.findIndex(item => (item._id || item.id) === id);
            if (index === -1) return res.status(404).json({ message: 'Equipment not found' });
            if (inMemoryEquipment[index].owner !== req.user.id) return res.status(403).json({ message: 'Unauthorized' });

            inMemoryEquipment.splice(index, 1);
            // Clean up in-memory rentals
            const rentalIndices = [];
            inMemoryRentals.forEach((r, i) => {
                if (r.equipment === id) rentalIndices.push(i);
            });
            for (let i = rentalIndices.length - 1; i >= 0; i--) {
                inMemoryRentals.splice(rentalIndices[i], 1);
            }

            return res.json({ message: 'Equipment deleted successfully' });
        }
    } catch (err) {
        console.error('[DELETE EQUIPMENT ERROR]:', err);
        res.status(500).json({ message: 'Delete failed', error: err.message });
    }
};

// Get single equipment details
export const getEquipmentDetails = async (req, res) => {
    try {
        const isDbConnected = mongoose.connection.readyState === 1;
        const { id } = req.params;

        if (isDbConnected) {
            const equipment = await Equipment.findById(id).populate('owner', 'name email');
            if (!equipment) return res.status(404).json({ message: 'Equipment not found' });
            return res.json(equipment);
        } else {
            const item = inMemoryEquipment.find(i => (i._id || i.id) === id);
            if (!item) return res.status(404).json({ message: 'Equipment not found' });
            const owner = inMemoryUsers.find(u => (u._id || u.id) === item.owner);
            return res.json({ ...item, owner: owner ? { name: owner.name, email: owner.email } : null });
        }
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};
