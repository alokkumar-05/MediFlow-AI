import mongoose from 'mongoose';
import Department from '../models/Department.js';
import User from '../models/User.js';

export async function createDepartment(req, res, next) {
  try {
    const { name, code, description, location, headDoctor } = req.body;

    // 1. Validation
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Department name is required' });
    }

    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Department name must be at least 2 characters long',
      });
    }

    // 2. Duplicate check (case-insensitive)
    const existing = await Department.findOne({
      name: { $regex: new RegExp(`^${trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'A department with this name already exists',
      });
    }

    // 3. Optional Head Doctor validation
    if (headDoctor) {
      if (!mongoose.Types.ObjectId.isValid(headDoctor)) {
        return res.status(400).json({ success: false, message: 'Invalid head doctor ID format' });
      }
      const doctorUser = await User.findById(headDoctor);
      if (!doctorUser || doctorUser.role !== 'doctor') {
        return res.status(400).json({
          success: false,
          message: 'Head doctor must be a valid user with the doctor role',
        });
      }
    }

    // 4. Create department
    const department = await Department.create({
      name: trimmedName,
      code: code ? code.trim().toUpperCase() : undefined,
      description: description ? description.trim() : '',
      location: location ? location.trim() : 'Main Hospital Building',
      headDoctor: headDoctor || null,
      isActive: true,
    });

    const populated = await Department.findById(department._id).populate('headDoctor', 'name email role');

    res.status(201).json({
      success: true,
      message: 'Department created successfully',
      department: populated,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'A department with this name already exists',
      });
    }
    next(error);
  }
}

export async function listDepartments(req, res, next) {
  try {
    const { isActive, search } = req.query;
    const filter = {};

    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    if (search && search.trim()) {
      const q = search.trim();
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { code: { $regex: q, $options: 'i' } },
        { location: { $regex: q, $options: 'i' } },
      ];
    }

    const departments = await Department.find(filter)
      .populate('headDoctor', 'name email role')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: departments.length,
      departments,
    });
  } catch (error) {
    next(error);
  }
}

export async function getDepartmentById(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid department ID format' });
    }

    const department = await Department.findById(id).populate('headDoctor', 'name email role');
    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    res.status(200).json({
      success: true,
      department,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateDepartment(req, res, next) {
  try {
    const { id } = req.params;
    const { name, code, description, location, headDoctor } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid department ID format' });
    }

    const department = await Department.findById(id);
    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    // Check name duplication if name is being changed
    if (name !== undefined) {
      const trimmedName = name.trim();
      if (!trimmedName || trimmedName.length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Department name must be at least 2 characters long',
        });
      }

      if (trimmedName.toLowerCase() !== department.name.toLowerCase()) {
        const existing = await Department.findOne({
          _id: { $ne: department._id },
          name: { $regex: new RegExp(`^${trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
        });

        if (existing) {
          return res.status(409).json({
            success: false,
            message: 'A department with this name already exists',
          });
        }
      }
      department.name = trimmedName;
    }

    if (code !== undefined) {
      department.code = code ? code.trim().toUpperCase() : department.code;
    }

    if (description !== undefined) {
      department.description = description.trim();
    }

    if (location !== undefined) {
      department.location = location.trim();
    }

    if (headDoctor !== undefined) {
      if (headDoctor && headDoctor !== '') {
        if (!mongoose.Types.ObjectId.isValid(headDoctor)) {
          return res.status(400).json({ success: false, message: 'Invalid head doctor ID format' });
        }
        const doctorUser = await User.findById(headDoctor);
        if (!doctorUser || doctorUser.role !== 'doctor') {
          return res.status(400).json({
            success: false,
            message: 'Head doctor must be a valid user with the doctor role',
          });
        }
        department.headDoctor = headDoctor;
      } else {
        department.headDoctor = null;
      }
    }

    await department.save();

    const updated = await Department.findById(department._id).populate('headDoctor', 'name email role');

    res.status(200).json({
      success: true,
      message: 'Department updated successfully',
      department: updated,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'A department with this name already exists',
      });
    }
    next(error);
  }
}

export async function toggleDepartmentStatus(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid department ID format' });
    }

    const department = await Department.findById(id);
    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    department.isActive = !department.isActive;
    await department.save();

    const updated = await Department.findById(department._id).populate('headDoctor', 'name email role');

    res.status(200).json({
      success: true,
      message: `Department '${department.name}' status updated to ${department.isActive ? 'Active' : 'Deactivated'}`,
      department: updated,
    });
  } catch (error) {
    next(error);
  }
}

export async function deactivateDepartment(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid department ID format' });
    }

    const department = await Department.findById(id);
    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    // Safety rule: Soft-deactivate only; never hard-delete
    department.isActive = false;
    await department.save();

    res.status(200).json({
      success: true,
      message: `Department '${department.name}' has been deactivated (soft-deleted). Record preserved for historical integrity.`,
      department,
    });
  } catch (error) {
    next(error);
  }
}
