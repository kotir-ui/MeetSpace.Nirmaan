/**
 * Seed script to initialize default roles and permissions for Meetspace.Nirmaan
 * Run: node src/seeders/seedRolesPermissions.js
 */

import db from '../models/index.js';

const { sequelize, Role, Permission, RolePermission } = db;

const defaultRoles = [
  { name: 'Super Admin', description: 'Complete unrestricted access' },
  { name: 'Admin', description: 'Administrative access based on permissions' },
  {
    name: 'Department Head',
    description: 'Manage department bookings and approvals',
  },
  { name: 'Employee', description: 'Regular employee access' },
  { name: 'Viewer', description: 'Read-only access' },
];

const defaultPermissions = [
  // Dashboard
  { module: 'Dashboard', action: 'View', description: 'View dashboard' },
  { module: 'Dashboard', action: 'Export', description: 'Export dashboard data' },

  // Calendar
  { module: 'Calendar', action: 'View', description: 'View calendar' },

  // Phase 3: Meeting Room Master
  { module: 'MeetingRooms', action: 'View', description: 'View meeting rooms' },
  { module: 'MeetingRooms', action: 'Create', description: 'Create new room' },
  { module: 'MeetingRooms', action: 'Edit', description: 'Edit room details' },
  { module: 'MeetingRooms', action: 'Delete', description: 'Delete room' },
  { module: 'MeetingRooms', action: 'Maintenance', description: 'Manage room maintenance' },
  { module: 'MeetingRooms', action: 'Export', description: 'Export room data' },

  // Phase 4: Booking Engine
  { module: 'Bookings', action: 'View', description: 'View all bookings' },
  { module: 'Bookings', action: 'Create', description: 'Create new booking' },
  { module: 'Bookings', action: 'Edit', description: 'Edit booking details' },
  { module: 'Bookings', action: 'Delete', description: 'Delete booking' },
  { module: 'Bookings', action: 'Submit', description: 'Submit booking for approval' },
  { module: 'Bookings', action: 'Cancel', description: 'Cancel booking' },
  { module: 'Bookings', action: 'ViewAvailability', description: 'Check room availability' },
  { module: 'Bookings', action: 'SearchRooms', description: 'Search available rooms' },
  { module: 'Bookings', action: 'ViewOccupancy', description: 'View room occupancy' },

  // Phase 5: Approvals & Notifications
  { module: 'Approvals', action: 'View', description: 'View approval requests' },
  { module: 'Approvals', action: 'Approve', description: 'Approve bookings' },
  { module: 'Approvals', action: 'Reject', description: 'Reject bookings' },
  { module: 'Approvals', action: 'Comment', description: 'Add comments to approvals' },
  { module: 'Approvals', action: 'ViewHistory', description: 'View approval history' },

  { module: 'Notifications', action: 'View', description: 'View notifications' },
  { module: 'Notifications', action: 'MarkRead', description: 'Mark notifications as read' },
  { module: 'Notifications', action: 'Delete', description: 'Delete notifications' },

  // Meeting Room Booking (legacy)
  { module: 'BookingRoom', action: 'View', description: 'View available rooms' },
  { module: 'BookingRoom', action: 'Create', description: 'Create booking request' },
  { module: 'BookingRoom', action: 'Edit', description: 'Edit own booking' },
  { module: 'BookingRoom', action: 'Cancel', description: 'Cancel own booking' },

  // My Bookings (legacy)
  { module: 'MyBookings', action: 'View', description: 'View own bookings' },
  { module: 'MyBookings', action: 'Edit', description: 'Modify own bookings' },
  { module: 'MyBookings', action: 'Cancel', description: 'Cancel own bookings' },

  // Approval Requests (legacy)
  { module: 'ApprovalRequests', action: 'View', description: 'View approval requests' },
  { module: 'ApprovalRequests', action: 'Approve', description: 'Approve requests' },
  { module: 'ApprovalRequests', action: 'Reject', description: 'Reject requests' },

  // Facilities
  { module: 'Facilities', action: 'View', description: 'View facilities' },
  { module: 'Facilities', action: 'Create', description: 'Create facility' },
  { module: 'Facilities', action: 'Edit', description: 'Edit facility' },
  { module: 'Facilities', action: 'Delete', description: 'Delete facility' },

  // Departments
  { module: 'Departments', action: 'View', description: 'View departments' },
  { module: 'Departments', action: 'Create', description: 'Create department' },
  { module: 'Departments', action: 'Edit', description: 'Edit department' },
  { module: 'Departments', action: 'Delete', description: 'Delete department' },

  // Users
  { module: 'Users', action: 'View', description: 'View users' },
  { module: 'Users', action: 'Create', description: 'Create user' },
  { module: 'Users', action: 'Edit', description: 'Edit user' },
  { module: 'Users', action: 'Delete', description: 'Delete user' },

  // Roles & Permissions
  { module: 'RolesPermissions', action: 'View', description: 'View roles and permissions' },
  { module: 'RolesPermissions', action: 'Create', description: 'Create role' },
  { module: 'RolesPermissions', action: 'Edit', description: 'Edit role permissions' },
  { module: 'RolesPermissions', action: 'Delete', description: 'Delete role' },

  // Reports
  { module: 'Reports', action: 'View', description: 'View reports' },
  { module: 'Reports', action: 'Export', description: 'Export reports' },

  // Activity Logs
  { module: 'ActivityLogs', action: 'View', description: 'View activity logs' },

  // Settings
  { module: 'Settings', action: 'View', description: 'View settings' },
  { module: 'Settings', action: 'Edit', description: 'Edit settings' },
];

