const express = require('express');
const router = express.Router();
const {
  getPurchaseBills, createPurchaseBill, updatePurchaseBill, deletePurchaseBill,
} = require('../controllers/purchaseBillController');
const { protect } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

router.use(protect);

router.get('/', getPurchaseBills);
router.post('/', createPurchaseBill);
router.put('/:id', requireRole('admin'), updatePurchaseBill);
router.delete('/:id', requireRole('admin'), deletePurchaseBill);

module.exports = router;
