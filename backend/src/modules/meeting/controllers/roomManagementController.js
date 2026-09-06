import db from '../../../models/index.js';
import { requirePermission } from '../../../middleware/authorization.js';
import ActivityLog from '../../../models/ActivityLog.js';
import { checkRoomAvailability, findAvailableRooms } from '../services/availabilityService.js';

const { MeetingRoom, RoomFacility, User, Department } = db;

/**
 * Get all meeting rooms with optional filtering
 */
export const getAllRooms = async (req, res) => {
  try {
    const { status, building, roomType, capacity, search } = req.query;

    const where = {};
    if (status) where.status = status;
    if (building) where.building = building;
    if (roomType) where.room_type = roomType;
    if (capacity) where.capacity = { $gte: parseInt(capacity) };

    if (search) {
      const { Op } = await import('sequelize');
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { room_number: { [Op.like]: `%${search}%` } },
        { location: { [Op.like]: `%${search}%` } },
      ];
    }

    const rooms = await MeetingRoom.findAll({
      where,
      include: [
        {
          association: 'facilities',
          attributes: ['facility_type'],
          required: false,
        },
        {
          model: User,
          as: 'roomManager',
          attributes: ['id', 'name', 'email'],
          foreignKey: 'room_manager_id',
        },
        {
          model: Department,
          as: 'owningDepartment',
          attributes: ['id', 'name', 'code'],
          foreignKey: 'owning_department_id',
        },
      ],
      order: [['building', 'ASC'], ['floor', 'ASC'], ['name', 'ASC']],
    });

    res.status(200).json({
      success: true,
      message: 'Rooms retrieved successfully',
      data: rooms,
      count: rooms.length,
    });
  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving rooms',
      error: error.message,
    });
  }
};

/**
 * Get single room by ID
 */
export const getRoomById = async (req, res) => {
  try {
    const { id } = req.params;

    const room = await MeetingRoom.findByPk(id, {
      include: [
        {
          association: 'facilities',
          attributes: ['id', 'facility_type'],
        },
        {
          model: User,
          as: 'roomManager',
          attributes: ['id', 'name', 'email', 'designation'],
          foreignKey: 'room_manager_id',
        },
        {
          model: Department,
          as: 'owningDepartment',
          attributes: ['id', 'name', 'code'],
          foreignKey: 'owning_department_id',
        },
      ],
    });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Room retrieved successfully',
      data: room,
    });
  } catch (error) {
    console.error('Error fetching room:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving room',
      error: error.message,
    });
  }
};

/**
 * Create new room
 */
export const createRoom = async (req, res) => {
  try {
    const {
      name,
      room_number,
      building,
      floor,
      room_type,
      capacity,
      location,
      room_manager_id,
      owning_department_id,
      image_url,
      booking_availability,
      description,
      facilities = [],
    } = req.body;

    // Validation
    if (!name || !room_number || !building || !floor === undefined || !capacity) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, room_number, building, floor, capacity',
      });
    }

    // Check if room_number already exists
    const existingRoom = await MeetingRoom.findOne({ where: { room_number } });
    if (existingRoom) {
      return res.status(409).json({
        success: false,
        message: 'Room number already exists',
      });
    }

    // Verify room manager if provided
    if (room_manager_id) {
      const manager = await User.findByPk(room_manager_id);
      if (!manager) {
        return res.status(400).json({
          success: false,
          message: 'Invalid room_manager_id',
        });
      }
    }

    // Verify owning department if provided
    if (owning_department_id) {
      const dept = await Department.findByPk(owning_department_id);
      if (!dept) {
        return res.status(400).json({
          success: false,
          message: 'Invalid owning_department_id',
        });
      }
    }

    // Create room
    const newRoom = await MeetingRoom.create({
      name,
      room_number,
      building,
      floor,
      room_type: room_type || 'meeting_room',
      capacity,
      location: location || `${building} Floor ${floor}`,
      room_manager_id: room_manager_id || null,
      owning_department_id: owning_department_id || null,
      image_url: image_url || null,
      booking_availability: booking_availability || null,
      description: description || null,
      status: 'available',
    });

    // Add facilities
    if (facilities && Array.isArray(facilities)) {
      for (const facility of facilities) {
        await RoomFacility.create({
          meeting_room_id: newRoom.id,
          facility_type: facility,
        });
      }
    }

    // Log activity
    await ActivityLog.create({
      user_id: req.user?.id,
      action: 'ROOM_CREATE',
      entity_type: 'Room',
      entity_id: newRoom.id,
      description: `Created room: ${newRoom.name} (${newRoom.room_number})`,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
    });

    const roomResponse = await MeetingRoom.findByPk(newRoom.id, {
      include: [
        { association: 'facilities' },
        { model: User, as: 'roomManager', attributes: ['id', 'name', 'email'], foreignKey: 'room_manager_id' },
        { model: Department, as: 'owningDepartment', attributes: ['id', 'name'], foreignKey: 'owning_department_id' },
      ],
    });

    res.status(201).json({
      success: true,
      message: 'Room created successfully',
      data: roomResponse,
    });
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating room',
      error: error.message,
    });
  }
};

/**
 * Update room
 */
