import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config/env.js';
import healthRoutes from './routes/healthRoutes.js';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import departmentRoutes from './routes/departmentRoutes.js';
import doctorRoutes from './routes/doctorRoutes.js';
import publicDoctorRoutes from './routes/publicDoctorRoutes.js';
import appointmentRoutes from './routes/appointmentRoutes.js';
import patientRoutes from './routes/patientRoutes.js';
import nurseRoutes from './routes/nurseRoutes.js';
import admissionRoutes from './routes/admissionRoutes.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// CORS configuration based on CLIENT_URL environment variable
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, Postman)
      if (!origin) return callback(null, true);

      const allowedOrigins = [
        config.clientUrl,
        'http://localhost:5173',
        'http://127.0.0.1:5173',
      ];

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS policy does not allow access from origin: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body and Cookie parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Primary API Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/doctor', doctorRoutes);
app.use('/api/doctors', publicDoctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/patient', patientRoutes);
app.use('/api/nurse', nurseRoutes);
app.use('/api/admissions', admissionRoutes);



// Root fallback informational route
app.get('/', (req, res) => {
  res.status(200).json({
    name: 'MediFlow-AI API Server',
    status: 'online',
    version: '1.0.0',
    documentation: '/api/health',
  });
});

// 404 Catch-all handler
app.use(notFoundHandler);

// Centralized error handler
app.use(errorHandler);

export default app;
