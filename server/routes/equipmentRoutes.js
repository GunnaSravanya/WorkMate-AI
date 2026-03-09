import express from 'express';
import {
    addEquipment,
    searchEquipment,
    getOwnerEquipment,
    toggleAvailability,
    bookEquipment,
    updateRentalStatus,
    updateEquipment,
    deleteEquipment,
    getEquipmentDetails
} from '../controllers/equipmentController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// @route   POST /api/equipment/add
// @desc    Add new equipment
// @access  Private
router.post('/add', auth, addEquipment);

// @route   GET /api/equipment/search
// @desc    Search equipment
// @access  Public (or Private depending on needs, sticking to requirements)
router.get('/search', searchEquipment);

// @route   GET /api/equipment/owner/:id
// @desc    Get equipment by owner
// @access  Private
router.get('/owner/:id', auth, getOwnerEquipment);

// @route   PATCH /api/equipment/availability/:id
// @desc    Toggle equipment availability
// @access  Private
router.patch('/availability/:id', auth, toggleAvailability);

// @route   GET /api/equipment/:id
// @desc    Get equipment details
// @access  Public
router.get('/:id', getEquipmentDetails);

// @route   PUT /api/equipment/:id
// @desc    Update equipment
// @access  Private
router.put('/:id', auth, updateEquipment);

// @route   DELETE /api/equipment/:id
// @desc    Delete equipment
// @access  Private
router.delete('/:id', auth, deleteEquipment);

// @route   POST /api/equipment/book/:id
// @desc    Book equipment (Instant)
// @access  Private
router.post('/book/:id', auth, bookEquipment);

// @route   PATCH /api/equipment/rental-status/:rentalId
// @desc    Update rental checklist status
// @access  Private
router.patch('/rental-status/:rentalId', auth, updateRentalStatus);

export default router;
