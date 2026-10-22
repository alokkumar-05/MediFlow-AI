import { getDbStatus } from '../config/db.js';
import { config } from '../config/env.js';

export function getHealth(req, res) {
  const dbStatus = getDbStatus();

  res.status(200).json({
    success: true,
    message: 'MediFlow-AI API is running',
    environment: config.nodeEnv,
    timestamp: new Date().toISOString(),
    database: {
      connected: dbStatus.connected,
      status: dbStatus.status,
    },
  });
}
