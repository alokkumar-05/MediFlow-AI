import dotenv from 'dotenv';

// Load environment variables from .env if present
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  mongodbUri: process.env.MONGODB_URI || '',
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || '',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
  }
};

export function validateEnv() {
  if (!config.mongodbUri) {
    console.warn('\x1b[33m%s\x1b[0m', '⚠️  [Database Warning] MONGODB_URI is not set. MongoDB connection will be skipped.');
    console.warn('\x1b[33m%s\x1b[0m', '   To enable database persistence, configure MONGODB_URI in server/.env');
  }

  if (config.nodeEnv === 'production' && !config.jwtSecret) {
    console.warn('\x1b[33m%s\x1b[0m', '⚠️  [Security Warning] JWT_SECRET should be set in production mode.');
  }
}
