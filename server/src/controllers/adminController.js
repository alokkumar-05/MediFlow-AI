import mongoose from 'mongoose';
import User, { ROLES } from '../models/User.js';

const STAFF_ROLES = ['admin', 'doctor', 'nurse'];

export async function createStaff(req, res, next) {
  try {
    const { name, email, password, role } = req.body;

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

    if (!role || !STAFF_ROLES.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Invalid staff role. Allowed staff roles: ${STAFF_ROLES.join(', ')}`,
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 2. Duplicate check
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'A user with this email address already exists',
      });
    }

    // 3. Create staff user
    const staffUser = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role,
      isActive: true,
    });

    res.status(201).json({
      success: true,
      message: `${role.charAt(0).toUpperCase() + role.slice(1)} account created successfully`,
      user: staffUser.toSafeObject(),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'A user with this email address already exists',
      });
    }
    next(error);
  }
}

export async function listStaff(req, res, next) {
  try {
    const { role } = req.query;
    const filter = {};

    if (role && STAFF_ROLES.includes(role)) {
      filter.role = role;
    } else {
      filter.role = { $in: STAFF_ROLES };
    }

    const staff = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: staff.length,
      staff,
    });
  } catch (error) {
    next(error);
  }
}

export async function listAllUsers(req, res, next) {
  try {
    const { role, isActive, search } = req.query;
    const filter = {};

    if (role && ROLES.includes(role)) {
      filter.role = role;
    }
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }
    if (search && search.trim()) {
      const q = search.trim();
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
      ];
    }

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    next(error);
  }
}

export async function getUserDetails(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID format' });
    }

    const user = await User.findById(id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      user: user.toSafeObject(),
    });
  } catch (error) {
    next(error);
  }
}

export async function toggleUserStatus(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID format' });
    }

    const currentUserId = (req.user._id || req.user.id).toString();
    if (id === currentUserId) {
      return res.status(400).json({
        success: false,
        message: 'Administrators cannot deactivate their own active account',
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User '${user.name}' status updated to ${user.isActive ? 'Active' : 'Deactivated'}`,
      user: user.toSafeObject(),
    });
  } catch (error) {
    next(error);
  }
}

