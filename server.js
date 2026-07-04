require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const connectDB = require('./config/db');

// ── Connect to MongoDB ──
connectDB();

const app = express();

// ── CORS ──
// In production: restrict to your Vercel domain via CORS_ORIGIN env var.
// In development: allow all origins so local testing works without config.
const corsOptions = process.env.CORS_ORIGIN
  ? {
      origin: process.env.CORS_ORIGIN.split(',').map((o) => o.trim()),
      credentials: true,
    }
  : {}; // empty = allow all (development default)

app.use(cors(corsOptions));

// ── Core Middleware ──
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev')); // log all requests in dev
}

// ── Serve Static Frontend ──
app.use(express.static(path.join(__dirname, 'public')));

// ── API Routes ──
app.use('/api/auth',           require('./routes/authRoutes'));
app.use('/api/inventory',      require('./routes/inventoryRoutes'));
app.use('/api/staff',          require('./routes/staffRoutes'));
app.use('/api/attendance',     require('./routes/attendanceRoutes'));
app.use('/api/customers',      require('./routes/customerRoutes'));
app.use('/api/bills',          require('./routes/billRoutes'));
app.use('/api/purchase-bills', require('./routes/purchaseBillRoutes'));
app.use('/api/dashboard',      require('./routes/dashboardRoutes'));

// ── Health Check ──
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'MERCIA API is running', timestamp: new Date() });
});

// ── SPA Fallback — serve index.html for all non-API routes ──
app.get('/{*path}', (req, res) => {
  // Don't serve index.html for /api routes that weren't matched
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ success: false, message: 'API route not found.' });
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── Global Error Handler ──
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack);
  res.status(500).json({ success: false, message: 'Internal server error.' });
});

// ── Start Server (local development only) ──
// Vercel runs the app as a serverless function — it imports the exported `app`
// and never calls listen(). Calling listen() in production would throw an error.
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 MERCIA server running on http://localhost:${PORT}`);
    console.log(`📁 Serving static files from /public`);
    console.log(`🌿 Environment: ${process.env.NODE_ENV}`);
  });
}

// ── Export for Vercel Serverless Function ──
module.exports = app;
