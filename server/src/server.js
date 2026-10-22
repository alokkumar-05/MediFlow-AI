import app from './app.js';
import { config, validateEnv } from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';

async function bootstrap() {
  // Validate configuration warnings
  validateEnv();

  // Attempt database connection without blocking server boot
  await connectDB();

  // Start HTTP server
  const server = app.listen(config.port, () => {
    console.log('\x1b[32m%s\x1b[0m', '═══════════════════════════════════════════════════════');
    console.log('\x1b[32m%s\x1b[0m', `🏥 MediFlow-AI API Server listening on port ${config.port}`);
    console.log('\x1b[36m%s\x1b[0m', `   Environment : ${config.nodeEnv}`);
    console.log('\x1b[36m%s\x1b[0m', `   Health Check: http://localhost:${config.port}/api/health`);
    console.log('\x1b[36m%s\x1b[0m', `   Client URL  : ${config.clientUrl}`);
    console.log('\x1b[32m%s\x1b[0m', '═══════════════════════════════════════════════════════');
  });

  // Graceful shutdown handling
  const shutdown = async (signal) => {
    console.log(`\n[Server] Received ${signal}. Shutting down gracefully...`);
    server.close(async () => {
      await disconnectDB();
      console.log('[Server] HTTP server closed.');
      process.exit(0);
    });

    // Force exit after 10 seconds if graceful shutdown hangs
    setTimeout(() => {
      console.error('[Server] Forced exit due to shutdown timeout.');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  console.error('[Bootstrap Error] Failed to start server:', err);
  process.exit(1);
});
