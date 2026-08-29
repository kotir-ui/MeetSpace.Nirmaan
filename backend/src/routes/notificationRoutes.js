import { Router } from 'express';
import {
  listNotifications,
  markRead,
  markAllRead,
  clearNotifications,
} from '../controllers/notificationController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);
router.get('/', listNotifications);
router.patch('/read-all', markAllRead);
router.patch('/:id/read', markRead);
router.delete('/', clearNotifications);

export default router;
