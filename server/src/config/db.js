import mongoose from 'mongoose';
import { config } from './env.js';

let isConnected = false;
let connectionStatus = 'not_configured';

export async function connectDB() {
  if (!config.mongodbUri) {
    connectionStatus = 'not_configured';
    isConnected = false;
    console.log('\x1b[36m%s\x1b[0m', 'ℹ️  [MongoDB] No connection URI provided. Starting server without active database connection.');
    return false;
  }

  try {
    connectionStatus = 'connecting';
    const conn = await mongoose.connect(config.mongodbUri, {
      serverSelectionTimeoutMS: 5000,
    });

    isConnected = true;
    connectionStatus = 'connected';
    console.log('\x1b[32m%s\x1b[0m', `✅ [MongoDB] Connected to database: ${conn.connection.host}`);
    return true;
  } catch (error) {
    isConnected = false;
    connectionStatus = 'error';
    console.error('\x1b[31m%s\x1b[0m', `❌ [MongoDB] Connection failed: ${error.message}`);
    console.warn('\x1b[33m%s\x1b[0m', '   Server will remain running, but database-dependent features will be unavailable.');
    return false;
  }
}

mongoose.connection.on('disconnected', () => {
  isConnected = false;
  connectionStatus = 'disconnected';
  console.warn('\x1b[33m%s\x1b[0m', '⚠️  [MongoDB] Connection lost.');
});

mongoose.connection.on('reconnected', () => {
  isConnected = true;
  connectionStatus = 'connected';
  console.log('\x1b[32m%s\x1b[0m', '✅ [MongoDB] Reconnected to database.');
});

export function getDbStatus() {
  return {
    connected: isConnected && mongoose.connection.readyState === 1,
    status: connectionStatus,
    readyState: mongoose.connection.readyState, // 0: disconnected, 1: connected, 2: connecting, 3: disconnecting
  };
}

export async function disconnectDB() {
  if (isConnected) {
    await mongoose.disconnect();
    isConnected = false;
    connectionStatus = 'disconnected';
    console.log('[MongoDB] Disconnected successfully.');
  }
}
