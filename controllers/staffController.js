const Staff = require('../models/Staff');

// ─────────────────────────────────────────────
// @desc    Get all staff (with search)
// @route   GET /api/staff
// @access  Private
// ─────────────────────────────────────────────
const getStaff = async (req, res) => {
  try {
    const { search = '', status } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } },
        { role: { $regex: search, $options: 'i' } },
      ];
    }
    if (status) query.status = status;

    const staff = await Staff.find(query).sort({ createdAt: -1 });
    res.json({ success: true, total: staff.length, data: staff });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// @desc    Get single staff member
// @route   GET /api/staff/:id
// @access  Private
// ─────────────────────────────────────────────
const getStaffMember = async (req, res) => {
  try {
    const member = await Staff.findById(req.params.id);
    if (!member) return res.status(404).json({ success: false, message: 'Staff member not found.' });
    res.json({ success: true, data: member });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// @desc    Add new staff member
// @route   POST /api/staff
// @access  Private (Admin)
// ─────────────────────────────────────────────
const addStaff = async (req, res) => {
  try {
    const member = await Staff.create(req.body);
    res.status(201).json({ success: true, data: member });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// @desc    Update staff member
// @route   PUT /api/staff/:id
// @access  Private (Admin)
// ─────────────────────────────────────────────
const updateStaff = async (req, res) => {
  try {
    const member = await Staff.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!member) return res.status(404).json({ success: false, message: 'Staff member not found.' });
    res.json({ success: true, data: member });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// @desc    Delete staff member
// @route   DELETE /api/staff/:id
// @access  Private (Admin)
// ─────────────────────────────────────────────
const deleteStaff = async (req, res) => {
  try {
    const member = await Staff.findByIdAndDelete(req.params.id);
    if (!member) return res.status(404).json({ success: false, message: 'Staff member not found.' });
    res.json({ success: true, message: `"${member.name}" removed successfully.` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getStaff, getStaffMember, addStaff, updateStaff, deleteStaff };
