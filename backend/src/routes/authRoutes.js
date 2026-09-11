import { Router } from 'express';
import {
  login,
  register,
  me,
  authConfig,
  changePassword,
  forgotPassword,
  resetPassword,
  updateProfile,
  googleLogin,
} from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/login', login);
router.post('/google-login', googleLogin);
router.post('/register', register);
router.get('/config', authConfig);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/me', authenticate, me);
router.post('/change-password', authenticate, changePassword);
router.put('/profile', authenticate, updateProfile);

export default router;
