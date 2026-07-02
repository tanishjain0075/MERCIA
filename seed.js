/**
 * Seeder script — creates the initial Admin user.
 * Run once: node seed.js
 * Safe to re-run: skips if admin already exists.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const connectDB = require('./config/db');

const seedAdmin = async () => {
  await connectDB();

  try {
    const existingAdmin = await User.findOne({ email: process.env.ADMIN_EMAIL });

    if (existingAdmin) {
      console.log(`✅ Admin already exists: ${existingAdmin.email}`);
      process.exit(0);
    }

    const admin = await User.create({
      username: process.env.ADMIN_USERNAME,
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD,
      role: 'admin',
      isActive: true,
    });

    console.log('🌱 Admin user created:');
    console.log(`   Username : ${admin.username}`);
    console.log(`   Email    : ${admin.email}`);
    console.log(`   Role     : ${admin.role}`);
    console.log('\n✅ You can now log in at http://localhost:3000/pages/login.html');
  } catch (error) {
    console.error('❌ Seeder error:', error.message);
  } finally {
    mongoose.connection.close();
  }
};

seedAdmin();
