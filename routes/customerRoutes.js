const express = require('express');
const router = express.Router();
const { getCustomers, getCustomer, addCustomer, updateCustomer, deleteCustomer } = require('../controllers/customerController');
const { protect } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

router.use(protect);

router.get('/', getCustomers);
router.get('/:id', getCustomer);
router.post('/', addCustomer);
router.put('/:id', updateCustomer);
router.delete('/:id', requireRole('admin'), deleteCustomer);

module.exports = router;
