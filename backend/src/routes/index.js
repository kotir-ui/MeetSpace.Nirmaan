import { Router } from 'express';
import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';
import settingsRoutes from './settingsRoutes.js';
import departmentRoutes from './departmentRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import bookingRoutes from '../modules/meeting/routes/bookingRoutes.js';
import managementRoutes from '../modules/meeting/routes/managementRoutes.js';

const router = Router();

router.get('/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/settings', settingsRoutes);
router.use('/departments', departmentRoutes);
router.use('/notifications', notificationRoutes);
router.use('/booking', bookingRoutes);
router.use('/meeting', managementRoutes); // Phase 3, 4, 5 routes

export default router;
