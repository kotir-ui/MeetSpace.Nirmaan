import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { requirePermission } from '../middleware/authorization.js';
import * as departmentManagementController from '../controllers/departmentManagementController.js';

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

/**
 * @route   GET /api/departments
 * @desc    Get all departments with optional filtering
 * @query   status - Filter by status (active, inactive)
 * @query   search - Search by name or code
 * @access  Private - Requires 'Departments.View' permission
 */
router.get(
  '/',
  requirePermission('Departments', 'View'),
  departmentManagementController.getAllDepartments
);

/**
 * @route   GET /api/departments/:id
 * @desc    Get single department by ID with members and statistics
 * @access  Private - Requires 'Departments.View' permission
 */
router.get(
  '/:id',
  requirePermission('Departments', 'View'),
  departmentManagementController.getDepartmentById
);

/**
 * @route   POST /api/departments
 * @desc    Create new department
 * @body    {
 *            name, code, department_head_id, deputy_id,
 *            email, description
 *          }
 * @access  Private - Requires 'Departments.Create' permission
 */
router.post(
  '/',
  requirePermission('Departments', 'Create'),
  departmentManagementController.createDepartment
);

/**
 * @route   PUT /api/departments/:id
 * @desc    Update department information
 * @body    {
 *            name, code, department_head_id, deputy_id,
 *            email, description
 *          }
 * @access  Private - Requires 'Departments.Edit' permission
 */
router.put(
  '/:id',
  requirePermission('Departments', 'Edit'),
  departmentManagementController.updateDepartment
);

/**
 * @route   PATCH /api/departments/:id/status
 * @desc    Change department status (activate, deactivate)
 * @body    { status: 'active|inactive' }
 * @access  Private - Requires 'Departments.Edit' permission
 */
router.patch(
  '/:id/status',
  requirePermission('Departments', 'Edit'),
  departmentManagementController.changeDepartmentStatus
);

/**
 * @route   DELETE /api/departments/:id
 * @desc    Delete department (with dependency checks)
 * @access  Private - Requires 'Departments.Delete' permission
 */
router.delete(
  '/:id',
  requirePermission('Departments', 'Delete'),
  departmentManagementController.deleteDepartment
);

/**
 * @route   GET /api/departments/:id/members
 * @desc    Get all members of a department
 * @query   status - Filter by user status
 * @access  Private - Requires 'Departments.View' permission
 */
router.get(
  '/:id/members',
  requirePermission('Departments', 'View'),
  departmentManagementController.getDepartmentMembers
);

export default router;
