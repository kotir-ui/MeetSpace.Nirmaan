import db from '../models/index.js';
import { Op } from 'sequelize';
import { sendBookingApprovedMail, sendBookingRejectedMail } from '../../../services/emailService.js';

const { MeetingBooking, MeetingRoom, ApprovalRequest, ApprovalHistory, User, Department, Notification, BookingStatusHistory } = db;

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
    const userId = req.user.id;
    const userRole = req.user?.role?.name || '';
    const isAdmin = ['Super Admin', 'Admin'].includes(userRole);
    const { approverType } = req.query;

    let where = {
      status: 'pending',
    };

    if (!isAdmin) {
      where.approver_id = userId;
    }

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
    const userId = req.user.id;
    const userRole = req.user?.role?.name || '';
    const isAdmin = ['Super Admin', 'Admin'].includes(userRole);

    const pendingWhere = isAdmin ? { status: 'pending' } : { approver_id: userId, status: 'pending' };
    const approvedWhere = isAdmin ? { status: 'approved' } : { approver_id: userId, status: 'approved' };
    const rejectedWhere = isAdmin ? { status: 'rejected' } : { approver_id: userId, status: 'rejected' };

    const pending = await ApprovalRequest.count({ where: pendingWhere });
    const approved = await ApprovalRequest.count({ where: approvedWhere });
    const rejected = await ApprovalRequest.count({ where: rejectedWhere });

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
    const userId = req.user.id;
    const userRole = req.user?.role?.name || '';
    const isAdmin = ['Super Admin', 'Admin'].includes(userRole);
    const { comments, alternateRoomId, roomId } = req.body;

    const approval = await ApprovalRequest.findByPk(id);
    if (!approval) {
      return res.status(404).json({ success: false, error: 'Approval request not found' });
    }

    // Check if user is the approver or an admin
    if (approval.approver_id !== userId && !isAdmin) {
      return res.status(403).json({ success: false, error: 'Not authorized to approve this request' });
    }

    // Get the booking
    const booking = await MeetingBooking.findByPk(approval.meeting_booking_id);
    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    // Handle Alternate Room Allocation if requested
    let targetRoomId = alternateRoomId || roomId || booking.meeting_room_id;
    let wasReallocated = false;
    let originalRoomName = '';

    if (targetRoomId && parseInt(targetRoomId, 10) !== booking.meeting_room_id) {
      targetRoomId = parseInt(targetRoomId, 10);
      const originalRoom = await MeetingRoom.findByPk(booking.meeting_room_id);
      originalRoomName = originalRoom?.name || 'Previous Room';
      const newRoom = await MeetingRoom.findByPk(targetRoomId);

      if (!newRoom) {
        return res.status(404).json({ success: false, error: 'Selected alternate room not found' });
      }

      await booking.update({ meeting_room_id: targetRoomId });
      wasReallocated = true;
    }

    // Check if there is already a confirmed booking for the target room, same date, and overlapping time slot!
    const conflictBooking = await MeetingBooking.findOne({
      where: {
        id: { [Op.ne]: booking.id },
        meeting_room_id: targetRoomId,
        meeting_date: booking.meeting_date,
        status: 'confirmed',
        [Op.or]: [
          {
            start_time: { [Op.lt]: booking.end_time },
            end_time: { [Op.gt]: booking.start_time },
          },
        ],
      },
    });

    if (conflictBooking) {
      return res.status(409).json({
        success: false,
        error: `Cannot approve: Room is already booked and confirmed for ${booking.meeting_date} (${conflictBooking.start_time} - ${conflictBooking.end_time}) by Booking #${conflictBooking.booking_number}. Please choose an alternate room.`,
      });
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
    if (approval.approver_type === 'department_head' && !isAdmin) {
      // After department head approval, move to HR / Admin
      newStatus = 'pending_hr';

      // Notify Admins / HR
      const adminUsers = await User.findAll({
        where: { status: 'active' },
        include: [{
          association: 'role',
          where: { name: { [Op.in]: ['Super Admin', 'Admin'] } },
        }],
      });

      for (const admin of adminUsers) {
        await createNotification(
          admin.id,
          '🔔 Manager Approved - Final Approval Required',
          `Manager approved "${booking.title}" (${booking.meeting_date}). Awaiting Admin/HR final confirmation.`,
          'approval_required',
          booking.id
        );
      }

      // Notify organizer
      await createNotification(
        booking.organizer_id,
        '📋 Manager Approved',
        `Your manager approved booking "${booking.title}". It has been routed to Admin for final confirmation.`,
        'info',
        booking.id
      );
    } else {
      // Admin approval or HR approval confirms the booking
      newStatus = 'confirmed';
    }

    // Update booking status
    await booking.update({ status: newStatus });

    // Log status change
    await logStatusChange(booking.id, previousStatus, newStatus, userId, `Approved by ${req.user.name || approval.approver_type}`);

    // If confirmed, automatically reject any competing overlapping requests for this same room and time
    if (newStatus === 'confirmed') {
      const competingRequests = await MeetingBooking.findAll({
        where: {
          id: { [Op.ne]: booking.id },
          meeting_room_id: booking.meeting_room_id,
          meeting_date: booking.meeting_date,
          status: { [Op.in]: ['pending_department_head', 'pending_hr', 'pending_manager'] },
          [Op.or]: [
            {
              start_time: { [Op.lt]: booking.end_time },
              end_time: { [Op.gt]: booking.start_time },
            },
          ],
        },
      });

      for (const compBooking of competingRequests) {
        const compPrevStat = compBooking.status;
        await compBooking.update({ status: 'rejected' });

        await ApprovalRequest.update(
          { status: 'rejected', comments: `Auto-rejected: Room confirmed for another booking (#${booking.booking_number})` },
          { where: { meeting_booking_id: compBooking.id, status: 'pending' } }
        );

        await logStatusChange(
          compBooking.id,
          compPrevStat,
          'rejected',
          userId,
          `Auto-rejected: Conflicting slot booked by #${booking.booking_number}`
        );

        await createNotification(
          compBooking.organizer_id,
          '❌ Booking Request Conflict',
          `Your booking request for "${compBooking.title}" on ${compBooking.meeting_date} (${compBooking.start_time} - ${compBooking.end_time}) was rejected because the room was confirmed for another booking (#${booking.booking_number}).`,
          'rejected',
          compBooking.id
        );

        try {
          const compOrganizer = await User.findByPk(compBooking.organizer_id);
          let compManager = null;
          if (compOrganizer?.manager_id) compManager = await User.findByPk(compOrganizer.manager_id);
          const compRoom = await MeetingRoom.findByPk(compBooking.meeting_room_id);

          await sendBookingRejectedMail({
            userEmail: compOrganizer?.email,
            userName: compOrganizer?.name || 'User',
            managerEmail: compManager?.email,
            rejecterName: 'System (Conflict Resolution)',
            roomName: compRoom?.name || 'Meeting Room',
            bookingNumber: compBooking.booking_number,
            title: compBooking.title,
            meetingDate: compBooking.meeting_date,
            startTime: compBooking.start_time,
            endTime: compBooking.end_time,
            reason: `Room already booked by another confirmed meeting (${booking.title} #${booking.booking_number}).`,
          });
        } catch (err) {
          console.warn('Failed to send conflict rejection email:', err.message);
        }
      }
    }

    // Notify organizer
    const room = await MeetingRoom.findByPk(booking.meeting_room_id);
    const displayRoomName = wasReallocated
      ? `${room?.name || 'Alternate Room'} (Reallocated from ${originalRoomName})`
      : (room?.name || 'Meeting Room');

    await createNotification(
      booking.organizer_id,
      newStatus === 'confirmed' ? '🎉 Room Booked & Confirmed!' : 'Booking Request Updated',
      newStatus === 'confirmed'
        ? `Your booking "${booking.title}" on ${booking.meeting_date} (${booking.start_time} - ${booking.end_time}) has been officially CONFIRMED in ${displayRoomName}.`
        : `Your booking "${booking.title}" has been updated to ${newStatus}.`,
      newStatus === 'confirmed' ? 'confirmed' : 'approved',
      booking.id
    );

    // If confirmed, notify all participants and dispatch email to user & manager
    if (newStatus === 'confirmed') {
      const participants = await db.BookingParticipant.findAll({
        where: { meeting_booking_id: booking.id },
        attributes: ['participant_id'],
      });

      for (const p of participants) {
        if (p.participant_id !== booking.organizer_id) {
          await createNotification(
            p.participant_id,
            '📅 Meeting Invitation Confirmed',
            `You are invited to "${booking.title}" in ${displayRoomName} on ${booking.meeting_date} (${booking.start_time} - ${booking.end_time}).`,
            'confirmation',
            booking.id
          );
        }
      }

      try {
        const organizer = await User.findByPk(booking.organizer_id);
        let managerUser = null;
        if (organizer?.manager_id) {
          managerUser = await User.findByPk(organizer.manager_id);
        }
        if (!managerUser && organizer?.department_head_id) {
          managerUser = await User.findByPk(organizer.department_head_id);
        }
        if (!managerUser && booking.department_id) {
          const dept = await Department.findByPk(booking.department_id);
          if (dept?.department_head_id) {
            managerUser = await User.findByPk(dept.department_head_id);
          }
        }

        if (managerUser && managerUser.id !== userId) {
          await createNotification(
            managerUser.id,
            '✅ Meeting Booking Approved',
            `The room booking "${booking.title}" in ${displayRoomName} for ${organizer?.name || 'your team member'} on ${booking.meeting_date} (${booking.start_time} - ${booking.end_time}) has been officially APPROVED.`,
            'confirmed',
            booking.id
          );
        }

        // Email back to User and Manager
        await sendBookingApprovedMail({
          userEmail: organizer?.email,
          userName: organizer?.name || 'User',
          managerEmail: managerUser?.email,
          managerName: managerUser?.name || 'Manager',
          approverName: req.user.name || 'Administrator',
          roomName: displayRoomName,
          bookingNumber: booking.booking_number,
          title: booking.title,
          meetingDate: booking.meeting_date,
          startTime: booking.start_time,
          endTime: booking.end_time,
        });
      } catch (mailErr) {
        console.warn('Failed to send booking approved email:', mailErr.message);
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
    const userId = req.user.id;
    const userRole = req.user?.role?.name || '';
    const isAdmin = ['Super Admin', 'Admin'].includes(userRole);
    const { comments } = req.body;

    const approval = await ApprovalRequest.findByPk(id);
    if (!approval) {
      return res.status(404).json({ success: false, error: 'Approval request not found' });
    }

    // Check if user is the approver or admin
    if (approval.approver_id !== userId && !isAdmin) {
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
    await booking.update({ status: 'rejected' });

    // Log status change
    await logStatusChange(booking.id, previousStatus, 'rejected', userId, `Rejected by ${req.user.name || approval.approver_type}: ${comments}`);

    // Notify organizer
    await createNotification(
      booking.organizer_id,
      '❌ Booking Rejected',
      `Your booking "${booking.title}" has been rejected. Reason: ${comments || 'Administrative decision'}`,
      'rejected',
      booking.id
    );

    // Send email to user and manager about rejection
    try {
      const organizer = await User.findByPk(booking.organizer_id);
      let managerUser = null;
      if (organizer?.manager_id) managerUser = await User.findByPk(organizer.manager_id);
      if (!managerUser && organizer?.department_head_id) managerUser = await User.findByPk(organizer.department_head_id);

      const room = await MeetingRoom.findByPk(booking.meeting_room_id);

      await sendBookingRejectedMail({
        userEmail: organizer?.email,
        userName: organizer?.name || 'User',
        managerEmail: managerUser?.email,
        rejecterName: req.user.name || 'Administrator',
        roomName: room?.name || 'Meeting Room',
        bookingNumber: booking.booking_number,
        title: booking.title,
        meetingDate: booking.meeting_date,
        startTime: booking.start_time,
        endTime: booking.end_time,
        reason: comments || 'Administrative decision',
      });
    } catch (mailErr) {
      console.warn('Failed to send rejection email:', mailErr.message);
    }

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
