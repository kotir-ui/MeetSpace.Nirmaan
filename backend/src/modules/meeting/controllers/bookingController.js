import db from '../models/index.js';
import { Op } from 'sequelize';
import { sendBookingRequestMail } from '../../../services/emailService.js';

const { MeetingBooking, MeetingRoom, User, Department, BookingParticipant, ApprovalRequest, Notification, BookingStatusHistory } = db;

// Helper: Generate unique booking number
const generateBookingNumber = async () => {
  const count = await MeetingBooking.count();
  const date = new Date();
  const year = date.getFullYear();
  return `BK-${year}-${String(count + 1).padStart(6, '0')}`;
};

// Helper: Check if time slots conflict
const checkTimeConflict = (start1, end1, start2, end2) => {
  return start1 < end2 && end1 > start2;
};

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

// Get all bookings (with role-based filtering)
export const getBookings = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role?.name || req.user.role;
    const { status, roomId, dateFrom, dateTo, departmentId } = req.query;

    // Auto-complete expired/past bookings to free up rooms automatically
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00`;

    try {
      await MeetingBooking.update(
        { status: 'completed' },
        {
          where: {
            status: 'confirmed',
            [Op.or]: [
              { meeting_date: { [Op.lt]: todayStr } },
              {
                meeting_date: todayStr,
                end_time: { [Op.lte]: currentTimeStr },
              },
            ],
          },
        }
      );
    } catch (completeErr) {
      console.warn('Auto-complete past bookings warning:', completeErr.message);
    }

    let where = {};
    if (status) where.status = status;
    if (roomId) where.meeting_room_id = roomId;
    if (departmentId) where.department_id = departmentId;
    if (dateFrom || dateTo) {
      where.meeting_date = {};
      if (dateFrom) where.meeting_date[Op.gte] = dateFrom;
      if (dateTo) where.meeting_date[Op.lte] = dateTo;
    }

    // Filter by organizer only when explicitly requested (e.g., My Bookings tab)
    const filterMyBookingsOnly = myBookings === 'true' || my_bookings === 'true' || req.query.myBookingsOnly === 'true';
    if (filterMyBookingsOnly) {
      where.organizer_id = userId;
    }

    const bookings = await MeetingBooking.findAll({
      where,
      include: [
        { model: User, as: 'organizer', attributes: ['id', 'name', 'email'] },
        { model: MeetingRoom, as: 'room', attributes: ['id', 'name', 'capacity', 'location'] },
        { model: Department, as: 'department', attributes: ['id', 'name'] },
        {
          model: BookingParticipant,
          as: 'participants',
          include: [{ model: User, as: 'participant', attributes: ['id', 'name', 'email'] }],
        },
        {
          model: ApprovalRequest,
          as: 'approvals',
          include: [
            { model: User, as: 'approver', attributes: ['id', 'name', 'email'] },
          ],
        },
      ],
      order: [['meeting_date', 'ASC'], ['start_time', 'ASC']],
    });

    res.json({ success: true, data: bookings });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Extend meeting booking duration
export const extendBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { extensionMinutes } = req.body;
    const booking = await MeetingBooking.findByPk(id, {
      include: [
        { model: MeetingRoom, as: 'room' },
        { model: User, as: 'organizer' },
      ],
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const minutesToAdd = parseInt(extensionMinutes, 10) || 30;
    const parts = (booking.end_time || '10:00:00').split(':').map(Number);
    let totalMinutes = parts[0] * 60 + parts[1] + minutesToAdd;
    const newEndH = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
    const newEndM = String(totalMinutes % 60).padStart(2, '0');
    const newEndTime = `${newEndH}:${newEndM}:00`;

    // Check conflict for the requested extension window
    const conflict = await MeetingBooking.findOne({
      where: {
        meeting_room_id: booking.meeting_room_id,
        meeting_date: booking.meeting_date,
        id: { [Op.ne]: booking.id },
        status: { [Op.notIn]: ['cancelled', 'rejected', 'completed'] },
        start_time: { [Op.lt]: newEndTime },
        end_time: { [Op.gt]: booking.end_time },
      },
    });

    if (conflict) {
      return res.status(409).json({
        success: false,
        conflict: true,
        message: `Cannot extend room. Another reservation starts at ${conflict.start_time.slice(0, 5)}.`,
      });
    }

    const previousEndTime = booking.end_time;
    booking.end_time = newEndTime;
    booking.status = 'confirmed';
    await booking.save();

    await logStatusChange(
      booking.id,
      booking.status,
      booking.status,
      req.user.id,
      `Time extended by ${minutesToAdd} mins from ${previousEndTime} to ${newEndTime}`
    );

    await createNotification(
      booking.organizer_id,
      '⏰ Meeting Time Extended',
      `Your booking in "${booking.room?.name}" has been extended until ${newEndTime.slice(0, 5)}.`,
      'success',
      booking.id
    );

    res.json({
      success: true,
      message: `Meeting successfully extended by ${minutesToAdd} minutes until ${newEndTime.slice(0, 5)}!`,
      data: booking,
    });
  } catch (error) {
    console.error('Error extending booking:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get single booking details
export const getBookingDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await MeetingBooking.findByPk(id, {
      include: [
        { model: User, as: 'organizer', attributes: ['id', 'name', 'email'] },
        { model: MeetingRoom, as: 'room', attributes: ['id', 'name', 'capacity', 'location', 'floor'] },
        { model: Department, as: 'department', attributes: ['id', 'name'] },
        {
          model: BookingParticipant,
          as: 'participants',
          include: [{ model: User, as: 'participant', attributes: ['id', 'name', 'email'] }],
        },
        {
          model: ApprovalRequest,
          as: 'approvals',
          include: [
            { model: User, as: 'approver', attributes: ['id', 'name', 'email'] },
          ],
        },
        {
          model: BookingStatusHistory,
          as: 'statusHistory',
          include: [{ model: User, as: 'changedBy', attributes: ['id', 'name'] }],
          order: [['created_at', 'DESC']],
        },
      ],
    });

    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    res.json({ success: true, data: booking });
  } catch (error) {
    console.error('Error fetching booking details:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Check room availability
export const checkAvailability = async (req, res) => {
  try {
    const { roomId, date, startTime, endTime } = req.query;

    // Validate inputs
    if (!roomId || !date || !startTime || !endTime) {
      return res.status(400).json({ success: false, error: 'Missing required parameters' });
    }

    // Check if room exists
    const room = await MeetingRoom.findByPk(roomId);
    if (!room) {
      return res.status(404).json({ success: false, error: 'Room not found' });
    }

    // Check for conflicts (excluding rejected/cancelled bookings)
    const conflicts = await MeetingBooking.findAll({
      where: {
        meeting_room_id: roomId,
        meeting_date: date,
        status: { [Op.notIn]: ['rejected', 'cancelled'] },
        [Op.or]: [
          { start_time: { [Op.lt]: endTime }, end_time: { [Op.gt]: startTime } },
        ],
      },
    });

    const isAvailable = conflicts.length === 0;
    res.json({ success: true, available: isAvailable, conflicts: conflicts.length });
  } catch (error) {
    console.error('Error checking availability:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Create booking
export const createBooking = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      title: reqTitle,
      purpose: reqPurpose,
      meetingDate: reqDate,
      meeting_date,
      startTime: reqStart,
      start_time,
      endTime: reqEnd,
      end_time,
      roomId: reqRoom,
      room_id,
      departmentId: reqDept,
      department_id,
      meetingType,
      meeting_type,
      participantsCount,
      participants_count,
      number_of_participants,
      externalParticipantsCount,
      isExternalMeeting,
      requiredFacilities,
      additionalNotes,
      participant_names,
      participants,
    } = req.body;

    const title = reqTitle || reqPurpose || 'Meeting';
    const purpose = reqPurpose || title;
    const meetingDate = reqDate || meeting_date;
    const startTime = reqStart || start_time;
    const endTime = reqEnd || end_time;
    const roomId = reqRoom || room_id;
    const departmentId = reqDept || department_id || req.user.department_id;
    const finalMeetingType = meetingType || meeting_type || 'internal_meeting';
    const finalParticipantsCount = participantsCount || participants_count || number_of_participants || 1;
    const notes = additionalNotes || participant_names || '';

    // Validate required fields
    if (!title || !meetingDate || !startTime || !endTime || !roomId) {
      return res.status(400).json({ success: false, error: 'Missing required fields: title, meetingDate, startTime, endTime, roomId' });
    }

    // Check room exists
    const room = await MeetingRoom.findByPk(roomId);
    if (!room) {
      return res.status(404).json({ success: false, error: 'Room not found' });
    }

    if (room.status === 'inactive' || room.status === 'under_maintenance') {
      return res.status(400).json({ success: false, error: 'Room is not available' });
    }

    // Check for time conflicts
    const conflicts = await MeetingBooking.findAll({
      where: {
        meeting_room_id: roomId,
        meeting_date: meetingDate,
        status: { [Op.notIn]: ['rejected', 'cancelled'] },
        [Op.or]: [
          { start_time: { [Op.lt]: endTime }, end_time: { [Op.gt]: startTime } },
        ],
      },
    });

    if (conflicts.length > 0) {
      return res.status(409).json({ success: false, error: 'Room is already booked for this time slot' });
    }

    // Generate booking number
    const bookingNumber = await generateBookingNumber();

    // Create booking
    const booking = await MeetingBooking.create({
      booking_number: bookingNumber,
      title,
      purpose,
      meeting_date: meetingDate,
      start_time: startTime,
      end_time: endTime,
      meeting_room_id: roomId,
      organizer_id: userId,
      department_id: departmentId || null,
      meeting_type: finalMeetingType,
      participants_count: finalParticipantsCount,
      external_participants_count: externalParticipantsCount || 0,
      is_external_meeting: isExternalMeeting || false,
      required_facilities: requiredFacilities,
      additional_notes: notes,
      status: 'pending_department_head',
    });

    // Add participants
    if (participants && participants.length > 0) {
      const participantRecords = participants.map(p => ({
        meeting_booking_id: booking.id,
        participant_id: p.id,
        is_required: p.isRequired !== false,
      }));
      await BookingParticipant.bulkCreate(participantRecords);
    }

    // Fetch detailed requester info
    const requester = await User.findByPk(userId, {
      include: [
        { model: db.Role, as: 'role', attributes: ['name'] },
        { model: db.Department, as: 'departmentGroup', attributes: ['id', 'name', 'department_head_id'] },
      ],
    });

    const requesterName = requester?.name || 'Employee';
    const deptName = requester?.departmentGroup?.name || 'General';
    const roomName = room.name || 'Meeting Room';

    // 1. Resolve Manager / Department Head
    let managerUser = null;
    if (requester?.manager_id) {
      managerUser = await User.findByPk(requester.manager_id);
    }
    if (!managerUser && requester?.department_head_id) {
      managerUser = await User.findByPk(requester.department_head_id);
    }
    if (!managerUser && requester?.departmentGroup?.department_head_id) {
      managerUser = await User.findByPk(requester.departmentGroup.department_head_id);
    }
    if (!managerUser && departmentId) {
      const dept = await Department.findByPk(departmentId);
      if (dept?.department_head_id) {
        managerUser = await User.findByPk(dept.department_head_id);
      }
    }
    if (!managerUser && departmentId) {
      managerUser = await User.findOne({
        where: { department_id: departmentId, status: 'active', id: { [Op.ne]: userId } },
        include: [{
          association: 'role',
          where: { name: { [Op.in]: ['Department Manager', 'Manager', 'Admin', 'Super Admin'] } },
        }],
      });
    }

    // 2. Resolve Admins and Super Admins
    const adminUsers = await User.findAll({
      where: { status: 'active' },
      include: [{
        association: 'role',
        where: { name: { [Op.in]: ['Super Admin', 'Admin'] } },
      }],
    });

    // 3. Create Approval Request & send alert to Manager
    if (managerUser && managerUser.id !== userId) {
      await ApprovalRequest.create({
        meeting_booking_id: booking.id,
        approver_id: managerUser.id,
        approver_type: 'department_head',
        status: 'pending',
      });

      await createNotification(
        managerUser.id,
        '📋 New Booking Request - Manager Approval Required',
        `${requesterName} requested booking "${title}" for ${roomName} on ${meetingDate} (${startTime} - ${endTime}). Please review and approve.`,
        'booking_request',
        booking.id
      );
    }

    // 4. Create Approval Request & send alert to Admins
    for (const admin of adminUsers) {
      if (admin.id !== userId && (!managerUser || admin.id !== managerUser.id)) {
        try {
          await ApprovalRequest.create({
            meeting_booking_id: booking.id,
            approver_id: admin.id,
            approver_type: 'hr',
            status: 'pending',
          });
        } catch (e) {
          // ignore duplicate entry if any
        }
      }

      if (admin.id !== userId) {
        await createNotification(
          admin.id,
          `🔔 New Room Booking Request (#${bookingNumber})`,
          `New request for "${roomName}" on ${meetingDate} (${startTime} - ${endTime}) by ${requesterName} (${deptName}). Awaiting Manager & Admin review.`,
          'booking_request',
          booking.id
        );
      }
    }

    // Log status change
    await logStatusChange(booking.id, null, 'pending_department_head', userId, 'Initial booking creation');

    // 5. Notify organizer
    await createNotification(
      userId,
      '✅ Booking Request Submitted',
      `Your booking #${bookingNumber} for "${roomName}" on ${meetingDate} (${startTime} - ${endTime}) has been submitted and alerted to your Manager and Admin for approval.`,
      'success',
      booking.id
    );

    // 6. Send Email alert to Manager and Admins
    try {
      const adminEmails = adminUsers.map((a) => a.email).filter(Boolean);
      await sendBookingRequestMail({
        managerEmail: managerUser?.email,
        managerName: managerUser?.name || 'Department Manager',
        adminEmails,
        requesterName,
        requesterEmail: requester?.email,
        requesterDept: deptName,
        roomName,
        bookingNumber,
        title,
        purpose,
        meetingDate,
        startTime,
        endTime,
      });
    } catch (mailErr) {
      console.warn('Failed to send booking request email:', mailErr.message);
    }

    res.status(201).json({ success: true, data: booking, message: 'Booking created successfully' });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update booking (if still pending)
