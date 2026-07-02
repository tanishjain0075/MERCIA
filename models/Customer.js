const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Customer name is required'], trim: true },
    phone: { type: String, required: [true, 'Phone is required'], trim: true },
    email: { type: String, lowercase: true, trim: true },
    gstNumber: { type: String, uppercase: true, trim: true },
    address: { type: String, trim: true },
    notes: { type: String, trim: true },

    totalPurchases: { type: Number, default: 0 },       // total ₹ spent
    outstandingBalance: { type: Number, default: 0 },   // credit due
  },
  { timestamps: true }
);

module.exports = mongoose.model('Customer', customerSchema);
