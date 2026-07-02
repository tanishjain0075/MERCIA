const mongoose = require('mongoose');

// Sub-schema for each line item on a bill
const billItemSchema = new mongoose.Schema(
  {
    inventory: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory' },
    name: { type: String, required: true },   // snapshot of item name at sale time
    sku: { type: String },
    qty: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true },  // selling price at time of sale
    tax: { type: Number, default: 0 },            // %
    discount: { type: Number, default: 0 },       // %
    subtotal: { type: Number, required: true },   // calculated final for this line
  },
  { _id: false }
);

const billSchema = new mongoose.Schema(
  {
    billNumber: {
      type: String,
      unique: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
    },
    // Snapshot of customer name for display even if customer is deleted
    customerName: { type: String },
    customerPhone: { type: String },

    items: [billItemSchema],

    subtotal: { type: Number, default: 0 },       // sum before overall discount/tax
    discountAmount: { type: Number, default: 0 }, // overall ₹ discount
    taxAmount: { type: Number, default: 0 },      // overall ₹ tax
    grandTotal: { type: Number, required: true },

    paymentMethod: {
      type: String,
      enum: ['Cash', 'UPI', 'Card', 'Credit'],
      default: 'Cash',
    },
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

// Auto-generate bill number before saving new document
billSchema.pre('save', async function () {
  if (!this.isNew) return;
  const count = await mongoose.model('Bill').countDocuments();
  this.billNumber = `BILL-${String(count + 1).padStart(5, '0')}`;
});

module.exports = mongoose.model('Bill', billSchema);
