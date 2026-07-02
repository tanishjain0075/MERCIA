const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
    },
    sku: {
      type: String,
      required: [true, 'SKU is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    barcode: { type: String, trim: true },
    category: { type: String, required: [true, 'Category is required'], trim: true },
    brand: { type: String, trim: true },
    description: { type: String, trim: true },

    purchasePrice: { type: Number, required: true, min: 0 },
    sellingPrice: { type: Number, required: true, min: 0 },
    mrp: { type: Number, min: 0 },
    tax: { type: Number, default: 0, min: 0, max: 100 }, // percentage
    discount: { type: Number, default: 0, min: 0 },      // percentage

    stockQty: { type: Number, required: true, default: 0, min: 0 },
    minStockLevel: { type: Number, default: 5, min: 0 },

    supplier: { type: String, trim: true },
    unit: { type: String, default: 'pcs', trim: true }, // pcs, kg, litre, etc.

    expiryDate: { type: Date },
    manufactureDate: { type: Date },

    status: {
      type: String,
      enum: ['active', 'low-stock', 'out-of-stock', 'discontinued'],
      default: 'active',
    },
    image: { type: String }, // URL / path for future
  },
  { timestamps: true }
);

// Auto-update status based on stock levels before saving
inventorySchema.pre('save', function () {
  if (this.stockQty === 0) {
    this.status = 'out-of-stock';
  } else if (this.stockQty <= this.minStockLevel) {
    this.status = 'low-stock';
  } else if (this.status !== 'discontinued') {
    this.status = 'active';
  }
});

module.exports = mongoose.model('Inventory', inventorySchema);
