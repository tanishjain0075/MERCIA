const express = require('express');
const router = express.Router();
const {
  getItems, getItem, addItem, updateItem, deleteItem, updateStock, getCategories,
} = require('../controllers/inventoryController');
const { protect } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

router.use(protect); // all inventory routes require login

router.get('/categories', getCategories);
router.get('/', getItems);
router.get('/:id', getItem);
router.post('/', requireRole('admin'), addItem);
router.put('/:id', requireRole('admin'), updateItem);
router.delete('/:id', requireRole('admin'), deleteItem);
router.patch('/:id/stock', updateStock); // staff can adjust stock

module.exports = router;
