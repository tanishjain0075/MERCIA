const Inventory = require('../models/Inventory');

// ─────────────────────────────────────────────
// @desc    Get all inventory items (search, filter, sort, paginate)
// @route   GET /api/inventory
// @access  Private
// ─────────────────────────────────────────────
const getItems = async (req, res) => {
  try {
    const {
      search = '',
      category,
      status,
      sortBy = 'createdAt',
      order = 'desc',
      page = 1,
      limit = 50,
    } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { supplier: { $regex: search, $options: 'i' } },
      ];
    }
    if (category) query.category = { $regex: category, $options: 'i' };
    if (status) query.status = status;

    const sortOrder = order === 'asc' ? 1 : -1;
    const skip = (Number(page) - 1) * Number(limit);

    const [items, total] = await Promise.all([
      Inventory.find(query)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(Number(limit)),
      Inventory.countDocuments(query),
    ]);

    res.json({ success: true, total, page: Number(page), data: items });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// @desc    Get single item
// @route   GET /api/inventory/:id
// @access  Private
// ─────────────────────────────────────────────
const getItem = async (req, res) => {
  try {
    const item = await Inventory.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found.' });
    res.json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// @desc    Add new item
// @route   POST /api/inventory
// @access  Private (Admin)
// ─────────────────────────────────────────────
const addItem = async (req, res) => {
  try {
    const item = await Inventory.create(req.body);
    res.status(201).json({ success: true, data: item });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'SKU already exists.' });
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// @desc    Update item
// @route   PUT /api/inventory/:id
// @access  Private (Admin)
// ─────────────────────────────────────────────
const updateItem = async (req, res) => {
  try {
    const item = await Inventory.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!item) return res.status(404).json({ success: false, message: 'Item not found.' });

    // Manually trigger the pre-save hook for status by re-saving
    await item.save();

    res.json({ success: true, data: item });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// @desc    Delete item
// @route   DELETE /api/inventory/:id
// @access  Private (Admin)
// ─────────────────────────────────────────────
const deleteItem = async (req, res) => {
  try {
    const item = await Inventory.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found.' });
    res.json({ success: true, message: `"${item.name}" deleted successfully.` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// @desc    Update stock quantity (increase or decrease)
// @route   PATCH /api/inventory/:id/stock
// @access  Private
// ─────────────────────────────────────────────
const updateStock = async (req, res) => {
  try {
    const { change } = req.body; // positive = increase, negative = decrease
    if (typeof change !== 'number') {
      return res.status(400).json({ success: false, message: 'change must be a number.' });
    }

    const item = await Inventory.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found.' });

    const newQty = item.stockQty + change;
    if (newQty < 0) {
      return res.status(400).json({ success: false, message: `Insufficient stock. Available: ${item.stockQty}` });
    }

    item.stockQty = newQty;
    await item.save(); // triggers pre-save status update

    res.json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// @desc    Get all unique categories
// @route   GET /api/inventory/categories
// @access  Private
// ─────────────────────────────────────────────
const getCategories = async (req, res) => {
  try {
    const categories = await Inventory.distinct('category');
    res.json({ success: true, data: categories.filter(Boolean) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getItems, getItem, addItem, updateItem, deleteItem, updateStock, getCategories };
