import User from '../models/User.js';
import { generateToken } from '../utils/token.js';
import { getCookieOptions } from '../config/env.js';

export async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;

    // 1. Validation
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Email address is required' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password is required and must be at least 6 characters long',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 2. Duplicate email check
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists',
      });
    }

    // 3. Security Rule: Public registration MUST strictly create 'patient' only
    // Any role supplied in req.body is deliberately ignored
    const newUser = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: 'patient', // Hardcoded for public registration
      isActive: true,
    });

    // 4. Generate token and set HTTP-only cookie
    const token = generateToken(newUser._id);
    res.cookie('token', token, getCookieOptions());

    res.status(201).json({
      success: true,
      message: 'Patient registered successfully',
      user: newUser.toSafeObject(),
      token,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists',
      });
    }
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    // 1. Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 2. Fetch user with password field explicitly selected
    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // 3. Reject deactivated accounts
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact hospital administration.',
      });
    }

    // 4. Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // 5. Generate token and set HTTP-only cookie
    const token = generateToken(user._id);
    res.cookie('token', token, getCookieOptions());

    res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      user: user.toSafeObject(),
      token,
    });
  } catch (error) {
    next(error);
  }
}

export function getMe(req, res) {
  res.status(200).json({
    success: true,
    user: req.user.toSafeObject(),
  });
}

export function logout(req, res) {
  res.clearCookie('token', {
    ...getCookieOptions(),
    maxAge: 0,
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully. The authentication cookie has been cleared.',
  });
}

export function testRole(req, res) {
  res.status(200).json({
    success: true,
    message: `You are authenticated as: ${req.user.role}`,
    user: req.user.toSafeObject(),
  });
}
