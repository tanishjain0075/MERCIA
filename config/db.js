const mongoose = require('mongoose');

/**
 * Cached connection reference.
 * In serverless environments (Vercel), each function invocation may reuse the
 * same Node.js process. Caching the connection avoids reconnecting to MongoDB
 * on every request, which would exhaust the Atlas connection pool quickly.
 */
let cached = global._mongooseCache;

if (!cached) {
  cached = global._mongooseCache = { conn: null, promise: null };
}

const connectDB = async () => {
  // If a connection is already established, reuse it
  if (cached.conn) {
    return cached.conn;
  }

  // If a connection attempt is already in-flight, wait for it
  if (!cached.promise) {
    cached.promise = mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000, // slightly more generous for cold starts
    }).then((mongoose) => {
      console.log(`✅ MongoDB Connected: ${mongoose.connection.host}`);
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    // Clear the cached promise so the next invocation can retry
    cached.promise = null;
    // Throw instead of process.exit() — fatal exits kill the serverless function
    // permanently until the next cold start, masking the real error in logs.
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    throw error;
  }

  return cached.conn;
};

module.exports = connectDB;
