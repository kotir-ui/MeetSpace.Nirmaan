import db from '../models/index.js';
import { Op } from 'sequelize';

const { MeetingBooking, ApprovalRequest, ApprovalHistory, User, Department, Notification, BookingStatusHistory } = db;

// Helper: Create notification
const createNotification = async (userId, title, message, type, bookingId = null) => {
  try {
    await Notification.create({
      user_id: userId,
      title,
      message,
      type,
      related_booking_id: bookingId,
    });
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
};

// Helper: Log status change
const logStatusChange = async (bookingId, previousStatus, newStatus, changedById, reason = null) => {
  try {
    await BookingStatusHistory.create({
      meeting_booking_id: bookingId,
      previous_status: previousStatus,
      new_status: newStatus,
      changed_by_id: changedById,
      reason,
    });
  } catch (error) {
    console.error('Failed to log status change:', error);
  }
};

// Get pending approvals for current user
export const getPendingApprovals = async (req, res) => {
  try {
    const { userId } = req.user;
    const { approverType } = req.query;

    let where = {
      approver_id: userId,
      status: 'pending',
    };

    if (approverType) {
      where.approver_type = approverType;
    }

    const approvals = await ApprovalRequest.findAll({
      where,
      include: [
        {
          model: MeetingBooking,
          as: 'booking',
          include: [
            { model: User, as: 'organizer', attributes: ['id', 'name', 'email'] },
            { model: Department, as: 'department', attributes: ['id', 'name'] },
          ],
        },
        { model: User, as: 'approver', attributes: ['id', 'name', 'email'] },
      ],
      order: [['created_at', 'DESC']],
    });

    res.json({ success: true, data: approvals });
  } catch (error) {
    console.error('Error fetching pending approvals:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get all approvals for a booking
export const getApprovalHistory = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const approvals = await ApprovalRequest.findAll({
      where: { meeting_booking_id: bookingId },
      include: [
        {
          model: ApprovalHistory,
          as: 'history',
          include: [{ model: User, as: 'performer', attributes: ['id', 'name', 'email'] }],
          order: [['created_at', 'DESC']],
        },
        { model: User, as: 'approver', attributes: ['id', 'name', 'email'] },
      ],
    });

    res.json({ success: true, data: approvals });
  } catch (error) {
    console.error('Error fetching approval history:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get approval dashboard (summary for approvers)
export const getApprovalDashboard = async (req, res) => {
  try {
    const { userId } = req.user;

    const pending = await ApprovalRequest.count({
      where: { approver_id: userId, status: 'pending' },
    });

    const approved = await ApprovalRequest.count({
      where: { approver_id: userId, status: 'approved' },
    });

    const rejected = await ApprovalRequest.count({
      where: { approver_id: userId, status: 'rejected' },
    });

    res.json({
      success: true,
      data: {
        pending,
        approved,
        rejected,
        total: pending + approved + rejected,
      },
    });
  } catch (error) {
    console.error('Error fetching approval dashboard:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Approve booking
export const approveBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.user;
    const { comments } = req.body;

    const approval = await ApprovalRequest.findByPk(id);
    if (!approval) {
      return res.status(404).json({ success: false, error: 'Approval request not found' });
    }

    // Check if user is the approver
    if (approval.approver_id !== userId) {
      return res.status(403).json({ success: false, error: 'Not authorized to approve this request' });
    }

    // Get the booking
    const booking = await MeetingBooking.findByPk(approval.meeting_booking_id);
    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    const previousStatus = booking.status;

    // Update approval
    await approval.update({
      status: 'approved',
      comments,
      approved_at: new Date(),
    });

    // Log approval history
    await ApprovalHistory.create({
      approval_request_id: id,
      action: 'approved',
      performed_by_id: userId,
      notes: comments,
    });

    // Determine next status
    let newStatus = booking.status;
    if (approval.approver_type === 'department_head') {
      // After department head approval, move to HR
      newStatus = 'pending_hr';

      // Get HR approver (first HR user or admin)
      const hrApprover = await User.findOne({
        include: [
          {
            association: 'role',
            attributes: ['id', 'name'],
            where: { name: { [Op.in]: ['Super Admin', 'Admin'] } },
          },
        ],
      });

      if (hrApprover) {
        // Create HR approval request
        await ApprovalRequest.create({
          meeting_booking_id: booking.id,
          approver_id: hrApprover.id,
          approver_type: 'hr',
          status: 'pending',
        });

        // Notify HR approver
        await createNotification(
          hrApprover.id,
          'HR Approval Required',
          `${booking.title} requires HR approval - ${booking.meeting_date}`,
          'approval_required',
          booking.id
        );
      }
    } else if (approval.approver_type === 'hr') {
      // After HR approval, booking is confirmed
      newStatus = 'confirmed';
    }

    // Update booking status
    await booking.update({ status: newStatus });

    // Log status change
    await logStatusChange(booking.id, previousStatus, newStatus, userId, `Approved by ${approval.approver_type}`);

    // Notify organizer
    await createNotification(
      booking.organizer_id,
      'Booking Approved',
      `Your booking "${booking.title}" has been approved`,
      'approved',
      booking.id
    );

    // If confirmed, notify all participants
    if (newStatus === 'confirmed') {
      const participants = await db.BookingParticipant.findAll({
        where: { meeting_booking_id: booking.id },
        attributes: ['participant_id'],
      });

      for (const p of participants) {
        if (p.participant_id !== booking.organizer_id) {
          await createNotification(
            p.participant_id,
            'Meeting Confirmed',
            `${booking.title} on ${booking.meeting_date} has been confirmed`,
            'confirmation',
            booking.id
          );
        }
      }
    }

    res.json({ success: true, message: 'Booking approved successfully', data: booking });
  } catch (error) {
    console.error('Error approving booking:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Reject booking
export const rejectBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.user;
    const { comments } = req.body;

    const approval = await ApprovalRequest.findByPk(id);
    if (!approval) {
      return res.status(404).json({ success: false, error: 'Approval request not found' });
    }

    // Check if user is the approver
    if (approval.approver_id !== userId) {
      return res.status(403).json({ success: false, error: 'Not authorized to reject this request' });
    }

    // Get the booking
    const booking = await MeetingBooking.findByPk(approval.meeting_booking_id);
    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    const previousStatus = booking.status;

    // Update approval
    await approval.update({
      status: 'rejected',
      comments,
      rejected_at: new Date(),
    });

    // Log rejection history
    await ApprovalHistory.create({
      approval_request_id: id,
      action: 'rejected',
      performed_by_id: userId,
      notes: comments,
    });

    // Update booking status
    const newStatus = `rejected_by_${approval.approver_type}`;
    await booking.update({ status: 'rejected' });

    // Log status change
    await logStatusChange(booking.id, previousStatus, 'rejected', userId, `Rejected by ${approval.approver_type}: ${comments}`);

    // Notify organizer
    await createNotification(
      booking.organizer_id,
      'Booking Rejected',
      `Your booking "${booking.title}" has been rejected. Reason: ${comments}`,
      'rejected',
      booking.id
    );

    res.json({ success: true, message: 'Booking rejected successfully', data: booking });
  } catch (error) {
    console.error('Error rejecting booking:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get approval statistics
export const getApprovalStats = async (req, res) => {
  try {
    const totalApprovals = await ApprovalRequest.count();
    const pendingApprovals = await ApprovalRequest.count({ where: { status: 'pending' } });
    const approvedApprovals = await ApprovalRequest.count({ where: { status: 'approved' } });
    const rejectedApprovals = await ApprovalRequest.count({ where: { status: 'rejected' } });

    res.json({
      success: true,
      data: {
        total: totalApprovals,
        pending: pendingApprovals,
        approved: approvedApprovals,
        rejected: rejectedApprovals,
        completionRate: totalApprovals > 0 ? ((approvedApprovals + rejectedApprovals) / totalApprovals * 100).toFixed(2) : 0,
      },
    });
  } catch (error) {
    console.error('Error fetching approval stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export default { getPendingApprovals, getApprovalHistory, getApprovalDashboard, approveBooking, rejectBooking, getApprovalStats };
