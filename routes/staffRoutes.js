const express = require('express');
const router = express.Router();
const { getStaff, getStaffMember, addStaff, updateStaff, deleteStaff } = require('../controllers/staffController');
const { protect } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

router.use(protect);

router.get('/', getStaff);
router.get('/:id', getStaffMember);
router.post('/', requireRole('admin'), addStaff);
router.put('/:id', requireRole('admin'), updateStaff);
router.delete('/:id', requireRole('admin'), deleteStaff);

module.exports = router;
