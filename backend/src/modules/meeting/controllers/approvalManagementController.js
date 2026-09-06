import db from '../../../models/index.js';
import ActivityLog from '../../../models/ActivityLog.js';
import {
  notifyBookingApproval,
} from '../services/notificationService.js';

const { ApprovalRequest, ApprovalHistory, MeetingBooking, User, BookingStatusHistory } = db;

/**
 * Get all approval requests with filtering
 */
export const getAllApprovals = async (req, res) => {
  try {
    const { status, approver_type, approver_id, search } = req.query;

    const where = {};
    if (status) where.status = status;
    if (approver_type) where.approver_type = approver_type;
    if (approver_id) where.approver_id = approver_id;

    const approvals = await ApprovalRequest.findAll({
      where,
      include: [
        {
          model: MeetingBooking,
          as: 'booking',
          attributes: ['id', 'booking_number', 'title', 'meeting_date', 'start_time', 'end_time'],
          include: [
            { model: User, as: 'organizer', attributes: ['id', 'name', 'email'] },
          ],
        },
        {
          model: User,
          as: 'approver',
          attributes: ['id', 'name', 'email', 'designation'],
        },
      ],
      order: [['created_at', 'DESC']],
    });

    res.status(200).json({
      success: true,
      message: 'Approval requests retrieved',
      data: approvals,
      count: approvals.length,
    });
  } catch (error) {
    console.error('Error fetching approvals:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving approvals',
      error: error.message,
    });
  }
};

/**
 * Get pending approvals for current user
 */
export const getPendingApprovals = async (req, res) => {
  try {
    const userId = req.user.id;

    const approvals = await ApprovalRequest.findAll({
      where: {
        approver_id: userId,
        status: 'pending',
      },
      include: [
        {
          model: MeetingBooking,
          as: 'booking',
          attributes: ['id', 'booking_number', 'title', 'meeting_date', 'start_time', 'end_time', 'purpose'],
          include: [
            { model: User, as: 'organizer', attributes: ['id', 'name', 'email', 'designation'] },
          ],
        },
      ],
      order: [['created_at', 'ASC']],
    });

    res.status(200).json({
      success: true,
      message: `Found ${approvals.length} pending approvals`,
      data: approvals,
      count: approvals.length,
    });
  } catch (error) {
    console.error('Error fetching pending approvals:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving pending approvals',
      error: error.message,
    });
  }
};

/**
 * Get single approval request
 */
export const getApprovalById = async (req, res) => {
  try {
    const { id } = req.params;

    const approval = await ApprovalRequest.findByPk(id, {
      include: [
        {
          model: MeetingBooking,
          as: 'booking',
          include: [
            { model: User, as: 'organizer' },
            { association: 'participants' },
          ],
        },
        {
          model: User,
          as: 'approver',
          attributes: ['id', 'name', 'email'],
        },
        {
          association: 'history',
          include: [
            { model: User, as: 'performer', attributes: ['id', 'name', 'email'] },
          ],
        },
      ],
    });

    if (!approval) {
      return res.status(404).json({
        success: false,
        message: 'Approval request not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Approval retrieved',
      data: approval,
    });
  } catch (error) {
    console.error('Error fetching approval:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving approval',
      error: error.message,
    });
  }
};

/**
 * Approve a booking
 */
export const approveBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { comments = null } = req.body;

    const approval = await ApprovalRequest.findByPk(id);
    if (!approval) {
      return res.status(404).json({
        success: false,
        message: 'Approval request not found',
      });
    }

    if (approval.status !== 'pending') {
      return res.status(409).json({
        success: false,
        message: `Approval already ${approval.status}`,
      });
    }

    // Verify approver permission
    if (approval.approver_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to approve this request',
      });
    }

    // Update approval
    await approval.update({
      status: 'approved',
      comments: comments || null,
      approved_at: new Date(),
    });

    // Create history record
    await ApprovalHistory.create({
      approval_request_id: approval.id,
      action: 'approved',
      performed_by_id: req.user.id,
      notes: comments || null,
      ip_address: req.ip,
    });

    // Update booking status
    const booking = await MeetingBooking.findByPk(approval.meeting_booking_id);
    if (booking) {
      const oldStatus = booking.approval_status;
      await booking.update({
        approval_status: 'approved',
        booking_status: 'confirmed',
      });

      // Log status change
      await BookingStatusHistory.create({
        meeting_booking_id: booking.id,
        previous_status: booking.status,
        new_status: 'confirmed',
        changed_by_id: req.user.id,
        reason: `Approved by ${approval.approver_type}`,
      });

      // Notify organizer
      await notifyBookingApproval(booking.id, 'approved', comments);
    }

    // Log activity
    await ActivityLog.create({
      user_id: req.user.id,
      action: 'BOOKING_APPROVED',
      entity_type: 'ApprovalRequest',
      entity_id: approval.id,
      description: `Approved booking: ${booking?.title}`,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
    });

    res.status(200).json({
      success: true,
      message: 'Booking approved successfully',
      data: approval,
    });
  } catch (error) {
    console.error('Error approving booking:', error);
    res.status(500).json({
      success: false,
      message: 'Error approving booking',
      error: error.message,
    });
  }
};

