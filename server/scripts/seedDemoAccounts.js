import dotenv from 'dotenv';
import User from '../src/models/User.js';
import { connectDB, disconnectDB } from '../src/config/db.js';

dotenv.config();

async function seedDemoAccounts() {
  await connectDB();

  const demoUsers = [
    {
      name: 'Dr. Sarah Connor',
      email: 'doctor@mediflow.com',
      password: 'Doctor@123456',
      role: 'doctor',
      isActive: true,
    },
    {
      name: 'Florence Nightingale',
      email: 'nurse@mediflow.com',
      password: 'Nurse@123456',
      role: 'nurse',
      isActive: true,
    },
    {
      name: 'John Patient',
      email: 'patient@mediflow.com',
      password: 'Patient@123456',
      role: 'patient',
      isActive: true,
    },
  ];

  for (const u of demoUsers) {
    const existing = await User.findOne({ email: u.email });
    if (!existing) {
      await User.create(u);
      console.log(`✅ Seeded demo account: ${u.email} (${u.role})`);
    } else {
      console.log(`ℹ️  Demo account already exists: ${u.email} (${existing.role})`);
    }
  }

  await disconnectDB();
  process.exit(0);
}

seedDemoAccounts();
