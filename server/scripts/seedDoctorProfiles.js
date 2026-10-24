import dotenv from 'dotenv';
import User from '../src/models/User.js';
import Department from '../src/models/Department.js';
import DoctorProfile from '../src/models/DoctorProfile.js';
import { connectDB, disconnectDB } from '../src/config/db.js';

dotenv.config();

async function seedDoctorProfiles() {
  console.log('\n====================================================');
  console.log('🩺 MediFlow-AI Doctor Profiles Bootstrap');
  console.log('====================================================\n');

  await connectDB();

  try {
    const cardiology = await Department.findOne({
      $or: [{ code: 'CARD' }, { name: /Cardiology/i }],
    });

    if (!cardiology) {
      console.warn('⚠️  Cardiology department not found. Please run npm run seed:departments first.');
      await disconnectDB();
      process.exit(0);
    }

    const doctorUser = await User.findOne({ email: 'doctor@mediflow.com' });
    if (!doctorUser) {
      console.warn('⚠️  doctor@mediflow.com not found. Please run seed demo accounts first.');
      await disconnectDB();
      process.exit(0);
    }

    const existingProfile = await DoctorProfile.findOne({ user: doctorUser._id });
    if (!existingProfile) {
      await DoctorProfile.create({
        user: doctorUser._id,
        department: cardiology._id,
        specialization: 'Interventional Cardiology',
        experienceYears: 12,
        qualification: 'MBBS, MD (Medicine), DM (Cardiology), FACC',
        consultationFee: 800,
        bio: 'Senior Interventional Cardiologist specializing in acute coronary syndromes, echocardiography, and preventive cardiovascular wellness with over 12 years of clinical excellence.',
        roomNumber: 'Cabin 204, East Wing',
        isAvailable: true,
        availability: {
          slotDuration: 30,
          timeZone: 'UTC',
          isAcceptingAppointments: true,
          schedule: [
            { day: 'monday', startTime: '09:00', endTime: '16:00', breakStart: '13:00', breakEnd: '14:00', isActive: true },
            { day: 'tuesday', startTime: '09:00', endTime: '16:00', breakStart: '13:00', breakEnd: '14:00', isActive: true },
            { day: 'wednesday', startTime: '09:00', endTime: '16:00', breakStart: '13:00', breakEnd: '14:00', isActive: true },
            { day: 'thursday', startTime: '09:00', endTime: '16:00', breakStart: '13:00', breakEnd: '14:00', isActive: true },
            { day: 'friday', startTime: '09:00', endTime: '16:00', breakStart: '13:00', breakEnd: '14:00', isActive: true },
            { day: 'saturday', startTime: '10:00', endTime: '13:00', breakStart: '', breakEnd: '', isActive: true },
          ],
        },
      });

      // Also set headDoctor in Cardiology department
      cardiology.headDoctor = doctorUser._id;
      await cardiology.save();

      console.log(`✅ Seeded DoctorProfile for ${doctorUser.name} (${doctorUser.email}) in ${cardiology.name}`);
    } else {
      console.log(`ℹ️  DoctorProfile already exists for ${doctorUser.email}`);
    }

    // Check if Dr. Robert Chase exists and seed him in General Medicine or Dermatology
    const docChase = await User.findOne({ email: 'robert.chase@mediflow.com' });
    if (docChase) {
      const existingChase = await DoctorProfile.findOne({ user: docChase._id });
      if (!existingChase) {
        const dermDept = await Department.findOne({
          $or: [{ code: 'DERM' }, { code: 'GMED' }, { name: /General Medicine/i }],
        });

        if (dermDept) {
          await DoctorProfile.create({
            user: docChase._id,
            department: dermDept._id,
            specialization: 'Intensive Care & Diagnostic Medicine',
            experienceYears: 8,
            qualification: 'MBBS, MD - Critical Care & Internal Medicine',
            consultationFee: 650,
            bio: 'Critical care specialist with deep diagnostic expertise in systemic infectious conditions and inpatient intensive care.',
            roomNumber: 'Cabin 108, Ground Floor',
            isAvailable: true,
          });
          console.log(`✅ Seeded DoctorProfile for ${docChase.name} in ${dermDept.name}`);
        }
      }
    }

    console.log('\n====================================================\n');
  } catch (err) {
    console.error('Failed to seed doctor profiles:', err.message);
  } finally {
    await disconnectDB();
    process.exit(0);
  }
}

seedDoctorProfiles();
