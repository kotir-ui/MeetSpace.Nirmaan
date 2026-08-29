import db from '../models/index.js';
import { logActivity } from '../utils/activity.js';
import { isFeatureEnabled } from './settingsController.js';
import { createNotification } from './notificationController.js';

const { User, Role } = db;

const userInclude = [
  { model: Role, as: 'role' },
];

export const listUsers = async (req, res, next) => {
  try {
    const users = await User.findAll({
      include: userInclude,
      order: [['created_at', 'DESC']],
    });
    res.json(users);
  } catch (err) {
    next(err);
  }
};

export const getRoles = async (req, res, next) => {
  try {
    const roles = await Role.findAll({ order: [['id', 'ASC']] });
    res.json(roles);
  } catch (err) {
    next(err);
  }
};

export const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role_id, status, department } = req.body;
    if (!name || !email || !password || !role_id) {
      return res.status(400).json({ message: 'name, email, password and role_id are required' });
    }
    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(409).json({ message: 'Email already registered' });

    const user = await User.create({ name, email, password, role_id, status, department });
    await logActivity(req, 'CREATE_USER', 'user', `Created user ${email}`);
    await createNotification(user.id, {
      title: 'Welcome!',
      message: 'Your account has been created.',
      type: 'info',
    });
    res.status(201).json(await User.findByPk(user.id, { include: userInclude }));
  } catch (err) {
    next(err);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { name, email, password, role_id, status, department } = req.body;
    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email;
    if (password) user.password = password;
    if (role_id !== undefined) user.role_id = role_id;
    if (status !== undefined) user.status = status;
    if (department !== undefined) user.department = department;
    await user.save();

    await logActivity(req, 'UPDATE_USER', 'user', `Updated user #${user.id}`);
    res.json(await User.findByPk(user.id, { include: userInclude }));
  } catch (err) {
    next(err);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.id === req.user.id) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }
    await user.destroy();
    await logActivity(req, 'DELETE_USER', 'user', `Deleted user #${req.params.id}`);
    res.json({ message: 'User deleted' });
  } catch (err) {
    next(err);
  }
};

// POST /api/users/:id/reset-password — Super Admin / Admin set a new password.
export const resetUserPassword = async (req, res, next) => {
  try {
    if (!(await isFeatureEnabled('admin_reset_enabled'))) {
      return res.status(403).json({ message: 'Admin password reset is currently disabled' });
    }
    const { newPassword } = req.body;
    if (!newPassword || String(newPassword).length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }
    const user = await User.scope('withPassword').findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.password = newPassword;
    await user.save();
    await logActivity(req, 'UPDATE', 'user', `Reset password for ${user.email}`);
    await createNotification(user.id, {
      title: 'Password reset by admin',
      message: 'An administrator reset your password.',
      type: 'warning',
    });
    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    next(err);
  }
};
