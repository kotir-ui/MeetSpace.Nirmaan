import { Router } from 'express';
import {
  listDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from '../controllers/departmentController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);
router.get('/', listDepartments);
router.post('/', authorize('Super Admin', 'Admin'), createDepartment);
router.put('/:id', authorize('Super Admin', 'Admin'), updateDepartment);
router.delete('/:id', authorize('Super Admin', 'Admin'), deleteDepartment);

export default router;
