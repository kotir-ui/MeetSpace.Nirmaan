import db from '../../../models/index.js';
import ActivityLog from '../../../models/ActivityLog.js';
import {
  checkRoomAvailability,
  findAvailableRooms,
  getRoomOccupancy,
} from '../services/availabilityService.js';
import {
  createNotification,
  notifyBookingRequest,
  notifyBookingApproval,
  notifyBookingParticipants,
} from '../services/notificationService.js';

const { MeetingBooking, MeetingRoom, User, BookingParticipant, ApprovalRequest, BookingStatusHistory } = db;

/**
 * Get all bookings with optional filtering
 */
export const getAllBookings = async (req, res) => {
  try {
    const { status, bookingStatus, approvalStatus, organizer_id, meeting_date, search } = req.query;

    const where = {};
    if (status) where.status = status;
    if (bookingStatus) where.booking_status = bookingStatus;
    if (approvalStatus) where.approval_status = approvalStatus;
    if (organizer_id) where.organizer_id = organizer_id;
    if (meeting_date) where.meeting_date = meeting_date;

    if (search) {
      const { Op } = await import('sequelize');
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { booking_number: { [Op.like]: `%${search}%` } },
      ];
    }

    const bookings = await MeetingBooking.findAll({
      where,
      include: [
        { model: MeetingRoom, as: 'room', attributes: ['id', 'name', 'room_number', 'capacity'] },
        { model: User, as: 'organizer', attributes: ['id', 'name', 'email'] },
        { association: 'participants', attributes: ['id', 'participant_id', 'attendance_status'] },
      ],
      order: [['meeting_date', 'DESC'], ['start_time', 'DESC']],
    });

    res.status(200).json({
      success: true,
      message: 'Bookings retrieved successfully',
      data: bookings,
      count: bookings.length,
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving bookings',
      error: error.message,
    });
  }
};

/**
 * Get single booking by ID
 */
export const getBookingById = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await MeetingBooking.findByPk(id, {
      include: [
        { model: MeetingRoom, as: 'room' },
        { model: User, as: 'organizer', attributes: { exclude: ['password'] } },
        { association: 'participants' },
        { association: 'approvals' },
        { association: 'statusHistory' },
      ],
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Booking retrieved successfully',
      data: booking,
    });
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving booking',
      error: error.message,
    });
  }
};

/**
 * Create new booking
 * CRITICAL: Prevent overlapping bookings with transaction
 */
export const createBooking = async (req, res) => {
  const transaction = await db.sequelize.transaction();

  try {
    const {
      title,
      purpose,
      meeting_date,
      start_time,
      end_time,
      meeting_room_id,
      building,
      floor,
      meeting_type,
      participants_count,
      external_participants_count,
      is_external_meeting,
      required_facilities,
      additional_notes,
      participants = [],
    } = req.body;

    // Validation
    if (!title || !meeting_date || !start_time || !end_time || !meeting_room_id || !participants_count) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }

    // Verify room exists
    const room = await MeetingRoom.findByPk(meeting_room_id, { transaction });
    if (!room) {
      return res.status(400).json({
        success: false,
        message: 'Room not found',
      });
    }

    // Check room is available
    if (room.status !== 'available') {
      return res.status(409).json({
        success: false,
        message: `Room is ${room.status} and cannot be booked`,
      });
    }

    // Check room capacity
    if (room.capacity < participants_count) {
      return res.status(409).json({
        success: false,
        message: `Room capacity (${room.capacity}) is less than required participants (${participants_count})`,
      });
    }

    // **CRITICAL: Check for overlapping bookings with transaction lock**
    const availability = await checkRoomAvailability(
      meeting_room_id,
      meeting_date,
      start_time,
      end_time
    );

    if (!availability.available) {
      return res.status(409).json({
        success: false,
        message: 'Room is not available for the requested time slot',
        conflicts: availability.conflicts,
      });
    }

    // Generate booking number
    const bookingCount = await MeetingBooking.count({ transaction });
    const bookingNumber = `BK-${new Date(meeting_date).getFullYear()}-${String(bookingCount + 1).padStart(4, '0')}`;

    // Create booking
    const newBooking = await MeetingBooking.create(
      {
        booking_number: bookingNumber,
        title,
        purpose: purpose || null,
        meeting_date,
        start_time,
        end_time,
        meeting_room_id,
        building: building || room.building,
        floor: floor !== undefined ? floor : room.floor,
        organizer_id: req.user.id,
        department_id: req.user.department_id,
        meeting_type: meeting_type || 'internal_meeting',
        participants_count,
        external_participants_count: external_participants_count || 0,
        is_external_meeting: is_external_meeting || false,
        required_facilities: required_facilities || null,
        additional_notes: additional_notes || null,
        booking_status: 'draft',
        approval_status: 'not_required',
        status: 'pending_department_head', // Legacy field
      },
      { transaction }
    );

    // Add participants if provided
    if (participants && Array.isArray(participants)) {
      for (const participantId of participants) {
        if (participantId !== req.user.id) {
          await BookingParticipant.create(
            {
              meeting_booking_id: newBooking.id,
              participant_id: participantId,
              is_required: true,
              attendance_status: 'invited',
            },
            { transaction }
          );
        }
      }
    }

    // Create initial status history
    await BookingStatusHistory.create(
      {
        meeting_booking_id: newBooking.id,
        previous_status: null,
        new_status: 'draft',
        changed_by_id: req.user.id,
        reason: 'Booking created',
      },
      { transaction }
    );

    // Commit transaction
    await transaction.commit();

    // Log activity
    await ActivityLog.create({
      user_id: req.user.id,
      action: 'BOOKING_CREATE',
      entity_type: 'Booking',
      entity_id: newBooking.id,
      description: `Created booking: ${newBooking.title} on ${meeting_date}`,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
    });

    // Send notifications
    await notifyBookingParticipants(newBooking.id, 'created');

    const bookingResponse = await MeetingBooking.findByPk(newBooking.id, {
      include: [
        { model: MeetingRoom, as: 'room' },
        { association: 'participants' },
      ],
    });

    res.status(201).json({
      success: true,
      message: 'Booking created successfully (Draft)',
      data: bookingResponse,
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error creating booking:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating booking',
      error: error.message,
    });
  }
};

