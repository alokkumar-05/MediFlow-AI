import dotenv from 'dotenv';

// Load environment variables from .env if present
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  mongodbUri: process.env.MONGODB_URI || '',
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || '',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
  },
};

export function validateEnv() {
  if (!config.mongodbUri) {
    console.warn('\x1b[33m%s\x1b[0m', '⚠️  [Database Warning] MONGODB_URI is not set. MongoDB connection will be skipped.');
    console.warn('\x1b[33m%s\x1b[0m', '   To enable database persistence, configure MONGODB_URI in server/.env');
  }

  if (!config.jwtSecret) {
    console.error('\x1b[31m%s\x1b[0m', '❌ [Security Error] JWT_SECRET is missing in environment variables.');
    console.error('\x1b[31m%s\x1b[0m', '   Authentication requires a valid JWT_SECRET configured in server/.env');
  } else if (config.jwtSecret.length < 16) {
    console.warn('\x1b[33m%s\x1b[0m', '⚠️  [Security Warning] JWT_SECRET is relatively short. Recommended: 32+ character high-entropy key.');
  }
}

export function getCookieOptions() {
  return {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: config.nodeEnv === 'production' ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    path: '/',
  };
}
