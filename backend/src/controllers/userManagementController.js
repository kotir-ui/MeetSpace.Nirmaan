import db from '../models/index.js';
import { hasPermission } from '../middleware/authorization.js';
import ActivityLog from '../models/ActivityLog.js';

const { User, Role, Department } = db;

// Get all users with optional filtering
export const getAllUsers = async (req, res) => {
  try {
    const { status, department_id, role_id, search } = req.query;

    // Build where clause for filtering
    const where = {};
    if (status) where.status = status;
    if (department_id) where.department_id = department_id;
    if (role_id) where.role_id = role_id;

    // Search by name or email
    if (search) {
      const { Op } = await import('sequelize');
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { employee_id: { [Op.like]: `%${search}%` } },
      ];
    }

    const users = await User.findAll({
      where,
      attributes: {
        exclude: ['password'],
      },
      include: [
        { model: Role, as: 'role', attributes: ['id', 'name'] },
        { model: Department, as: 'departmentGroup', attributes: ['id', 'name'] },
        { model: User, as: 'manager', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'departmentHead', attributes: ['id', 'name', 'email'] },
      ],
      order: [['created_at', 'DESC']],
    });

    res.status(200).json({
      success: true,
      message: 'Users retrieved successfully',
      data: users,
      count: users.length,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving users',
      error: error.message,
    });
  }
};

// Get single user by ID
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      attributes: {
        exclude: ['password'],
      },
      include: [
        { model: Role, as: 'role', attributes: ['id', 'name'] },
        { model: Department, as: 'departmentGroup', attributes: ['id', 'name', 'code'] },
        { model: User, as: 'manager', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'departmentHead', attributes: ['id', 'name', 'email'] },
      ],
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'User retrieved successfully',
      data: user,
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving user',
      error: error.message,
    });
  }
};

// Create new user
export const createUser = async (req, res) => {
  try {
    const {
      employee_id,
      name,
      email,
      mobile,
      designation,
      password,
      role_id,
      department_id,
      manager_id,
      department_head_id,
      joining_date,
      profile_image,
    } = req.body;

    // Validation
    if (!employee_id || !name || !email || !password || !role_id) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: employee_id, name, email, password, role_id',
      });
    }

    // Check if employee_id or email already exists
    const existingUser = await User.findOne({
      where: { [require('sequelize').Op.or]: [{ employee_id }, { email }] },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: existingUser.employee_id === employee_id
          ? 'Employee ID already exists'
          : 'Email already exists',
      });
    }

    // Verify role exists
    const role = await Role.findByPk(role_id);
    if (!role) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role_id',
      });
    }

    // Verify department exists if provided
    if (department_id) {
      const department = await Department.findByPk(department_id);
      if (!department) {
        return res.status(400).json({
          success: false,
          message: 'Invalid department_id',
        });
      }
    }

    // Create user
    const newUser = await User.create({
      employee_id,
      name,
      email,
      mobile,
      designation,
      password,
      role_id,
      department_id: department_id || null,
      manager_id: manager_id || null,
      department_head_id: department_head_id || null,
      joining_date: joining_date || new Date(),
      profile_image: profile_image || null,
      status: 'active',
      password_status: 'set',
    });

    // Log activity
    await ActivityLog.create({
      user_id: req.user?.id,
      action: 'USER_CREATE',
      entity_type: 'User',
      entity_id: newUser.id,
      description: `Created new user: ${newUser.name} (${newUser.email})`,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
    });

    // Return user without password
    const userResponse = await User.findByPk(newUser.id, {
      attributes: { exclude: ['password'] },
      include: [
        { model: Role, as: 'role', attributes: ['id', 'name'] },
        { model: Department, as: 'departmentGroup', attributes: ['id', 'name'] },
      ],
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: userResponse,
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating user',
      error: error.message,
    });
  }
};