/**
 * Submit booking for approval
 */
export const submitBooking = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await MeetingBooking.findByPk(id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.booking_status !== 'draft') {
      return res.status(409).json({
        success: false,
        message: 'Only draft bookings can be submitted',
      });
    }

    // Recheck availability before submission
    const availability = await checkRoomAvailability(
      booking.meeting_room_id,
      booking.meeting_date,
      booking.start_time,
      booking.end_time,
      booking.id
    );

    if (!availability.available) {
      return res.status(409).json({
        success: false,
        message: 'Room is no longer available for this time slot',
        conflicts: availability.conflicts,
      });
    }

    // Update booking status
    await booking.update({
      booking_status: 'submitted',
      approval_status: 'pending',
    });

    // Log status change
    await BookingStatusHistory.create({
      meeting_booking_id: booking.id,
      previous_status: 'draft',
      new_status: 'submitted',
      changed_by_id: req.user.id,
      reason: 'Booking submitted for approval',
    });

    // Send notifications
    await notifyBookingRequest(booking.id);

    res.status(200).json({
      success: true,
      message: 'Booking submitted for approval',
      data: booking,
    });
  } catch (error) {
    console.error('Error submitting booking:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting booking',
      error: error.message,
    });
  }
};

/**
 * Update booking (only drafts)
 */
export const updateBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      purpose,
      meeting_date,
      start_time,
      end_time,
      meeting_type,
      participants_count,
      required_facilities,
      additional_notes,
    } = req.body;

    const booking = await MeetingBooking.findByPk(id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.booking_status !== 'draft') {
      return res.status(409).json({
        success: false,
        message: 'Only draft bookings can be updated',
      });
    }

    // If time/room changed, recheck availability
    if (meeting_date || start_time || end_time) {
      const newDate = meeting_date || booking.meeting_date;
      const newStart = start_time || booking.start_time;
      const newEnd = end_time || booking.end_time;
      const roomId = booking.meeting_room_id;

      const availability = await checkRoomAvailability(roomId, newDate, newStart, newEnd, booking.id);
      if (!availability.available) {
        return res.status(409).json({
          success: false,
          message: 'Updated time slot has conflicts',
          conflicts: availability.conflicts,
        });
      }
    }

    // Update booking
    await booking.update({
      title: title || booking.title,
      purpose: purpose !== undefined ? purpose : booking.purpose,
      meeting_date: meeting_date || booking.meeting_date,
      start_time: start_time || booking.start_time,
      end_time: end_time || booking.end_time,
      meeting_type: meeting_type || booking.meeting_type,
      participants_count: participants_count || booking.participants_count,
      required_facilities: required_facilities !== undefined ? required_facilities : booking.required_facilities,
      additional_notes: additional_notes !== undefined ? additional_notes : booking.additional_notes,
    });

    res.status(200).json({
      success: true,
      message: 'Booking updated successfully',
      data: booking,
    });
  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating booking',
      error: error.message,
    });
  }
};

/**
 * Cancel booking
 */
export const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { cancellation_reason } = req.body;

    const booking = await MeetingBooking.findByPk(id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (['cancelled', 'completed'].includes(booking.booking_status)) {
      return res.status(409).json({
        success: false,
        message: `Cannot cancel a ${booking.booking_status} booking`,
      });
    }

    // Update booking
    await booking.update({
      booking_status: 'cancelled',
      cancellation_reason: cancellation_reason || null,
      cancelled_by_id: req.user.id,
      cancelled_at: new Date(),
    });

    // Log status change
    await BookingStatusHistory.create({
      meeting_booking_id: booking.id,
      previous_status: booking.booking_status,
      new_status: 'cancelled',
      changed_by_id: req.user.id,
      reason: cancellation_reason || 'Booking cancelled',
    });

    // Notify participants
    await notifyBookingParticipants(booking.id, 'cancelled');

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      data: booking,
    });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling booking',
      error: error.message,
    });
  }
};

/**
 * Get room occupancy for a date range
 */
export const getRoomOccupancyReport = async (req, res) => {
  try {
    const { roomId, startDate, endDate } = req.query;

    if (!roomId || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Missing required query parameters: roomId, startDate, endDate',
      });
    }

    const occupancy = await getRoomOccupancy(roomId, startDate, endDate);

    res.status(200).json({
      success: true,
      message: 'Occupancy report retrieved',
      data: {
        roomId,
        startDate,
        endDate,
        bookingCount: occupancy.length,
        bookings: occupancy,
      },
    });
  } catch (error) {
    console.error('Error getting occupancy:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving occupancy',
      error: error.message,
    });
  }
};