// Define which roles get which permissions
const rolePermissionMap = {
  'Super Admin': defaultPermissions.map((p) => `${p.module}:${p.action}`), // All

  Admin: [
    // Dashboard
    'Dashboard:View',
    'Dashboard:Export',
    'Calendar:View',

    // Phase 3: Rooms
    'MeetingRooms:View',
    'MeetingRooms:Create',
    'MeetingRooms:Edit',
    'MeetingRooms:Maintenance',
    'MeetingRooms:Export',

    // Phase 4: Bookings
    'Bookings:View',
    'Bookings:Create',
    'Bookings:Edit',
    'Bookings:Delete',
    'Bookings:Submit',
    'Bookings:Cancel',
    'Bookings:ViewAvailability',
    'Bookings:SearchRooms',
    'Bookings:ViewOccupancy',

    // Phase 5: Approvals & Notifications
    'Approvals:View',
    'Approvals:Approve',
    'Approvals:Reject',
    'Approvals:Comment',
    'Approvals:ViewHistory',
    'Notifications:View',
    'Notifications:MarkRead',

    // Legacy
    'MyBookings:View',
    'ApprovalRequests:View',
    'ApprovalRequests:Approve',
    'ApprovalRequests:Reject',

    // Master data
    'Departments:View',
    'Departments:Create',
    'Departments:Edit',
    'Users:View',
    'Users:Create',
    'Users:Edit',
    'RolesPermissions:View',

    // Reports
    'Reports:View',
    'Reports:Export',
    'ActivityLogs:View',
    'Settings:View',
  ],

  'Department Head': [
    'Dashboard:View',
    'Calendar:View',

    // Phase 3: Rooms
    'MeetingRooms:View',

    // Phase 4: Bookings
    'Bookings:View',
    'Bookings:Create',
    'Bookings:Edit',
    'Bookings:Submit',
    'Bookings:Cancel',
    'Bookings:ViewAvailability',
    'Bookings:SearchRooms',

    // Phase 5: Approvals & Notifications
    'Approvals:View',
    'Approvals:Approve',
    'Approvals:Comment',
    'Approvals:ViewHistory',
    'Notifications:View',
    'Notifications:MarkRead',

    // Legacy
    'BookingRoom:View',
    'MyBookings:View',
    'MyBookings:Cancel',
    'ApprovalRequests:View',
    'ApprovalRequests:Approve',

    'Reports:View',
  ],

  Employee: [
    'Dashboard:View',
    'Calendar:View',

    // Phase 3: Rooms
    'MeetingRooms:View',

    // Phase 4: Bookings
    'Bookings:View',
    'Bookings:Create',
    'Bookings:Edit',
    'Bookings:Submit',
    'Bookings:Cancel',
    'Bookings:ViewAvailability',
    'Bookings:SearchRooms',

    // Phase 5: Notifications
    'Notifications:View',
    'Notifications:MarkRead',
    'Notifications:Delete',

    // Legacy
    'BookingRoom:View',
    'BookingRoom:Create',
    'BookingRoom:Edit',
    'BookingRoom:Cancel',
    'MyBookings:View',
    'MyBookings:Edit',
    'MyBookings:Cancel',
  ],

  Viewer: [
    'Dashboard:View',
    'Calendar:View',
    'MeetingRooms:View',
    'Bookings:View',
    'Bookings:ViewAvailability',
    'Bookings:SearchRooms',
    'Notifications:View',
  ],
};

async function seed() {
  try {
    console.log('🌱 Starting seed of roles and permissions...');

    // Truncate existing data
    await RolePermission.destroy({ where: {} });
    await Permission.destroy({ where: {} });
    await Role.destroy({ where: {} });

    // Create permissions
    console.log('📝 Creating permissions...');
    const createdPermissions = await Permission.bulkCreate(defaultPermissions, {
      individualHooks: true,
    });
    console.log(`✅ Created ${createdPermissions.length} permissions`);

    // Create permissions map for easy lookup
    const permissionMap = new Map();
    createdPermissions.forEach((p) => {
      permissionMap.set(`${p.module}:${p.action}`, p.id);
    });

    // Create roles
    console.log('👥 Creating roles...');
    const createdRoles = await Role.bulkCreate(defaultRoles, {
      individualHooks: true,
    });
    console.log(`✅ Created ${createdRoles.length} roles`);

    // Assign permissions to roles
    console.log('🔗 Assigning permissions to roles...');
    for (const role of createdRoles) {
      const permissionKeys = rolePermissionMap[role.name] || [];
      const rolePermissions = permissionKeys.map((key) => ({
        role_id: role.id,
        permission_id: permissionMap.get(key),
        status: 'granted',
      }));

      if (rolePermissions.length > 0) {
        await RolePermission.bulkCreate(rolePermissions, {
          individualHooks: true,
        });
        console.log(`✅ Assigned ${rolePermissions.length} permissions to ${role.name}`);
      }
    }

    console.log('✨ Seed completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  }
}

seed();
