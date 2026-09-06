import db from '../models/index.js';
import { logActivity } from '../utils/activity.js';

const { User, Role, Permission, RolePermission, UserPermission } = db;

/**
 * Get effective permissions for a user
 * Merges role permissions with user-specific permission overrides
 */
export const getEffectivePermissions = async (userId) => {
  try {
    const user = await User.findByPk(userId, {
      include: [
        {
          model: Role,
          as: 'role',
          attributes: ['id'],
          include: [
            {
              model: RolePermission,
              as: 'permissions',
              attributes: ['permission_id', 'status'],
              include: [
                {
                  model: Permission,
                  as: 'permission',
                  attributes: ['id', 'module', 'action'],
                },
              ],
            },
          ],
        },
        {
          model: UserPermission,
          as: 'userPermissions',
          attributes: ['permission_id', 'status', 'scope'],
          include: [
            {
              model: Permission,
              as: 'permission',
              attributes: ['id', 'module', 'action'],
            },
          ],
        },
      ],
    });

    if (!user) return null;

    // Build permissions map
    const permissions = new Map();

    // First, add role permissions
    if (user.role && user.role.permissions) {
      user.role.permissions.forEach((rp) => {
        const key = `${rp.permission.module}:${rp.permission.action}`;
        permissions.set(key, {
          module: rp.permission.module,
          action: rp.permission.action,
          status: rp.status,
          scope: null,
          type: 'role',
        });
      });
    }

    // Then, apply user-specific permission overrides
    if (user.userPermissions) {
      user.userPermissions.forEach((up) => {
        const key = `${up.permission.module}:${up.permission.action}`;
        permissions.set(key, {
          module: up.permission.module,
          action: up.permission.action,
          status: up.status,
          scope: up.scope,
          type: 'user',
        });
      });
    }

    return Array.from(permissions.values());
  } catch (err) {
    console.error('Error getting effective permissions:', err);
    return [];
  }
};

/**
 * Check if user has permission for a specific module:action
 */
export const hasPermission = async (userId, module, action, scope = null) => {
  try {
    const permissions = await getEffectivePermissions(userId);
    const permissionKey = `${module}:${action}`;

    const perm = permissions.find(
      (p) => p.module === module && p.action === action
    );

    if (!perm) return false;
    if (perm.status === 'denied') return false;

    // If no scope restriction, permission is granted
    if (!scope) return perm.status === 'granted';

    // Check scope restrictions if provided
    if (perm.scope) {
      // Example scope structure: { building_ids: [1,2,3], room_ids: [5,6,7] }
      const scopeKey = Object.keys(scope)[0];
      const scopeValue = scope[scopeKey];

      if (perm.scope[scopeKey]) {
        if (Array.isArray(perm.scope[scopeKey])) {
          if (Array.isArray(scopeValue)) {
            // Check if all requested resources are in allowed scope
            return scopeValue.every((v) => perm.scope[scopeKey].includes(v));
          } else {
            return perm.scope[scopeKey].includes(scopeValue);
          }
        } else if (perm.scope[scopeKey] === scopeValue) {
          return true;
        }
        return false;
      }
    }

    return perm.status === 'granted';
  } catch (err) {
    console.error('Error checking permission:', err);
    return false;
  }
};

/**
 * Middleware: Require permission for a route
 * Usage: app.get('/api/users', requirePermission('Users', 'View'), handler)
 */
export const requirePermission = (module, action, scopeChecker = null) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      let scope = null;
      if (scopeChecker) {
        scope = scopeChecker(req);
      }

      const hasAccess = await hasPermission(req.user.id, module, action, scope);

      if (!hasAccess) {
        await logActivity(
          req,
          'PERMISSION_DENIED',
          'auth',
          `Access denied to ${module}:${action}`
        );
        return res.status(403).json({
          message: `You do not have permission to ${action} ${module}`,
        });
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};

/**
 * Middleware: Require specific role(s)
 * Usage: app.get('/api/admin', requireRole(['Super Admin', 'Admin']), handler)
 */
export const requireRole = (roles) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const user = await User.findByPk(req.user.id, {
        include: [{ model: Role, as: 'role', attributes: ['name'] }],
      });

      if (!user || !user.role) {
        return res.status(403).json({ message: 'User role not found' });
      }

      const rolesArray = Array.isArray(roles) ? roles : [roles];
      if (!rolesArray.includes(user.role.name)) {
        await logActivity(
          req,
          'ROLE_DENIED',
          'auth',
          `Access denied - requires role: ${rolesArray.join(', ')}`
        );
        return res.status(403).json({
          message: `This action requires one of the following roles: ${rolesArray.join(', ')}`,
        });
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};

export default {
  getEffectivePermissions,
  hasPermission,
  requirePermission,
  requireRole,
};
