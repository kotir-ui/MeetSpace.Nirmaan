import { Router } from 'express';
import {
  login,
  register,
  me,
  authConfig,
  changePassword,
  forgotPassword,
  resetPassword,
} from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/login', login);
router.post('/register', register);
router.get('/config', authConfig);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/me', authenticate, me);
router.post('/change-password', authenticate, changePassword);

export default router;
