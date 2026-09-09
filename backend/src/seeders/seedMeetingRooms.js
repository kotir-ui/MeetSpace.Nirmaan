import db from '../models/index.js';

const { sequelize, MeetingRoom, RoomFacility, User, Department } = db;

async function seedRooms() {
  try {
    console.log('🌱 Starting seed of meeting rooms...');

    // Get sample users (room managers)
    const roomManagers = await User.findAll({
      where: { role_id: 1 }, // Super Admin/Admin
      limit: 3,
    });

    // Get departments
    const departments = await Department.findAll({ limit: 2 });

    await MeetingRoom.destroy({ where: {} });
    await RoomFacility.destroy({ where: {} });

    const roomsData = [
      {
        name: 'Sarvepalli Radhakrishnan',
        room_number: 'MR-01',
        building: 'Building A',
        floor: 1,
        location: 'Building A, 1st Floor',
        room_type: 'conference_room',
        capacity: 12,
        room_manager_id: roomManagers[0]?.id || null,
        owning_department_id: departments[0]?.id || null,
        status: 'available',
        description: 'Conference room named after Sarvepalli Radhakrishnan',
        facilities: ['projector', 'video_conference', 'air_conditioning'],
      },
      {
        name: 'Ratan Tata',
        room_number: 'MR-02',
        building: 'Building A',
        floor: 1,
        location: 'Building A, 1st Floor',
        room_type: 'conference_room',
        capacity: 12,
        room_manager_id: roomManagers[1]?.id || null,
        owning_department_id: departments[1]?.id || null,
        status: 'available',
        description: 'Conference room named after Ratan Tata',
        facilities: ['tv', 'whiteboard', 'air_conditioning'],
      },
      {
        name: 'Dr. Bidhan Chandra Roy',
        room_number: 'MR-03',
        building: 'Building A',
        floor: 1,
        location: 'Building A, 1st Floor',
        room_type: 'meeting_room',
        capacity: 10,
        room_manager_id: roomManagers[2]?.id || null,
        owning_department_id: departments[0]?.id || null,
        status: 'available',
        description: 'Meeting room named after Dr. Bidhan Chandra Roy',
        facilities: ['projector', 'conference_phone'],
      },
      {
        name: 'Sunderlal Bahuguna',
        room_number: 'MR-04',
        building: 'Building A',
        floor: 1,
        location: 'Building A, 1st Floor',
        room_type: 'meeting_room',
        capacity: 10,
        room_manager_id: roomManagers[0]?.id || null,
        owning_department_id: departments[1]?.id || null,
        status: 'available',
        description: 'Meeting room named after Sunderlal Bahuguna',
        facilities: ['video_conference', 'whiteboard'],
      },
    ];

    console.log('📝 Creating rooms...');
    for (const roomData of roomsData) {
      const { facilities, ...roomFields } = roomData;

      const room = await MeetingRoom.create(roomFields);

      // Add facilities
      if (facilities && facilities.length > 0) {
        for (const facility of facilities) {
          await RoomFacility.create({
            meeting_room_id: room.id,
            facility_type: facility,
          });
        }
      }

      console.log(`  ✅ Created: ${room.name} (${room.room_number})`);
    }

    console.log('\n✨ Room seed completed successfully!');
    console.log(`\n📊 Summary:`);
    console.log(`   - Rooms created: ${roomsData.length}`);
    console.log(`   - Buildings: Building A (3 floors), Building B (2 floors)`);
    console.log(`   - Room types: Conference, Board, Training, Meeting, Interview, Discussion`);
    console.log(`   - Total capacity: ${roomsData.reduce((sum, r) => sum + r.capacity, 0)} people`);

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err.message);
    console.error('Full error:', err);
    process.exit(1);
  }
}

seedRooms();
