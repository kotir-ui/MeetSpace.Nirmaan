import { Op } from 'sequelize';
import db from '../../../models/index.js';

const { MeetingRoom, MeetingBooking } = db;

/**
 * Check if a room is available for a given time slot
 * Returns: { available: boolean, conflicts: [] }
 */
export const checkRoomAvailability = async (
  roomId,
  meetingDate,
  startTime,
  endTime,
  excludeBookingId = null
) => {
  try {
    // Get the room
    const room = await MeetingRoom.findByPk(roomId);
    if (!room) {
      return { available: false, error: 'Room not found' };
    }

    // Check room status
    if (room.status !== 'available') {
      return {
        available: false,
        error: `Room is ${room.status}`,
      };
    }

    // Build query to find conflicting bookings
    const where = {
      meeting_room_id: roomId,
      meeting_date: meetingDate,
      booking_status: { [Op.in]: ['submitted', 'confirmed'] },
    };

    if (excludeBookingId) {
      where.id = { [Op.ne]: excludeBookingId };
    }

    // Find all confirmed/submitted bookings for this room on this date
    const conflictingBookings = await MeetingBooking.findAll({ where });

    // Check for time overlaps
    const conflicts = [];
    for (const booking of conflictingBookings) {
      if (timesOverlap(startTime, endTime, booking.start_time, booking.end_time)) {
        conflicts.push({
          id: booking.id,
          title: booking.title,
          start_time: booking.start_time,
          end_time: booking.end_time,
          organizer_id: booking.organizer_id,
        });
      }
    }

    return {
      available: conflicts.length === 0,
      conflicts,
    };
  } catch (err) {
    console.error('Error checking availability:', err);
    return { available: false, error: err.message };
  }
};

/**
 * Find available rooms based on criteria
 */
export const findAvailableRooms = async (criteria) => {
  try {
    const {
      meetingDate,
      startTime,
      endTime,
      minCapacity,
      building = null,
      floor = null,
      roomType = null,
      requiredFacilities = [],
    } = criteria;

    const where = { status: 'available' };

    if (minCapacity) {
      where.capacity = { [Op.gte]: minCapacity };
    }

    if (building) {
      where.building = building;
    }

    if (floor !== null && floor !== undefined) {
      where.floor = floor;
    }

    if (roomType) {
      where.room_type = roomType;
    }

    // Get all available rooms matching criteria
    let availableRooms = await MeetingRoom.findAll({
      where,
      include: [
        {
          association: 'facilities',
          attributes: ['facility_type'],
          required: false,
        },
      ],
    });

    // Filter by required facilities
    if (requiredFacilities && requiredFacilities.length > 0) {
      availableRooms = availableRooms.filter((room) => {
        if (!room.facilities || room.facilities.length === 0) return false;
        const roomFacilities = room.facilities.map((f) => f.facility_type);
        return requiredFacilities.every((required) => roomFacilities.includes(required));
      });
    }

    // Check for time conflicts
    const result = [];
    for (const room of availableRooms) {
      const availability = await checkRoomAvailability(room.id, meetingDate, startTime, endTime);
      if (availability.available) {
        result.push({
          ...room.toJSON(),
          isAvailable: true,
        });
      }
    }

    return result;
  } catch (err) {
    console.error('Error finding available rooms:', err);
    throw err;
  }
};

/**
 * Check if two time ranges overlap
 * @param {string} start1 - Start time in HH:MM:SS format
 * @param {string} end1 - End time in HH:MM:SS format
 * @param {string} start2 - Start time in HH:MM:SS format
 * @param {string} end2 - End time in HH:MM:SS format
 * @returns {boolean}
 */
const timesOverlap = (start1, end1, start2, end2) => {
  const convertTimeToMinutes = (time) => {
    const parts = time.split(':');
    return parseInt(parts[0]) * 60 + parseInt(parts[1]);
  };

  const start1Min = convertTimeToMinutes(start1);
  const end1Min = convertTimeToMinutes(end1);
  const start2Min = convertTimeToMinutes(start2);
  const end2Min = convertTimeToMinutes(end2);

  // Overlaps if: start1 < end2 AND start2 < end1
  return start1Min < end2Min && start2Min < end1Min;
};

/**
 * Get room occupancy for a date range
 */
export const getRoomOccupancy = async (roomId, startDate, endDate) => {
  try {
    const bookings = await MeetingBooking.findAll({
      where: {
        meeting_room_id: roomId,
        meeting_date: {
          [Op.between]: [startDate, endDate],
        },
        booking_status: { [Op.in]: ['submitted', 'confirmed'] },
      },
      attributes: ['id', 'title', 'meeting_date', 'start_time', 'end_time', 'organizer_id'],
      order: [['meeting_date', 'ASC'], ['start_time', 'ASC']],
    });

    return bookings;
  } catch (err) {
    console.error('Error getting room occupancy:', err);
    throw err;
  }
};

/**
 * Check maintenance conflicts
 */
export const checkMaintenanceConflict = async (roomId, meetingDate, startTime, endTime) => {
  try {
    // TODO: Integrate with MaintenanceSchedule model if created
    // For now, return false (no maintenance conflicts)
    return false;
  } catch (err) {
    console.error('Error checking maintenance:', err);
    return false;
  }
};
