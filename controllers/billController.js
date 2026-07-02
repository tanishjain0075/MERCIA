const Bill = require('../models/Bill');
const Customer = require('../models/Customer');
const Inventory = require('../models/Inventory');

// ─────────────────────────────────────────────
// @desc    Get all bills (search, filter)
// @route   GET /api/bills
// @access  Private
// ─────────────────────────────────────────────
const getBills = async (req, res) => {
  try {
    const { search = '', paymentStatus, paymentMethod, page = 1, limit = 50 } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { billNumber: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { customerPhone: { $regex: search, $options: 'i' } },
      ];
    }
    if (paymentStatus) query.paymentStatus = paymentStatus;
    if (paymentMethod) query.paymentMethod = paymentMethod;

    const skip = (Number(page) - 1) * Number(limit);

    const [bills, total] = await Promise.all([
      Bill.find(query)
        .populate('createdBy', 'username')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Bill.countDocuments(query),
    ]);

    res.json({ success: true, total, page: Number(page), data: bills });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// @desc    Get single bill
// @route   GET /api/bills/:id
// @access  Private
// ─────────────────────────────────────────────
const getBill = async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id).populate('createdBy', 'username');
    if (!bill) return res.status(404).json({ success: false, message: 'Bill not found.' });
    res.json({ success: true, data: bill });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// @desc    Create new bill
// @route   POST /api/bills
// @access  Private
// Automatically: deducts inventory stock, updates customer totals
// ─────────────────────────────────────────────
const createBill = async (req, res) => {
  try {
    const {
      customerId,
      customerName,
      customerPhone,
      items,
      discountAmount = 0,
      taxAmount = 0,
      grandTotal,
      paymentMethod,
      paymentStatus,
      notes,
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Bill must have at least one item.' });
    }

    // ── 1. Validate stock availability for all items ──
    for (const item of items) {
      if (item.inventory) {
        const inv = await Inventory.findById(item.inventory);
        if (!inv) {
          return res.status(404).json({ success: false, message: `Inventory item not found: ${item.name}` });
        }
        if (inv.stockQty < item.qty) {
          return res.status(400).json({
            success: false,
            message: `Insufficient stock for "${inv.name}". Available: ${inv.stockQty}, Requested: ${item.qty}`,
          });
        }
      }
    }

    // ── 2. Create the bill ──
    const billData = {
      items,
      discountAmount,
      taxAmount,
      grandTotal,
      paymentMethod,
      paymentStatus: paymentStatus || 'Paid',
      notes,
      createdBy: req.user._id,
    };

    // Attach customer info (snapshot + reference)
    if (customerId) {
      billData.customer = customerId;
    }
    billData.customerName = customerName || 'Walk-in Customer';
    billData.customerPhone = customerPhone || '';

    const bill = await Bill.create(billData);

    // ── 3. Deduct inventory stock ──
    for (const item of items) {
      if (item.inventory) {
        const inv = await Inventory.findById(item.inventory);
        inv.stockQty -= item.qty;
        await inv.save(); // triggers auto status update
      }
    }

    // ── 4. Update customer totals if linked ──
    if (customerId) {
      const addToBalance = paymentStatus === 'Credit' ? grandTotal : 0;
      await Customer.findByIdAndUpdate(customerId, {
        $inc: {
          totalPurchases: grandTotal,
          outstandingBalance: addToBalance,
        },
      });
    }

    res.status(201).json({ success: true, data: bill });
  } catch (error) {
    console.error('Create bill error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// @desc    Duplicate a bill
// @route   POST /api/bills/:id/duplicate
// @access  Private
// ─────────────────────────────────────────────
const duplicateBill = async (req, res) => {
  try {
    const original = await Bill.findById(req.params.id).lean();
    if (!original) return res.status(404).json({ success: false, message: 'Bill not found.' });

    // Remove _id and billNumber so they get auto-generated
    delete original._id;
    delete original.billNumber;
    delete original.createdAt;
    delete original.updatedAt;
    original.createdBy = req.user._id;
    original.paymentStatus = 'Pending'; // duplicate starts as pending

    const newBill = await Bill.create(original);
    res.status(201).json({ success: true, data: newBill });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// @desc    Delete bill
// @route   DELETE /api/bills/:id
// @access  Private (Admin)
// ─────────────────────────────────────────────
const deleteBill = async (req, res) => {
  try {
    const bill = await Bill.findByIdAndDelete(req.params.id);
    if (!bill) return res.status(404).json({ success: false, message: 'Bill not found.' });
    res.json({ success: true, message: `Bill ${bill.billNumber} deleted.` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getBills, getBill, createBill, duplicateBill, deleteBill };