export const updateBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { title, purpose, startTime, endTime, roomId, participantsCount, additionalNotes, participants } = req.body;

    const booking = await MeetingBooking.findByPk(id);
    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    // Only organizer can update
    if (booking.organizer_id !== userId) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    // Can only update if pending
    if (!['pending_department_head', 'pending_hr'].includes(booking.status)) {
      return res.status(400).json({ success: false, error: 'Cannot update booking at this stage' });
    }

    // If room or time changed, check for conflicts
    if (roomId !== booking.meeting_room_id || startTime !== booking.start_time || endTime !== booking.end_time) {
      const newRoomId = roomId || booking.meeting_room_id;
      const newStartTime = startTime || booking.start_time;
      const newEndTime = endTime || booking.end_time;

      const conflicts = await MeetingBooking.findAll({
        where: {
          id: { [Op.ne]: id },
          meeting_room_id: newRoomId,
          meeting_date: booking.meeting_date,
          status: { [Op.notIn]: ['rejected', 'cancelled'] },
          [Op.or]: [{ start_time: { [Op.lt]: newEndTime }, end_time: { [Op.gt]: newStartTime } }],
        },
      });

      if (conflicts.length > 0) {
        return res.status(409).json({ success: false, error: 'Room is already booked for this time slot' });
      }
    }

    // Update booking
    await booking.update({
      title: title || booking.title,
      purpose: purpose || booking.purpose,
      start_time: startTime || booking.start_time,
      end_time: endTime || booking.end_time,
      meeting_room_id: roomId || booking.meeting_room_id,
      participants_count: participantsCount || booking.participants_count,
      additional_notes: additionalNotes !== undefined ? additionalNotes : booking.additional_notes,
    });

    // Update participants if provided
    if (participants) {
      await BookingParticipant.destroy({ where: { meeting_booking_id: id } });
      const participantRecords = participants.map(p => ({
        meeting_booking_id: id,
        participant_id: p.id,
        is_required: p.isRequired !== false,
      }));
      await BookingParticipant.bulkCreate(participantRecords);
    }

    // Log modification
    await logStatusChange(id, booking.status, booking.status, userId, 'Booking updated');

    await createNotification(
      userId,
      'Booking Updated',
      `Your booking has been updated`,
      'modification',
      id
    );

    res.json({ success: true, data: booking, message: 'Booking updated successfully' });
  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Cancel booking
