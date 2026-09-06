import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { requirePermission } from '../middleware/authorization.js';
import * as userManagementController from '../controllers/userManagementController.js';

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

/**
 * @route   GET /api/users
 * @desc    Get all users with optional filtering
 * @query   status - Filter by status (active, inactive, suspended, locked)
 * @query   department_id - Filter by department
 * @query   role_id - Filter by role
 * @query   search - Search by name, email, or employee_id
 * @access  Private - Requires 'Users.View' permission
 */
router.get(
  '/',
  requirePermission('Users', 'View'),
  userManagementController.getAllUsers
);

/**
 * @route   GET /api/users/:id
 * @desc    Get single user by ID
 * @access  Private - Requires 'Users.View' permission
 */
router.get(
  '/:id',
  requirePermission('Users', 'View'),
  userManagementController.getUserById
);

/**
 * @route   POST /api/users
 * @desc    Create new user
 * @body    {
 *            employee_id, name, email, mobile, designation,
 *            password, role_id, department_id, manager_id,
 *            department_head_id, joining_date, profile_image
 *          }
 * @access  Private - Requires 'Users.Create' permission
 */
router.post(
  '/',
  requirePermission('Users', 'Create'),
  userManagementController.createUser
);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user information
 * @body    {
 *            name, email, mobile, designation,
 *            role_id, department_id, manager_id,
 *            department_head_id, joining_date, profile_image
 *          }
 * @access  Private - Requires 'Users.Edit' permission
 */
router.put(
  '/:id',
  requirePermission('Users', 'Edit'),
  userManagementController.updateUser
);

/**
 * @route   PATCH /api/users/:id/status
 * @desc    Change user status (activate, deactivate, suspend, lock)
 * @body    { status: 'active|inactive|suspended|locked', reason?: string }
 * @access  Private - Requires 'Users.Edit' permission
 */
router.patch(
  '/:id/status',
  requirePermission('Users', 'Edit'),
  userManagementController.changeUserStatus
);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user (with dependency checks)
 * @access  Private - Requires 'Users.Delete' permission
 */
router.delete(
  '/:id',
  requirePermission('Users', 'Delete'),
  userManagementController.deleteUser
);

/**
 * @route   GET /api/users/:id/access-preview
 * @desc    Get user access preview (all permissions)
 * @access  Private - Requires 'Users.View' permission
 */
router.get(
  '/:id/access-preview',
  requirePermission('Users', 'View'),
  userManagementController.getUserAccessPreview
);

export default router;
