import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../src/models/User.js';
import { connectDB, disconnectDB } from '../src/config/db.js';

dotenv.config();

async function seedAdmin() {
  console.log('\n====================================================');
  console.log('🛡️  MediFlow-AI Initial Administrator Bootstrap');
  console.log('====================================================\n');

  // Read bootstrap credentials from environment or use development defaults
  const adminName = process.env.INITIAL_ADMIN_NAME || 'Hospital Administrator';
  const adminEmail = (process.env.INITIAL_ADMIN_EMAIL || 'admin@mediflow.com').toLowerCase().trim();
  const adminPassword = process.env.INITIAL_ADMIN_PASSWORD || 'Admin@123456';

  console.log(`Target Admin Email: ${adminEmail}`);

  await connectDB();

  try {
    // 1. Safety Check: Verify account does not already exist
    const existingUser = await User.findOne({ email: adminEmail });
    if (existingUser) {
      console.log('\x1b[33m%s\x1b[0m', `⚠️  An account with email '${adminEmail}' already exists.`);
      console.log(`   Existing Account Role: ${existingUser.role}`);
      console.log('\x1b[33m%s\x1b[0m', '   Bootstrap aborted. Existing accounts cannot be overwritten.');
      await disconnectDB();
      process.exit(0);
    }

    // 2. Create the initial administrator
    const adminUser = await User.create({
      name: adminName,
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
      isActive: true,
    });

    console.log('\x1b[32m%s\x1b[0m', '✅ Initial Admin created successfully!');
    console.log(`   User ID : ${adminUser._id}`);
    console.log(`   Name    : ${adminUser.name}`);
    console.log(`   Email   : ${adminUser.email}`);
    console.log(`   Role    : ${adminUser.role}`);
    console.log('\nUse these credentials to log in to the administrator portal.');
    console.log('====================================================\n');
  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', `❌ Failed to seed initial admin: ${error.message}`);
  } finally {
    await disconnectDB();
    process.exit(0);
  }
}

seedAdmin();
