const mongoose = require('mongoose');

const purchaseBillSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, trim: true },
    supplier: { type: String, required: [true, 'Supplier is required'], trim: true },

    inventory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Inventory',
      required: [true, 'Inventory item is required'],
    },
    itemName: { type: String },     // snapshot at time of purchase

    purchasePrice: { type: Number, required: true, min: 0 },
    sellingPrice: { type: Number, min: 0 },
    qty: { type: Number, required: true, min: 1 },
    totalAmount: { type: Number, required: true },

    purchaseDate: { type: Date, default: Date.now },

    paymentStatus: {
      type: String,
      enum: ['Paid', 'Pending', 'Partial'],
      default: 'Paid',
    },
    notes: { type: String, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PurchaseBill', purchaseBillSchema);
