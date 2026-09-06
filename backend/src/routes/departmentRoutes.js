import { Router } from 'express';
import {
  getAllDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  changeDepartmentStatus,
  deleteDepartment,
  getDepartmentMembers,
} from '../controllers/departmentManagementController.js';
import { requireAuth } from '../middleware/auth.js';
import { requirePermission } from '../middleware/authorization.js';

const router = Router();

// All routes require authentication
router.use(requireAuth);

// Department management endpoints with permission checks
router.get('/', requirePermission('Departments', 'View'), getAllDepartments);
router.get('/:id', requirePermission('Departments', 'View'), getDepartmentById);
router.post('/', requirePermission('Departments', 'Create'), createDepartment);
router.put('/:id', requirePermission('Departments', 'Edit'), updateDepartment);
router.patch('/:id/status', requirePermission('Departments', 'Edit'), changeDepartmentStatus);
router.delete('/:id', requirePermission('Departments', 'Delete'), deleteDepartment);
router.get('/:id/members', requirePermission('Departments', 'View'), getDepartmentMembers);

export default router;
