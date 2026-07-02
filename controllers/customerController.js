const Customer = require('../models/Customer');
const Bill = require('../models/Bill');

// ─────────────────────────────────────────────
// @desc    Get all customers
// @route   GET /api/customers
// @access  Private
// ─────────────────────────────────────────────
const getCustomers = async (req, res) => {
  try {
    const { search = '' } = req.query;
    const query = search
      ? {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { phone: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { gstNumber: { $regex: search, $options: 'i' } },
          ],
        }
      : {};

    const customers = await Customer.find(query).sort({ createdAt: -1 });
    res.json({ success: true, total: customers.length, data: customers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// @desc    Get single customer + purchase history
// @route   GET /api/customers/:id
// @access  Private
// ─────────────────────────────────────────────
const getCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found.' });

    // Fetch all bills for this customer
    const bills = await Bill.find({ customer: req.params.id })
      .select('billNumber grandTotal paymentStatus paymentMethod createdAt')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: customer, purchaseHistory: bills });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// @desc    Add new customer
// @route   POST /api/customers
// @access  Private
// ─────────────────────────────────────────────
const addCustomer = async (req, res) => {
  try {
    const customer = await Customer.create(req.body);
    res.status(201).json({ success: true, data: customer });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// @desc    Update customer
// @route   PUT /api/customers/:id
// @access  Private
// ─────────────────────────────────────────────
const updateCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found.' });
    res.json({ success: true, data: customer });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// @desc    Delete customer
// @route   DELETE /api/customers/:id
// @access  Private (Admin)
// ─────────────────────────────────────────────
const deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found.' });
    res.json({ success: true, message: `"${customer.name}" deleted.` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getCustomers, getCustomer, addCustomer, updateCustomer, deleteCustomer };
