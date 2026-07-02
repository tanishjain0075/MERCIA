const PurchaseBill = require('../models/PurchaseBill');
const Inventory = require('../models/Inventory');

// ─────────────────────────────────────────────
// @desc    Get all purchase bills
// @route   GET /api/purchase-bills
// @access  Private
// ─────────────────────────────────────────────
const getPurchaseBills = async (req, res) => {
  try {
    const { search = '', paymentStatus } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { supplier: { $regex: search, $options: 'i' } },
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { itemName: { $regex: search, $options: 'i' } },
      ];
    }
    if (paymentStatus) query.paymentStatus = paymentStatus;

    const bills = await PurchaseBill.find(query)
      .populate('inventory', 'name sku')
      .populate('createdBy', 'username')
      .sort({ purchaseDate: -1 });

    res.json({ success: true, total: bills.length, data: bills });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// @desc    Create purchase bill (increases inventory stock)
// @route   POST /api/purchase-bills
// @access  Private
// ─────────────────────────────────────────────
const createPurchaseBill = async (req, res) => {
  try {
    const { inventory: inventoryId, qty, purchasePrice, sellingPrice } = req.body;

    // Find inventory item to snapshot its name
    const invItem = await Inventory.findById(inventoryId);
    if (!invItem) {
      return res.status(404).json({ success: false, message: 'Inventory item not found.' });
    }

    const totalAmount = purchasePrice * qty;

    const bill = await PurchaseBill.create({
      ...req.body,
      itemName: invItem.name,
      totalAmount,
      createdBy: req.user._id,
    });

    // ── Increase inventory stock ──
    invItem.stockQty += qty;
    // Optionally update purchase/selling prices if provided
    if (purchasePrice) invItem.purchasePrice = purchasePrice;
    if (sellingPrice) invItem.sellingPrice = sellingPrice;
    await invItem.save(); // triggers status auto-update

    res.status(201).json({ success: true, data: bill });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// @desc    Update purchase bill
// @route   PUT /api/purchase-bills/:id
// @access  Private (Admin)
// ─────────────────────────────────────────────
const updatePurchaseBill = async (req, res) => {
  try {
    const bill = await PurchaseBill.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!bill) return res.status(404).json({ success: false, message: 'Purchase bill not found.' });
    res.json({ success: true, data: bill });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// @desc    Delete purchase bill
// @route   DELETE /api/purchase-bills/:id
// @access  Private (Admin)
// ─────────────────────────────────────────────
const deletePurchaseBill = async (req, res) => {
  try {
    const bill = await PurchaseBill.findByIdAndDelete(req.params.id);
    if (!bill) return res.status(404).json({ success: false, message: 'Purchase bill not found.' });
    res.json({ success: true, message: 'Purchase bill deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getPurchaseBills, createPurchaseBill, updatePurchaseBill, deletePurchaseBill };
