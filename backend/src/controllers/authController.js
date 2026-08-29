import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import db from '../models/index.js';
import { logActivity } from '../utils/activity.js';
import { getSettingsMap, isFeatureEnabled } from './settingsController.js';
import { createNotification } from './notificationController.js';

const { User, Role, PasswordResetOtp } = db;

const signToken = (user) =>
  jwt.sign({ id: user.id, role: user.role?.name }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  });

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.scope('withPassword').findOne({
      where: { email },
      include: [{ model: Role, as: 'role' }],
    });

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ message: 'Account is inactive' });
    }

    user.last_login = new Date();
    await user.save();

    const token = signToken(user);
    await logActivity(req, 'LOGIN', 'auth', `User ${user.email} logged in`);

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role?.name,
        department: user.department,
        department_id: user.department_id,
        status: user.status,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const register = async (req, res, next) => {
  try {
    const { name, email, password, role_id } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const viewerRole = await Role.findOne({ where: { name: 'Viewer' } });
    const user = await User.create({
      name,
      email,
      password,
      role_id: role_id || viewerRole?.id,
    });

    await logActivity(req, 'REGISTER', 'user', `Created user ${email}`);
    res.status(201).json({ id: user.id, name: user.name, email: user.email });
  } catch (err) {
    next(err);
  }
};

export const me = async (req, res) => {
  res.json({
    id: req.user.id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role?.name,
    department: req.user.department,
    department_id: req.user.department_id,
    status: req.user.status,
  });
};

// GET /api/auth/config — public feature flags the login page needs.
export const authConfig = async (req, res, next) => {
  try {
    const map = await getSettingsMap();
    res.json({ forgot_password_enabled: map.forgot_password_enabled });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/change-password — logged-in user changes their own password.
export const changePassword = async (req, res, next) => {
  try {
    if (!(await isFeatureEnabled('change_password_enabled'))) {
      return res.status(403).json({ message: 'Change password is currently disabled' });
    }
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password are required' });
    }
    if (String(newPassword).length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }
    const user = await User.scope('withPassword').findByPk(req.user.id);
    if (!user || !(await user.comparePassword(currentPassword))) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }
    user.password = newPassword;
    await user.save();
    await logActivity(req, 'UPDATE', 'auth', `User ${user.email} changed their password`);
    await createNotification(user.id, {
      title: 'Password changed',
      message: 'Your password was updated successfully.',
      type: 'success',
    });
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/forgot-password — email an OTP (dev mode: logged & returned).
export const forgotPassword = async (req, res, next) => {
  try {
    if (!(await isFeatureEnabled('forgot_password_enabled'))) {
      return res.status(403).json({ message: 'Forgot password is currently disabled' });
    }
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const generic = { message: 'If that email is registered, an OTP has been sent.' };
    const user = await User.findOne({ where: { email } });
    if (!user) return res.json(generic);

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const otpHash = await bcrypt.hash(otp, 10);
    await PasswordResetOtp.destroy({ where: { email } });
    await PasswordResetOtp.create({
      email,
      otp_hash: otpHash,
      expires_at: new Date(Date.now() + 10 * 60 * 1000),
    });

    // No SMTP configured yet — surface the OTP for testing.
    console.log(`🔐 Password reset OTP for ${email}: ${otp}`);
    const devMode = process.env.OTP_DEV_MODE !== 'false';
    res.json(devMode ? { ...generic, devOtp: otp } : generic);
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/reset-password — verify OTP and set a new password.
export const resetPassword = async (req, res, next) => {
  try {
    if (!(await isFeatureEnabled('forgot_password_enabled'))) {
      return res.status(403).json({ message: 'Forgot password is currently disabled' });
    }
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'Email, OTP and new password are required' });
    }
    if (String(newPassword).length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const record = await PasswordResetOtp.findOne({
      where: { email, used: false },
      order: [['created_at', 'DESC']],
    });
    if (!record) return res.status(400).json({ message: 'Invalid or expired OTP' });
    if (new Date(record.expires_at) < new Date()) {
      await record.destroy();
      return res.status(400).json({ message: 'OTP has expired. Request a new one.' });
    }
    if (record.attempts >= 5) {
      await record.destroy();
      return res.status(429).json({ message: 'Too many attempts. Request a new OTP.' });
    }
    if (!(await bcrypt.compare(String(otp), record.otp_hash))) {
      record.attempts += 1;
      await record.save();
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    const user = await User.scope('withPassword').findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.password = newPassword;
    await user.save();
    record.used = true;
    await record.save();
    await logActivity(req, 'UPDATE', 'auth', `Password reset via OTP for ${email}`);
    await createNotification(user.id, {
      title: 'Password reset',
      message: 'Your password was reset successfully.',
      type: 'success',
    });
    res.json({ message: 'Password reset successfully. You can now sign in.' });
  } catch (err) {
    next(err);
  }
};
