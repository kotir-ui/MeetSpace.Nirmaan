import db from '../models/index.js';
import { Op } from 'sequelize';

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
    const { userId, userRole } = req.user;
    const { status, roomId, dateFrom, dateTo, departmentId } = req.query;

    let where = {};
    if (status) where.status = status;
    if (roomId) where.meeting_room_id = roomId;
    if (departmentId) where.department_id = departmentId;
    if (dateFrom || dateTo) {
      where.meeting_date = {};
      if (dateFrom) where.meeting_date[Op.gte] = dateFrom;
      if (dateTo) where.meeting_date[Op.lte] = dateTo;
    }

    // Role-based filtering
    if (userRole === 'viewer' || userRole === 'manager') {
      // Employees see only their own bookings
      where.organizer_id = userId;
    }
    // Admin/Super Admin see all bookings

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
    const { userId } = req.user;
    const {
      title,
      purpose,
      meetingDate,
      startTime,
      endTime,
      roomId,
      departmentId,
      meetingType,
      participantsCount,
      externalParticipantsCount,
      isExternalMeeting,
      requiredFacilities,
      additionalNotes,
      participants,
    } = req.body;

    // Validate required fields
    if (!title || !meetingDate || !startTime || !endTime || !roomId) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    // Check room exists
    const room = await MeetingRoom.findByPk(roomId);
    if (!room) {
      return res.status(404).json({ success: false, error: 'Room not found' });
    }

    if (room.room_status !== 'active') {
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
      department_id: departmentId,
      meeting_type: meetingType || 'internal_meeting',
      participants_count: participantsCount,
      external_participants_count: externalParticipantsCount || 0,
      is_external_meeting: isExternalMeeting || false,
      required_facilities: requiredFacilities,
      additional_notes: additionalNotes,
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

    // Create approval request for department head
    const departmentHead = await User.findOne({
      where: { department_id: departmentId },
      attributes: ['id'],
    });

    if (departmentHead) {
      await ApprovalRequest.create({
        meeting_booking_id: booking.id,
        approver_id: departmentHead.id,
        approver_type: 'department_head',
        status: 'pending',
      });

      // Notify department head
      await createNotification(
        departmentHead.id,
        'New Booking Request',
        `${title} requested for ${meetingDate}`,
        'booking_request',
        booking.id
      );
    }

    // Log status change
    await logStatusChange(booking.id, null, 'pending_department_head', userId, 'Initial booking creation');

    // Notify organizer
    await createNotification(
      userId,
      'Booking Request Submitted',
      `Your booking ${bookingNumber} has been submitted for approval`,
      'success',
      booking.id
    );

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
    const { userId } = req.user;
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
    const { userId } = req.user;
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
    const { userId } = req.user;
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Total rooms
    const totalRooms = await MeetingRoom.count({
      where: { room_status: 'active' },
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
        approval_status: 'pending',
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