export const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { reason } = req.body;

    const booking = await MeetingBooking.findByPk(id);
    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    // Only organizer or admin can cancel
    if (booking.organizer_id !== userId) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    const previousStatus = booking.status;
    await booking.update({
      status: 'cancelled',
      cancellation_reason: reason,
      cancelled_by_id: userId,
      cancelled_at: new Date(),
    });

    // Log status change
    await logStatusChange(id, previousStatus, 'cancelled', userId, reason || 'Booking cancelled');

    // Notify participants
    const participants = await BookingParticipant.findAll({
      where: { meeting_booking_id: id },
      attributes: ['participant_id'],
    });

    for (const p of participants) {
      await createNotification(
        p.participant_id,
        'Booking Cancelled',
        `${booking.title} scheduled for ${booking.meeting_date} has been cancelled`,
        'cancellation',
        id
      );
    }

    res.json({ success: true, message: 'Booking cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get dashboard summary
export const getDashboardSummary = async (req, res) => {
  try {
    const userId = req.user?.id;
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Total rooms
    const totalRooms = await MeetingRoom.count({
      where: { status: { [Op.ne]: 'inactive' } },
    });

    // Available rooms now (no bookings at current time)
    const currentTime = today.toTimeString().slice(0, 8); // HH:MM:SS
    const bookedNow = await MeetingBooking.count({
      where: {
        meeting_date: todayStr,
        start_time: { [Op.lte]: currentTime },
        end_time: { [Op.gt]: currentTime },
        status: { [Op.in]: ['confirmed', 'pending_department_head', 'pending_hr'] },
      },
    });
    const availableNow = totalRooms - bookedNow;

    // Pending approvals
    const pendingApprovals = await ApprovalRequest.count({
      where: {
        status: 'pending',
      },
    });

    // My bookings (current user)
    const myBookings = await MeetingBooking.count({
      where: {
        organizer_id: userId,
        status: { [Op.in]: ['confirmed', 'pending_department_head', 'pending_hr'] },
      },
    });

    res.json({
      success: true,
      data: {
        totalRooms,
        availableNow: Math.max(0, availableNow),
        pendingApprovals,
        myBookings,
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export default { getBookings, getBookingDetails, checkAvailability, createBooking, updateBooking, cancelBooking, getDashboardSummary };
