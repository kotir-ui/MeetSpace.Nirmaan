import db from '../models/index.js';
import { Op } from 'sequelize';

const { MeetingRoom, RoomFacility, MeetingBooking } = db;

export const getPublicRoomCount = async (req, res) => {
  try {
    const count = await MeetingRoom.count();
    return res.json({ count });
  } catch (error) {
    return res.status(500).json({ count: 0 });
  }
};

export const getPublicRooms = async (req, res) => {
  try {
    const rooms = await MeetingRoom.findAll({
      include: [{ model: RoomFacility, as: 'facilities', attributes: ['facility_type'] }],
      attributes: ['id', 'name', 'room_number', 'capacity', 'floor'],
      order: [['floor', 'ASC'], ['room_number', 'ASC']],
    });
    return res.json({ data: rooms });
  } catch (error) {
    return res.status(500).json({ data: [], message: error.message });
  }
};

// Get all meeting rooms
export const getAllRooms = async (req, res) => {
  try {
    const { status, capacity } = req.query;

    let where = {};
    if (status) where.status = status;
    if (capacity) where.capacity = { [Op.gte]: capacity };

    let rooms = await MeetingRoom.findAll({
      where,
      include: [{ model: RoomFacility, as: 'facilities', attributes: ['id', 'facility_type'] }],
      order: [['floor', 'ASC'], ['room_number', 'ASC']],
    });

    if (rooms.length === 0 && !status && !capacity) {
      const defaultRooms = [
        {
          name: 'Sarvepalli Radhakrishnan Hall',
          room_number: 'CR-101',
          building: 'Main Block',
          floor: 1,
          location: '1st Floor - East Wing',
          room_type: 'conference_room',
          capacity: 18,
          status: 'available',
          description: 'Executive conference hall with video conferencing and smart board.',
        },
        {
          name: 'APJ Abdul Kalam Board Room',
          room_number: 'BR-201',
          building: 'Main Block',
          floor: 2,
          location: '2nd Floor - Executive Suite',
          room_type: 'board_room',
          capacity: 24,
          status: 'available',
          description: 'Board room for leadership sessions and strategic reviews.',
        },
        {
          name: 'Swami Vivekananda Meeting Room',
          room_number: 'MR-102',
          building: 'Main Block',
          floor: 1,
          location: '1st Floor - West Wing',
          room_type: 'meeting_room',
          capacity: 10,
          status: 'available',
          description: 'Medium team collaboration and meeting room.',
        },
        {
          name: 'Aryabhata Discussion Suite',
          room_number: 'DR-301',
          building: 'Innovation Block',
          floor: 3,
          location: '3rd Floor - Tech Wing',
          room_type: 'discussion_room',
          capacity: 8,
          status: 'available',
          description: 'Rapid discussion and agile breakout room.',
        },
        {
          name: 'Sir CV Raman Innovation Lab',
          room_number: 'TR-302',
          building: 'Innovation Block',
          floor: 3,
          location: '3rd Floor - South Wing',
          room_type: 'training_room',
          capacity: 30,
          status: 'available',
          description: 'Spacious training and interactive presentation hall.',
        },
        {
          name: 'Chanakya Strategy Room',
          room_number: 'MR-202',
          building: 'Main Block',
          floor: 2,
          location: '2nd Floor - North Wing',
          room_type: 'meeting_room',
          capacity: 12,
          status: 'available',
          description: 'Client meetings and department strategy room.',
        },
      ];

      try {
        await MeetingRoom.bulkCreate(defaultRooms, { ignoreDuplicates: true });
        rooms = await MeetingRoom.findAll({
          include: [{ model: RoomFacility, as: 'facilities', attributes: ['id', 'facility_type'] }],
          order: [['floor', 'ASC'], ['room_number', 'ASC']],
        });
      } catch (seedErr) {
        console.warn('Could not auto-seed rooms:', seedErr.message);
      }
    }

    res.json({ success: true, data: rooms });
  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get available alternate rooms for date and time slot
export const getAvailableAlternates = async (req, res) => {
  try {
    const { date, startTime, endTime, excludeRoomId, minCapacity } = req.query;

    if (!date || !startTime || !endTime) {
      return res.status(400).json({ success: false, error: 'Missing date, startTime, or endTime' });
    }

    const where = {
      status: { [Op.in]: ['active', 'available'] },
    };
    if (excludeRoomId) {
      where.id = { [Op.ne]: excludeRoomId };
    }
    if (minCapacity) {
      where.capacity = { [Op.gte]: parseInt(minCapacity, 10) };
    }

    const allRooms = await MeetingRoom.findAll({
      where,
      include: [{ model: RoomFacility, as: 'facilities', attributes: ['id', 'facility_type'] }],
      order: [['capacity', 'ASC']],
    });

    const busyBookings = await MeetingBooking.findAll({
      where: {
        meeting_date: date,
        status: 'confirmed',
        [Op.or]: [
          {
            start_time: { [Op.lt]: endTime },
            end_time: { [Op.gt]: startTime },
          },
        ],
      },
      attributes: ['meeting_room_id'],
    });

    const busyRoomIds = new Set(busyBookings.map((b) => b.meeting_room_id));
    const availableRooms = allRooms.filter((r) => !busyRoomIds.has(r.id));

    res.json({ success: true, data: availableRooms });
  } catch (error) {
    console.error('Error fetching available alternate rooms:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get room details
export const getRoomDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const room = await MeetingRoom.findByPk(id, {
      include: [{ model: RoomFacility, as: 'facilities', attributes: ['id', 'facility_type'] }],
    });

    if (!room) {
      return res.status(404).json({ success: false, error: 'Room not found' });
    }

    res.json({ success: true, data: room });
  } catch (error) {
    console.error('Error fetching room details:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Create meeting room
export const createRoom = async (req, res) => {
  try {
    const { name, roomNumber, location, capacity, floor, description, facilities } = req.body;

    // Validate required fields
    if (!name || !roomNumber || !location || !capacity || floor === undefined) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    // Check if room number already exists
    const existingRoom = await MeetingRoom.findOne({ where: { room_number: roomNumber } });
    if (existingRoom) {
      return res.status(409).json({ success: false, error: 'Room number already exists' });
    }

    // Create room
    const room = await MeetingRoom.create({
      name,
      room_number: roomNumber,
      location,
      capacity,
      floor,
      description,
      room_status: 'active',
    });

    // Add facilities if provided
    if (facilities && facilities.length > 0) {
      const facilityRecords = facilities.map(f => ({
        meeting_room_id: room.id,
        facility_type: f,
      }));
      await RoomFacility.bulkCreate(facilityRecords);

      // Reload with facilities
      await room.reload({ include: [{ model: RoomFacility, as: 'facilities' }] });
    }

    res.status(201).json({ success: true, data: room, message: 'Room created successfully' });
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update meeting room
export const updateRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, location, capacity, floor, description, roomStatus, facilities } = req.body;

    const room = await MeetingRoom.findByPk(id);
    if (!room) {
      return res.status(404).json({ success: false, error: 'Room not found' });
    }

    // Update room details
    await room.update({
      name: name || room.name,
      location: location || room.location,
      capacity: capacity || room.capacity,
      floor: floor !== undefined ? floor : room.floor,
      description: description !== undefined ? description : room.description,
      room_status: roomStatus || room.room_status,
    });

    // Update facilities if provided
    if (facilities) {
      await RoomFacility.destroy({ where: { meeting_room_id: id } });
      if (facilities.length > 0) {
        const facilityRecords = facilities.map(f => ({
          meeting_room_id: id,
          facility_type: f,
        }));
        await RoomFacility.bulkCreate(facilityRecords);
      }
    }

    // Reload with facilities
    await room.reload({ include: [{ model: RoomFacility, as: 'facilities' }] });

    res.json({ success: true, data: room, message: 'Room updated successfully' });
  } catch (error) {
    console.error('Error updating room:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Delete meeting room
export const deleteRoom = async (req, res) => {
  try {
    const { id } = req.params;

    const room = await MeetingRoom.findByPk(id);
    if (!room) {
      return res.status(404).json({ success: false, error: 'Room not found' });
    }

    // Check if room has active bookings
    const activeBookings = await MeetingBooking.count({
      where: {
        meeting_room_id: id,
        status: { [Op.notIn]: ['cancelled', 'rejected'] },
      },
    });

    if (activeBookings > 0) {
      return res.status(400).json({ success: false, error: 'Cannot delete room with active bookings' });
    }

    await room.destroy();
    res.json({ success: true, message: 'Room deleted successfully' });
  } catch (error) {
    console.error('Error deleting room:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get room schedule for a date range
export const getRoomSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const { dateFrom, dateTo } = req.query;

    const room = await MeetingRoom.findByPk(id, {
      include: [{ model: RoomFacility, as: 'facilities' }],
    });

    if (!room) {
      return res.status(404).json({ success: false, error: 'Room not found' });
    }

    // Get bookings for this room in the date range
    const bookings = await MeetingBooking.findAll({
      where: {
        meeting_room_id: id,
        meeting_date: { [Op.between]: [dateFrom, dateTo] },
        status: { [Op.notIn]: ['cancelled', 'rejected'] },
      },
      order: [['meeting_date', 'ASC'], ['start_time', 'ASC']],
    });

    res.json({ success: true, data: { room, bookings } });
  } catch (error) {
    console.error('Error fetching room schedule:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get room statistics
export const getRoomStats = async (req, res) => {
  try {
    const totalRooms = await MeetingRoom.count();
    const activeRooms = await MeetingRoom.count({ where: { status: 'available' } });
    const maintenanceRooms = await MeetingRoom.count({ where: { status: 'under_maintenance' } });
    const disabledRooms = await MeetingRoom.count({ where: { status: 'inactive' } });

    const totalCapacity = await MeetingRoom.sum('capacity');
    const averageCapacity = Math.ceil(totalCapacity / totalRooms) || 0;

    res.json({
      success: true,
      data: {
        totalRooms,
        activeRooms,
        maintenanceRooms,
        disabledRooms,
        totalCapacity: totalCapacity || 0,
        averageCapacity,
      },
    });
  } catch (error) {
    console.error('Error fetching room stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export default {
  getAllRooms,
  getRoomDetails,
  createRoom,
  updateRoom,
  deleteRoom,
  getRoomSchedule,
  getRoomStats,
};