export const updateRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      building,
      floor,
      room_type,
      capacity,
      location,
      room_manager_id,
      owning_department_id,
      image_url,
      booking_availability,
      description,
      facilities = [],
    } = req.body;

    const room = await MeetingRoom.findByPk(id);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found',
      });
    }

    // Verify references if provided
    if (room_manager_id && room_manager_id !== room.room_manager_id) {
      const manager = await User.findByPk(room_manager_id);
      if (!manager) {
        return res.status(400).json({
          success: false,
          message: 'Invalid room_manager_id',
        });
      }
    }

    if (owning_department_id && owning_department_id !== room.owning_department_id) {
      const dept = await Department.findByPk(owning_department_id);
      if (!dept) {
        return res.status(400).json({
          success: false,
          message: 'Invalid owning_department_id',
        });
      }
    }

    // Update room
    await room.update({
      name: name || room.name,
      building: building || room.building,
      floor: floor !== undefined ? floor : room.floor,
      room_type: room_type || room.room_type,
      capacity: capacity || room.capacity,
      location: location || room.location,
      room_manager_id: room_manager_id !== undefined ? room_manager_id : room.room_manager_id,
      owning_department_id: owning_department_id !== undefined ? owning_department_id : room.owning_department_id,
      image_url: image_url !== undefined ? image_url : room.image_url,
      booking_availability: booking_availability !== undefined ? booking_availability : room.booking_availability,
      description: description !== undefined ? description : room.description,
    });

    // Update facilities if provided
    if (facilities.length > 0) {
      await RoomFacility.destroy({ where: { meeting_room_id: id } });
      for (const facility of facilities) {
        await RoomFacility.create({
          meeting_room_id: id,
          facility_type: facility,
        });
      }
    }

    // Log activity
    await ActivityLog.create({
      user_id: req.user?.id,
      action: 'ROOM_UPDATE',
      entity_type: 'Room',
      entity_id: room.id,
      description: `Updated room: ${room.name}`,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
    });

    const updatedRoom = await MeetingRoom.findByPk(id, {
      include: [
        { association: 'facilities' },
        { model: User, as: 'roomManager', attributes: ['id', 'name', 'email'], foreignKey: 'room_manager_id' },
        { model: Department, as: 'owningDepartment', attributes: ['id', 'name'], foreignKey: 'owning_department_id' },
      ],
    });

    res.status(200).json({
      success: true,
      message: 'Room updated successfully',
      data: updatedRoom,
    });
  } catch (error) {
    console.error('Error updating room:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating room',
      error: error.message,
    });
  }
};

/**
 * Change room status
 */
export const changeRoomStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['available', 'under_maintenance', 'inactive'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be: available, under_maintenance, inactive',
      });
    }

    const room = await MeetingRoom.findByPk(id);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found',
      });
    }

    const oldStatus = room.status;
    await room.update({ status });

    // Log activity
    await ActivityLog.create({
      user_id: req.user?.id,
      action: 'ROOM_STATUS_CHANGE',
      entity_type: 'Room',
      entity_id: room.id,
      description: `Changed room status from '${oldStatus}' to '${status}'`,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
    });

    res.status(200).json({
      success: true,
      message: `Room status changed to ${status}`,
      data: {
        id: room.id,
        name: room.name,
        room_number: room.room_number,
        status: room.status,
      },
    });
  } catch (error) {
    console.error('Error changing room status:', error);
    res.status(500).json({
      success: false,
      message: 'Error changing room status',
      error: error.message,
    });
  }
};

/**
 * Delete room
 */
export const deleteRoom = async (req, res) => {
  try {
    const { id } = req.params;

    const room = await MeetingRoom.findByPk(id);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found',
      });
    }

    // TODO: Check for active bookings
    // const activeBookings = await MeetingBooking.count({
    //   where: { meeting_room_id: id, booking_status: { [Op.in]: ['submitted', 'confirmed'] } },
    // });

    // Log activity before delete
    await ActivityLog.create({
      user_id: req.user?.id,
      action: 'ROOM_DELETE',
      entity_type: 'Room',
      entity_id: room.id,
      description: `Deleted room: ${room.name} (${room.room_number})`,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
    });

    await RoomFacility.destroy({ where: { meeting_room_id: id } });
    await room.destroy();

    res.status(200).json({
      success: true,
      message: 'Room deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting room:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting room',
      error: error.message,
    });
  }
};

/**
 * Check room availability for given time slot
 */
export const checkAvailability = async (req, res) => {
  try {
    const { roomId, meetingDate, startTime, endTime } = req.query;

    if (!roomId || !meetingDate || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'Missing required query parameters: roomId, meetingDate, startTime, endTime',
      });
    }

    const result = await checkRoomAvailability(roomId, meetingDate, startTime, endTime);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error checking availability:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking availability',
      error: error.message,
    });
  }
};

/**
 * Search available rooms
 */
export const searchAvailableRooms = async (req, res) => {
  try {
    const {
      meetingDate,
      startTime,
      endTime,
      minCapacity,
      building,
      floor,
      roomType,
      requiredFacilities,
    } = req.query;

    if (!meetingDate || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'Missing required query parameters: meetingDate, startTime, endTime',
      });
    }

    const facilities = requiredFacilities ? (Array.isArray(requiredFacilities) ? requiredFacilities : [requiredFacilities]) : [];

    const criteria = {
      meetingDate,
      startTime,
      endTime,
      minCapacity: minCapacity ? parseInt(minCapacity) : null,
      building: building || null,
      floor: floor ? parseInt(floor) : null,
      roomType: roomType || null,
      requiredFacilities: facilities,
    };

    const availableRooms = await findAvailableRooms(criteria);

    res.status(200).json({
      success: true,
      message: `Found ${availableRooms.length} available rooms`,
      data: availableRooms,
      count: availableRooms.length,
    });
  } catch (error) {
    console.error('Error searching available rooms:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching available rooms',
      error: error.message,
    });
  }
};
