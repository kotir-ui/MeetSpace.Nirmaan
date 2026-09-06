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

    const roomsData = [
      {
        name: 'Executive Conference Room',
        room_number: 'ECR-001',
        building: 'Building A',
        floor: 3,
        location: 'Building A, 3rd Floor, Wing-North',
        room_type: 'conference_room',
        capacity: 20,
        room_manager_id: roomManagers[0]?.id || null,
        owning_department_id: departments[0]?.id || null,
        status: 'available',
        description: 'Large conference room with video conferencing capabilities',
        facilities: ['video_conference', 'projector', 'whiteboard', 'conference_phone'],
      },
      {
        name: 'Board Room A',
        room_number: 'BR-001',
        building: 'Building A',
        floor: 2,
        location: 'Building A, 2nd Floor, Wing-Center',
        room_type: 'board_room',
        capacity: 15,
        room_manager_id: roomManagers[1]?.id || null,
        owning_department_id: departments[1]?.id || null,
        status: 'available',
        description: 'Premium board room for executive meetings',
        facilities: ['projector', 'tv', 'video_conference', 'whiteboard'],
      },
      {
        name: 'Training Room 1',
        room_number: 'TR-001',
        building: 'Building B',
        floor: 1,
        location: 'Building B, 1st Floor, Training Wing',
        room_type: 'training_room',
        capacity: 30,
        room_manager_id: roomManagers[2]?.id || null,
        owning_department_id: departments[0]?.id || null,
        status: 'available',
        description: 'Spacious training room with modern facilities',
        facilities: ['projector', 'whiteboard', 'hdmi_ports', 'air_conditioning'],
      },
      {
        name: 'Meeting Room 101',
        room_number: 'MR-101',
        building: 'Building A',
        floor: 1,
        location: 'Building A, 1st Floor, Wing-South',
        room_type: 'meeting_room',
        capacity: 8,
        room_manager_id: roomManagers[0]?.id || null,
        owning_department_id: departments[1]?.id || null,
        status: 'available',
        description: 'Compact meeting room for small team discussions',
        facilities: ['projector', 'conference_phone'],
      },
      {
        name: 'Interview Room',
        room_number: 'IR-001',
        building: 'Building B',
        floor: 2,
        location: 'Building B, 2nd Floor, HR Wing',
        room_type: 'interview_room',
        capacity: 4,
        room_manager_id: roomManagers[1]?.id || null,
        owning_department_id: departments[0]?.id || null,
        status: 'available',
        description: 'Private interview room for recruitment and confidential meetings',
        facilities: [],
      },
      {
        name: 'Collaboration Space',
        room_number: 'CS-001',
        building: 'Building B',
        floor: 1,
        location: 'Building B, 1st Floor, Open Area',
        room_type: 'discussion_room',
        capacity: 12,
        room_manager_id: roomManagers[2]?.id || null,
        owning_department_id: departments[1]?.id || null,
        status: 'available',
        description: 'Flexible space for collaboration and brainstorming',
        facilities: ['whiteboard', 'usb_charging', 'air_conditioning'],
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
