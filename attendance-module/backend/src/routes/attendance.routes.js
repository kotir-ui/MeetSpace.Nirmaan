import { Router } from 'express';
import { createCheckIn, getAttendance } from '../controllers/attendance.controller.js';
import { attendanceAuth } from '../middleware/auth.js';

const router = Router();
router.use(attendanceAuth);
router.get('/', getAttendance);
router.post('/check-in', createCheckIn);

export default router;
