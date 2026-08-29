import express from 'express';
import * as bookingController from '../controllers/bookingController.js';
import * as approvalController from '../controllers/approvalController.js';
import * as roomController from '../controllers/roomController.js';
import * as notificationController from '../controllers/bookingNotificationController.js';
import { authenticate, authorize } from '../../../middleware/auth.js';

const router = express.Router();

// ===== BOOKINGS =====
// Get all bookings (with role-based filtering)
router.get('/bookings', authenticate, bookingController.getBookings);

// Check room availability
router.get('/bookings/availability', authenticate, bookingController.checkAvailability);

// Get dashboard summary
router.get('/dashboard-summary', authenticate, bookingController.getDashboardSummary);

// Create booking
router.post('/bookings', authenticate, bookingController.createBooking);

// Get booking details
router.get('/bookings/:id', authenticate, bookingController.getBookingDetails);

// Update booking
router.put('/bookings/:id', authenticate, bookingController.updateBooking);

// Cancel booking
router.delete('/bookings/:id', authenticate, bookingController.cancelBooking);

// ===== ROOMS =====
// Get all rooms
router.get('/rooms', authenticate, roomController.getAllRooms);

// Get room details
router.get('/rooms/:id', authenticate, roomController.getRoomDetails);

// Get room schedule
router.get('/rooms/:id/schedule', authenticate, roomController.getRoomSchedule);

// Room statistics
router.get('/rooms/stats', authenticate, roomController.getRoomStats);

// Create room (admin only)
router.post('/rooms', authenticate, authorize('Super Admin', 'Admin', 'Department Manager'), roomController.createRoom);

// Update room (admin only)
router.put('/rooms/:id', authenticate, authorize('Super Admin', 'Admin', 'Department Manager'), roomController.updateRoom);

// Delete room (admin only)
router.delete('/rooms/:id', authenticate, authorize('Super Admin', 'Admin', 'Department Manager'), roomController.deleteRoom);

// ===== APPROVALS =====
// Get pending approvals for current user
router.get('/approvals/pending', authenticate, approvalController.getPendingApprovals);

// Get approval dashboard
router.get('/approvals/dashboard', authenticate, approvalController.getApprovalDashboard);

// Get approval statistics
router.get('/approvals/stats', authenticate, approvalController.getApprovalStats);

// Get approval history for a booking
router.get('/approvals/history/:bookingId', authenticate, approvalController.getApprovalHistory);

// Approve booking
router.post('/approvals/:id/approve', authenticate, approvalController.approveBooking);

// Reject booking
router.post('/approvals/:id/reject', authenticate, approvalController.rejectBooking);

// ===== NOTIFICATIONS =====
// Get user notifications
router.get('/notifications', authenticate, notificationController.getUserNotifications);

// Get unread count
router.get('/notifications/unread-count', authenticate, notificationController.getUnreadCount);

// Get notification statistics
router.get('/notifications/stats', authenticate, notificationController.getNotificationStats);

// Mark notification as read
router.put('/notifications/:id/read', authenticate, notificationController.markAsRead);

// Mark all as read
router.put('/notifications/read-all', authenticate, notificationController.markAllAsRead);

// Delete notification
router.delete('/notifications/:id', authenticate, notificationController.deleteNotification);

// Delete all notifications
router.delete('/notifications', authenticate, notificationController.deleteAllNotifications);

export default router;
