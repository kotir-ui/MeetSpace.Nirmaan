import express from 'express';
import { requireAuth } from '../../../middleware/auth.js';
import { requirePermission } from '../../../middleware/authorization.js';
import * as roomController from '../controllers/roomManagementController.js';
import * as bookingController from '../controllers/bookingManagementController.js';
import * as approvalController from '../controllers/approvalManagementController.js';
import * as notificationController from '../controllers/notificationController.js';

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

// ============ ROOM MANAGEMENT ROUTES (Phase 3) ============

/**
 * @route   GET /api/meeting-rooms
 * @desc    Get all meeting rooms with filtering
 * @access  Private - Requires 'MeetingRooms.View' permission
 */
router.get(
  '/rooms',
  requirePermission('MeetingRooms', 'View'),
  roomController.getAllRooms
);

/**
 * @route   GET /api/meeting-rooms/:id
 * @desc    Get single meeting room by ID
 * @access  Private - Requires 'MeetingRooms.View' permission
 */
router.get(
  '/rooms/:id',
  requirePermission('MeetingRooms', 'View'),
  roomController.getRoomById
);

/**
 * @route   POST /api/meeting-rooms
 * @desc    Create new meeting room
 * @access  Private - Requires 'MeetingRooms.Create' permission
 */
router.post(
  '/rooms',
  requirePermission('MeetingRooms', 'Create'),
  roomController.createRoom
);

/**
 * @route   PUT /api/meeting-rooms/:id
 * @desc    Update meeting room
 * @access  Private - Requires 'MeetingRooms.Edit' permission
 */
router.put(
  '/rooms/:id',
  requirePermission('MeetingRooms', 'Edit'),
  roomController.updateRoom
);

/**
 * @route   PATCH /api/meeting-rooms/:id/status
 * @desc    Change room status
 * @access  Private - Requires 'MeetingRooms.Edit' permission
 */
router.patch(
  '/rooms/:id/status',
  requirePermission('MeetingRooms', 'Edit'),
  roomController.changeRoomStatus
);

/**
 * @route   DELETE /api/meeting-rooms/:id
 * @desc    Delete meeting room
 * @access  Private - Requires 'MeetingRooms.Delete' permission
 */
router.delete(
  '/rooms/:id',
  requirePermission('MeetingRooms', 'Delete'),
  roomController.deleteRoom
);

/**
 * @route   GET /api/meeting-rooms/check-availability
 * @desc    Check room availability for time slot
 * @access  Private - Requires 'MeetingRooms.View' permission
 */
router.get(
  '/rooms/check-availability',
  requirePermission('MeetingRooms', 'View'),
  roomController.checkAvailability
);

/**
 * @route   GET /api/meeting-rooms/search-available
 * @desc    Search for available rooms matching criteria
 * @access  Private - Requires 'MeetingRooms.View' permission
 */
router.get(
  '/rooms/search-available',
  requirePermission('MeetingRooms', 'View'),
  roomController.searchAvailableRooms
);

// ============ BOOKING MANAGEMENT ROUTES (Phase 4) ============

/**
 * @route   GET /api/bookings
 * @desc    Get all bookings with filtering
 * @access  Private - Requires 'Bookings.View' permission
 */
router.get(
  '/',
  requirePermission('Bookings', 'View'),
  bookingController.getAllBookings
);

/**
 * @route   GET /api/bookings/:id
 * @desc    Get single booking by ID
 * @access  Private - Requires 'Bookings.View' permission
 */
router.get(
  '/:id',
  requirePermission('Bookings', 'View'),
  bookingController.getBookingById
);

/**
 * @route   POST /api/bookings
 * @desc    Create new booking (initially in draft status)
 * @access  Private - Requires 'Bookings.Create' permission
 */
router.post(
  '/',
  requirePermission('Bookings', 'Create'),
  bookingController.createBooking
);

/**
 * @route   PUT /api/bookings/:id
 * @desc    Update booking (draft only)
 * @access  Private - Requires 'Bookings.Edit' permission
 */
router.put(
  '/:id',
  requirePermission('Bookings', 'Edit'),
  bookingController.updateBooking
);

/**
 * @route   POST /api/bookings/:id/submit
 * @desc    Submit booking for approval
 * @access  Private - Requires 'Bookings.Submit' permission
 */
