import db from '../../../models/index.js';
import ActivityLog from '../../../models/ActivityLog.js';

const { User, Notification, MeetingBooking, ApprovalRequest } = db;

/**
 * Create and send notification to user
 */
export const createNotification = async (userId, data) => {
  try {
    const {
      title,
      message,
      type = 'info', // info, warning, success, error, booking, approval
      relatedBookingId = null,
      relatedApprovalId = null,
      actionUrl = null,
    } = data;

    const notification = await Notification.create({
      user_id: userId,
      title,
      message,
      type,
      related_booking_id: relatedBookingId,
      action_url: actionUrl,
      is_read: false,
    });

    return notification;
  } catch (err) {
    console.error('Error creating notification:', err);
    throw err;
  }
};

/**
 * Send booking request notification to department head
 */
export const notifyBookingRequest = async (bookingId) => {
  try {
    const booking = await MeetingBooking.findByPk(bookingId, {
      include: [
        { model: User, as: 'organizer', attributes: ['id', 'name', 'email'] },
      ],
    });

    if (!booking || !booking.organizer) return;

    // Get organizer's department head
    const organizer = booking.organizer;
    if (organizer.departmentHead_id) {
      await createNotification(organizer.departmentHead_id, {
        title: 'Booking Approval Request',
        message: `${organizer.name} has requested approval for a meeting room booking on ${booking.meeting_date}`,
        type: 'approval',
        relatedBookingId: booking.id,
        actionUrl: `/bookings/${booking.id}/approve`,
      });
    }

    return true;
  } catch (err) {
    console.error('Error notifying booking request:', err);
  }
};

/**
 * Notify booking approval
 */
export const notifyBookingApproval = async (bookingId, approvalStatus, comments = null) => {
  try {
    const booking = await MeetingBooking.findByPk(bookingId, {
      include: [
        { model: User, as: 'organizer', attributes: ['id', 'name', 'email'] },
      ],
    });

    if (!booking || !booking.organizer) return;

    const status = approvalStatus === 'approved' ? 'Approved' : 'Rejected';
    const messageType = approvalStatus === 'approved' ? 'success' : 'error';

    await createNotification(booking.organizer_id, {
      title: `Booking ${status}`,
      message: `Your booking for ${booking.title} on ${booking.meeting_date} has been ${approvalStatus}${comments ? '. ' + comments : ''}`,
      type: messageType,
      relatedBookingId: booking.id,
    });

    // Email notification would go here
    // await sendEmail(...);

    return true;
  } catch (err) {
    console.error('Error notifying booking approval:', err);
  }
};

/**
 * Notify booking participants
 */
export const notifyBookingParticipants = async (bookingId, notificationType = 'created') => {
  try {
    const booking = await MeetingBooking.findByPk(bookingId, {
      include: [
        {
          association: 'participants',
          attributes: ['id', 'participant_id'],
          through: { attributes: [] },
        },
      ],
    });

    if (!booking || !booking.participants) return;

    let title = 'Meeting Booking';
    let message = `You have been invited to a meeting: ${booking.title}`;

    if (notificationType === 'confirmed') {
      message = `Your meeting booking has been confirmed: ${booking.title} on ${booking.meeting_date}`;
    } else if (notificationType === 'cancelled') {
      message = `Meeting booking has been cancelled: ${booking.title}`;
    }

    // Notify each participant
    for (const participant of booking.participants) {
      await createNotification(participant.participant_id, {
        title,
        message,
        type: notificationType === 'confirmed' ? 'success' : 'info',
        relatedBookingId: booking.id,
      });
    }

    return true;
  } catch (err) {
    console.error('Error notifying participants:', err);
  }
};

/**
 * Mark notification as read
 */
export const markNotificationAsRead = async (notificationId) => {
  try {
    const notification = await Notification.findByPk(notificationId);
    if (notification) {
      await notification.update({ is_read: true });
    }
    return notification;
  } catch (err) {
    console.error('Error marking notification as read:', err);
    throw err;
  }
};

/**
 * Get unread notifications count for user
 */
export const getUnreadCount = async (userId) => {
  try {
    const count = await Notification.count({
      where: {
        user_id: userId,
        is_read: false,
      },
    });
    return count;
  } catch (err) {
    console.error('Error getting unread count:', err);
    return 0;
  }
};

/**
 * Get user notifications with pagination
 */
export const getUserNotifications = async (userId, limit = 20, offset = 0) => {
  try {
    const notifications = await Notification.findAll({
      where: { user_id: userId },
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });

    const total = await Notification.count({ where: { user_id: userId } });

    return {
      notifications,
      total,
      limit,
      offset,
    };
  } catch (err) {
    console.error('Error getting notifications:', err);
    throw err;
  }
};

/**
 * Send email notification (placeholder for actual email service)
 */
export const sendEmailNotification = async (to, subject, template, data) => {
  try {
    // TODO: Integrate with actual email service (SendGrid, Nodemailer, etc.)
    console.log(`📧 Email to: ${to}, Subject: ${subject}`);
    console.log(`Template: ${template}`, data);
    return true;
  } catch (err) {
    console.error('Error sending email:', err);
    return false;
  }
};

/**
 * Email templates
 */
export const emailTemplates = {
  bookingRequest: (organizer, booking, departmentHead) => ({
    subject: `Booking Approval Required: ${booking.title}`,
    template: 'booking-request',
    data: { organizer, booking, departmentHead },
  }),

  bookingApproved: (organizer, booking) => ({
    subject: `Booking Confirmed: ${booking.title}`,
    template: 'booking-approved',
    data: { organizer, booking },
  }),

  bookingRejected: (organizer, booking, reason) => ({
    subject: `Booking Rejected: ${booking.title}`,
    template: 'booking-rejected',
    data: { organizer, booking, reason },
  }),

  bookingCancelled: (organizer, booking, reason) => ({
    subject: `Booking Cancelled: ${booking.title}`,
    template: 'booking-cancelled',
    data: { organizer, booking, reason },
  }),

  participantInvitation: (participant, booking) => ({
    subject: `Meeting Invitation: ${booking.title}`,
    template: 'participant-invitation',
    data: { participant, booking },
  }),
};
