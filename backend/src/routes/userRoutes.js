import { Router } from 'express';
import {
  listUsers,
  createUser,
  updateUser,
  deleteUser,
  getRoles,
  resetUserPassword,
} from '../controllers/userController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/roles', getRoles);
router.get('/', authorize('Super Admin', 'Admin', 'Manager'), listUsers);
router.post('/', authorize('Super Admin', 'Admin'), createUser);
router.put('/:id', authorize('Super Admin', 'Admin'), updateUser);
router.post('/:id/reset-password', authorize('Super Admin', 'Admin'), resetUserPassword);
router.delete('/:id', authorize('Super Admin', 'Admin'), deleteUser);

export default router;