// Update user
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      mobile,
      designation,
      role_id,
      department_id,
      manager_id,
      department_head_id,
      joining_date,
      profile_image,
    } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // If email is being updated, check for uniqueness
    if (email && email !== user.email) {
      const existingEmail = await User.findOne({ where: { email } });
      if (existingEmail) {
        return res.status(409).json({
          success: false,
          message: 'Email already exists',
        });
      }
    }

    // Verify role exists if changing
    if (role_id && role_id !== user.role_id) {
      const role = await Role.findByPk(role_id);
      if (!role) {
        return res.status(400).json({
          success: false,
          message: 'Invalid role_id',
        });
      }
    }

    // Verify department exists if provided
    if (department_id && department_id !== user.department_id) {
      const department = await Department.findByPk(department_id);
      if (!department) {
        return res.status(400).json({
          success: false,
          message: 'Invalid department_id',
        });
      }
    }

    // Update user
    await user.update({
      name: name || user.name,
      email: email || user.email,
      mobile: mobile || user.mobile,
      designation: designation || user.designation,
      role_id: role_id || user.role_id,
      department_id: department_id !== undefined ? department_id : user.department_id,
      manager_id: manager_id !== undefined ? manager_id : user.manager_id,
      department_head_id: department_head_id !== undefined ? department_head_id : user.department_head_id,
      joining_date: joining_date || user.joining_date,
      profile_image: profile_image !== undefined ? profile_image : user.profile_image,
    });

    // Log activity
    await ActivityLog.create({
      user_id: req.user?.id,
      action: 'USER_UPDATE',
      entity_type: 'User',
      entity_id: user.id,
      description: `Updated user: ${user.name} (${user.email})`,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
    });

    const updatedUser = await User.findByPk(id, {
      attributes: { exclude: ['password'] },
      include: [
        { model: Role, as: 'role', attributes: ['id', 'name'] },
        { model: Department, as: 'departmentGroup', attributes: ['id', 'name'] },
      ],
    });

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser,
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user',
      error: error.message,
    });
  }
};

// Change user status (activate/deactivate/suspend/lock)
export const changeUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    if (!['active', 'inactive', 'suspended', 'locked'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: active, inactive, suspended, locked',
      });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const oldStatus = user.status;
    await user.update({ status });

    // Log activity with reason
    await ActivityLog.create({
      user_id: req.user?.id,
      action: 'USER_STATUS_CHANGE',
      entity_type: 'User',
      entity_id: user.id,
      description: `Changed user status from '${oldStatus}' to '${status}'${reason ? ': ' + reason : ''}`,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
    });

    res.status(200).json({
      success: true,
      message: `User status changed to ${status}`,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        status: user.status,
      },
    });
  } catch (error) {
    console.error('Error changing user status:', error);
    res.status(500).json({
      success: false,
      message: 'Error changing user status',
      error: error.message,
    });
  }
};

// Delete user (soft delete pattern - check for dependencies)
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if user is a department head or manager for active departments/users
    const [isHead, isDeputy, isManager, isOrganizerOfBookings] = await Promise.all([
      Department.count({ where: { department_head_id: id, status: 'active' } }),
      Department.count({ where: { deputy_id: id, status: 'active' } }),
      User.count({ where: { manager_id: id, status: 'active' } }),
      // Import MeetingBooking if needed - placeholder for now
      0,
    ]);

    const dependencies = [];
    if (isHead > 0) dependencies.push(`${isHead} active department(s) as head`);
    if (isDeputy > 0) dependencies.push(`${isDeputy} active department(s) as deputy`);
    if (isManager > 0) dependencies.push(`${isManager} active user(s) as manager`);
    if (isOrganizerOfBookings > 0) dependencies.push('active meeting bookings as organizer');

    if (dependencies.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Cannot delete user with active dependencies',
        dependencies,
      });
    }

    // Log activity before delete
    await ActivityLog.create({
      user_id: req.user?.id,
      action: 'USER_DELETE',
      entity_type: 'User',
      entity_id: user.id,
      description: `Deleted user: ${user.name} (${user.email})`,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
    });

    await user.destroy();

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting user',
      error: error.message,
    });
  }
};

// Get user access preview (show all permissions for a user)
export const getUserAccessPreview = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      attributes: { exclude: ['password'] },
      include: [
        { model: Role, as: 'role', attributes: ['id', 'name'] },
      ],
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Get effective permissions using authorization middleware logic
    const { getEffectivePermissions } = await import('../middleware/authorization.js');
    const permissions = await getEffectivePermissions(user.id);

    res.status(200).json({
      success: true,
      message: 'User access preview retrieved',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
        },
        permissions,
      },
    });
  } catch (error) {
    console.error('Error fetching user access preview:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving user access',
      error: error.message,
    });
  }
};
