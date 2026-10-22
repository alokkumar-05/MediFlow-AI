import { config } from '../config/env.js';

export function errorHandler(err, req, res, next) {
  // If headers already sent, delegate to default Express error handler
  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err.statusCode || err.status || 500;
  const isProduction = config.nodeEnv === 'production';

  const response = {
    success: false,
    message: err.message || 'Internal server error',
  };

  // Only include stack trace in development
  if (!isProduction) {
    response.stack = err.stack;
  }

  // Log error on server
  console.error(`[Error] ${req.method} ${req.originalUrl}:`, err.message);

  res.status(statusCode).json(response);
}
