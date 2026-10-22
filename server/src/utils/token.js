import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

export function generateToken(userId) {
  if (!config.jwtSecret) {
    throw new Error('JWT_SECRET is not configured on the server');
  }

  return jwt.sign(
    { id: userId },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
}

export function verifyToken(token) {
  if (!config.jwtSecret) {
    throw new Error('JWT_SECRET is not configured on the server');
  }

  return jwt.verify(token, config.jwtSecret);
}
