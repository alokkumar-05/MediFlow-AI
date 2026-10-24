import dotenv from 'dotenv';
import Department from '../src/models/Department.js';
import User from '../src/models/User.js';
import { connectDB, disconnectDB } from '../src/config/db.js';

dotenv.config();

const INITIAL_DEPARTMENTS = [
  {
    name: 'Cardiology',
    code: 'CARD',
    description: 'Cardiovascular diagnostics, heart failure management, and outpatient clinical cardiology.',
    location: 'Building A, Floor 2, Wing East',
  },
  {
    name: 'Neurology',
    code: 'NEUR',
    description: 'Comprehensive neurological assessment, stroke follow-up, and cognitive health.',
    location: 'Building A, Floor 3, Wing West',
  },
  {
    name: 'Pediatrics',
    code: 'PEDI',
    description: 'Specialized healthcare, developmental tracking, and immunizations for infants, children, and teens.',
    location: 'Building B, Floor 1, North Wing',
  },
  {
    name: 'Orthopedics',
    code: 'ORTH',
    description: 'Musculoskeletal trauma, joint care, spine health, and physical rehabilitation support.',
    location: 'Building A, Floor 1, South Wing',
  },
  {
    name: 'General Medicine',
    code: 'GMED',
    description: 'Primary care, adult preventive health assessments, and acute infection treatment.',
    location: 'Main OPD Complex, Ground Floor',
  },
  {
    name: 'Emergency Medicine',
    code: 'EMER',
    description: '24/7 acute trauma resuscitation, rapid triage, and urgent stabilization.',
    location: 'Emergency & Trauma Block, Ground Floor',
  },
  {
    name: 'Oncology',
    code: 'ONCO',
    description: 'Cancer consultations, infusion monitoring, and multidisciplinary tumor therapy.',
    location: 'Building C, Floor 2, Oncology Center',
  },
  {
    name: 'Radiology',
    code: 'RAD',
    description: 'Diagnostic imaging facilities including MRI, 64-slice CT, ultrasound, and digital X-ray.',
    location: 'Basement Imaging Diagnostic Center',
  },
];

async function seedDepartments() {
  console.log('\n====================================================');
  console.log('🏥 MediFlow-AI Initial Department Bootstrap');
  console.log('====================================================\n');

  await connectDB();

  try {
    // Optionally find a doctor to assign as head doctor for Cardiology as demo
    const doctor = await User.findOne({ role: 'doctor' });

    for (const d of INITIAL_DEPARTMENTS) {
      const existing = await Department.findOne({
        name: { $regex: new RegExp(`^${d.name}$`, 'i') },
      });

      if (!existing) {
        await Department.create({
          ...d,
          headDoctor: d.code === 'CARD' && doctor ? doctor._id : null,
          isActive: true,
        });
        console.log(`✅ Seeded department: ${d.name} (${d.code})`);
      } else {
        console.log(`ℹ️  Department already exists: ${existing.name} (${existing.code})`);
      }
    }
    console.log('\n====================================================\n');
  } catch (err) {
    console.error('Failed to seed departments:', err.message);
  } finally {
    await disconnectDB();
    process.exit(0);
  }
}

seedDepartments();
