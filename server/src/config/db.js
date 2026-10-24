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
    // If Atlas or remote cluster is unreachable (e.g., dynamic IP change / Atlas IP whitelist), attempt local MongoDB fallback
    if (config.mongodbUri.includes('mongodb+srv') || config.mongodbUri.includes('mongodb.net')) {
      console.warn('\x1b[33m%s\x1b[0m', `⚠️  [MongoDB] Primary Atlas connection failed (${error.message}). Attempting local MongoDB fallback...`);
      try {
        const localUri = 'mongodb://127.0.0.1:27017/mediflow';
        const localConn = await mongoose.connect(localUri, {
          serverSelectionTimeoutMS: 4000,
        });
        isConnected = true;
        connectionStatus = 'connected (local fallback)';
        console.log('\x1b[32m%s\x1b[0m', `✅ [MongoDB Fallback] Connected to local MongoDB instance: ${localConn.connection.host}`);
        return true;
      } catch (localErr) {
        console.error('\x1b[31m%s\x1b[0m', `❌ [MongoDB] Local fallback also failed: ${localErr.message}`);
      }
    }

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
