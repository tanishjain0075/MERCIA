const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true },
    photo: { type: String }, // URL for future image upload
    phone: { type: String, required: [true, 'Phone is required'], trim: true },
    alternativePhone: { type: String, trim: true },
    email: { type: String, lowercase: true, trim: true },

    address: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    country: { type: String, default: 'India', trim: true },
    pinCode: { type: String, trim: true },

    dateOfBirth: { type: Date },
    joiningDate: { type: Date, default: Date.now },
    salary: { type: Number, min: 0 },

    role: { type: String, trim: true },       // e.g. Cashier, Manager
    department: { type: String, trim: true }, // e.g. Sales, Operations

    emergencyContact: { type: String, trim: true },
    idProof: { type: String, trim: true }, // Aadhaar, PAN, etc.
    notes: { type: String, trim: true },

    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Staff', staffSchema);