router.post(
  '/:id/submit',
  requirePermission('Bookings', 'Submit'),
  bookingController.submitBooking
);

/**
 * @route   POST /api/bookings/:id/cancel
 * @desc    Cancel booking
 * @access  Private - Requires 'Bookings.Edit' permission
 */
router.post(
  '/:id/cancel',
  requirePermission('Bookings', 'Edit'),
  bookingController.cancelBooking
);

/**
 * @route   GET /api/bookings/occupancy/report
 * @desc    Get room occupancy report
 * @access  Private - Requires 'Bookings.View' permission
 */
router.get(
  '/occupancy/report',
  requirePermission('Bookings', 'View'),
  bookingController.getRoomOccupancyReport
);

// ============ APPROVAL MANAGEMENT ROUTES (Phase 5) ============

/**
 * @route   GET /api/approvals
 * @desc    Get all approval requests
 * @access  Private - Requires 'Approvals.View' permission
 */
router.get(
  '/approvals',
  requirePermission('Approvals', 'View'),
  approvalController.getAllApprovals
);

/**
 * @route   GET /api/approvals/pending
 * @desc    Get pending approvals for current user
 * @access  Private - Requires 'Approvals.View' permission
 */
router.get(
  '/approvals/pending',
  requirePermission('Approvals', 'View'),
  approvalController.getPendingApprovals
);

/**
 * @route   GET /api/approvals/:id
 * @desc    Get single approval request
 * @access  Private - Requires 'Approvals.View' permission
 */
router.get(
  '/approvals/:id',
  requirePermission('Approvals', 'View'),
  approvalController.getApprovalById
);

/**
 * @route   POST /api/approvals/:id/approve
 * @desc    Approve a booking
 * @access  Private - Requires 'Approvals.Approve' permission
 */
router.post(
  '/approvals/:id/approve',
  requirePermission('Approvals', 'Approve'),
  approvalController.approveBooking
);

/**
 * @route   POST /api/approvals/:id/reject
 * @desc    Reject a booking
 * @access  Private - Requires 'Approvals.Reject' permission
 */
router.post(
  '/approvals/:id/reject',
  requirePermission('Approvals', 'Reject'),
  approvalController.rejectBooking
);

/**
 * @route   POST /api/approvals/:id/comment
 * @desc    Add comment to approval
 * @access  Private - Requires 'Approvals.View' permission
 */
router.post(
  '/approvals/:id/comment',
  requirePermission('Approvals', 'View'),
  approvalController.addApprovalComment
);

/**
 * @route   GET /api/approvals/history
 * @desc    Get approval history for booking
 * @access  Private - Requires 'Approvals.View' permission
 */
router.get(
  '/approvals/history',
  requirePermission('Approvals', 'View'),
  approvalController.getApprovalHistory
);

// ============ NOTIFICATION ROUTES (Phase 5) ============

/**
 * @route   GET /api/notifications
 * @desc    Get user notifications
 * @access  Private - Any authenticated user
 */
router.get(
  '/notifications',
  notificationController.getNotifications
);

/**
 * @route   GET /api/notifications/unread-count
 * @desc    Get unread notification count
 * @access  Private - Any authenticated user
 */
router.get(
  '/notifications/unread-count',
  notificationController.getUnreadNotificationCount
);

/**
 * @route   GET /api/notifications/:id
 * @desc    Get single notification
 * @access  Private - Any authenticated user
 */
router.get(
  '/notifications/:id',
  notificationController.getNotificationById
);

/**
 * @route   PATCH /api/notifications/:id/read
 * @desc    Mark notification as read
 * @access  Private - Any authenticated user
 */
router.patch(
  '/notifications/:id/read',
  notificationController.markAsRead
);

/**
 * @route   PATCH /api/notifications/mark-all-read
 * @desc    Mark all notifications as read
 * @access  Private - Any authenticated user
 */
router.patch(
  '/notifications/mark-all-read',
  notificationController.markAllAsRead
);

/**
 * @route   DELETE /api/notifications/:id
 * @desc    Delete notification
 * @access  Private - Any authenticated user
 */
router.delete(
  '/notifications/:id',
  notificationController.deleteNotification
);

/**
 * @route   DELETE /api/notifications
 * @desc    Delete all notifications
 * @access  Private - Any authenticated user
 */
router.delete(
  '/notifications',
  notificationController.deleteAllNotifications
);

export default router;