/**
 * Reject a booking
 */
export const rejectBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason = null } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required',
      });
    }

    const approval = await ApprovalRequest.findByPk(id);
    if (!approval) {
      return res.status(404).json({
        success: false,
        message: 'Approval request not found',
      });
    }

    if (approval.status !== 'pending') {
      return res.status(409).json({
        success: false,
        message: `Approval already ${approval.status}`,
      });
    }

    // Verify approver permission
    if (approval.approver_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to reject this request',
      });
    }

    // Update approval
    await approval.update({
      status: 'rejected',
      comments: reason,
      rejected_at: new Date(),
    });

    // Create history record
    await ApprovalHistory.create({
      approval_request_id: approval.id,
      action: 'rejected',
      performed_by_id: req.user.id,
      notes: reason,
      ip_address: req.ip,
    });

    // Update booking status
    const booking = await MeetingBooking.findByPk(approval.meeting_booking_id);
    if (booking) {
      await booking.update({
        approval_status: 'rejected',
        booking_status: 'cancelled',
      });

      // Log status change
      await BookingStatusHistory.create({
        meeting_booking_id: booking.id,
        previous_status: booking.status,
        new_status: 'cancelled',
        changed_by_id: req.user.id,
        reason: `Rejected by ${approval.approver_type}: ${reason}`,
      });

      // Notify organizer
      await notifyBookingApproval(booking.id, 'rejected', reason);
    }

    // Log activity
    await ActivityLog.create({
      user_id: req.user.id,
      action: 'BOOKING_REJECTED',
      entity_type: 'ApprovalRequest',
      entity_id: approval.id,
      description: `Rejected booking: ${booking?.title}. Reason: ${reason}`,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
    });

    res.status(200).json({
      success: true,
      message: 'Booking rejected',
      data: approval,
    });
  } catch (error) {
    console.error('Error rejecting booking:', error);
    res.status(500).json({
      success: false,
      message: 'Error rejecting booking',
      error: error.message,
    });
  }
};

/**
 * Add comment to approval (without approving/rejecting)
 */
export const addApprovalComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;

    if (!comment) {
      return res.status(400).json({
        success: false,
        message: 'Comment is required',
      });
    }

    const approval = await ApprovalRequest.findByPk(id);
    if (!approval) {
      return res.status(404).json({
        success: false,
        message: 'Approval request not found',
      });
    }

    // Create history record for comment
    await ApprovalHistory.create({
      approval_request_id: approval.id,
      action: 'commented',
      performed_by_id: req.user.id,
      notes: comment,
      ip_address: req.ip,
    });

    // Log activity
    await ActivityLog.create({
      user_id: req.user.id,
      action: 'APPROVAL_COMMENT',
      entity_type: 'ApprovalRequest',
      entity_id: approval.id,
      description: `Added comment to approval request`,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
    });

    res.status(200).json({
      success: true,
      message: 'Comment added successfully',
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding comment',
      error: error.message,
    });
  }
};

/**
 * Get approval history for a booking
 */
export const getApprovalHistory = async (req, res) => {
  try {
    const { bookingId } = req.query;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: 'bookingId query parameter is required',
      });
    }

    const history = await ApprovalHistory.findAll({
      include: [
        {
          model: ApprovalRequest,
          as: 'approval',
          where: { meeting_booking_id: bookingId },
        },
        {
          model: User,
          as: 'performer',
          attributes: ['id', 'name', 'email', 'designation'],
        },
      ],
      order: [['created_at', 'DESC']],
    });

    res.status(200).json({
      success: true,
      message: 'Approval history retrieved',
      data: history,
      count: history.length,
    });
  } catch (error) {
    console.error('Error fetching approval history:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving approval history',
      error: error.message,
    });
  }
};
