const express = require('express');
const router = express.Router();
const { getBills, getBill, createBill, duplicateBill, deleteBill } = require('../controllers/billController');
const { protect } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

router.use(protect);

router.get('/', getBills);
router.get('/:id', getBill);
router.post('/', createBill);
router.post('/:id/duplicate', duplicateBill);
router.delete('/:id', requireRole('admin'), deleteBill);

module.exports = router;
