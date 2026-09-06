import { Router } from 'express';
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  changeUserStatus,
  deleteUser,
  getUserAccessPreview,
} from '../controllers/userManagementController.js';
import { getRoles } from '../controllers/userController.js';
import { requireAuth } from '../middleware/auth.js';
import { requirePermission } from '../middleware/authorization.js';

const router = Router();

// All routes require authentication
router.use(requireAuth);

// Get roles list (available to all authenticated users)
router.get('/roles', getRoles);

// User management endpoints with permission checks
router.get('/', requirePermission('Users', 'View'), getAllUsers);
router.get('/:id', requirePermission('Users', 'View'), getUserById);
router.post('/', requirePermission('Users', 'Create'), createUser);
router.put('/:id', requirePermission('Users', 'Edit'), updateUser);
router.patch('/:id/status', requirePermission('Users', 'Edit'), changeUserStatus);
router.delete('/:id', requirePermission('Users', 'Delete'), deleteUser);
router.get('/:id/access-preview', requirePermission('Users', 'View'), getUserAccessPreview);

export default router;
