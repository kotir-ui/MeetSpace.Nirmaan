import jwt from 'jsonwebtoken';
import db from '../models/index.js';

const { User, Role } = db;

export const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id, {
      include: [{ model: Role, as: 'role' }],
    });

    if (!user || user.status !== 'active') {
      return res.status(401).json({ message: 'Invalid or inactive user' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// Role-based access control. Pass allowed role names.
export const authorize = (...roles) => {
  return (req, res, next) => {
    const roleName = req.user?.role?.name;
    if (!roleName || !roles.includes(roleName)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    next();
  };
};
