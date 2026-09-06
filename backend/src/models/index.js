import sequelize from '../config/database.js';
import Role from './Role.js';
import User from './User.js';
import Department from './Department.js';
import Notification from './Notification.js';
import PasswordResetOtp from './PasswordResetOtp.js';
import ActivityLog from './ActivityLog.js';
import AppSetting from './AppSetting.js';
import Permission from './Permission.js';
import RolePermission from './RolePermission.js';
import UserPermission from './UserPermission.js';
import LoginAttempt from './LoginAttempt.js';
import MeetingRoom from '../modules/meeting/models/MeetingRoom.js';
import RoomFacility from '../modules/meeting/models/RoomFacility.js';
import MeetingBooking from '../modules/meeting/models/MeetingBooking.js';
import BookingParticipant from '../modules/meeting/models/BookingParticipant.js';
import ApprovalRequest from '../modules/meeting/models/ApprovalRequest.js';
import ApprovalHistory from '../modules/meeting/models/ApprovalHistory.js';
import BookingStatusHistory from '../modules/meeting/models/BookingStatusHistory.js';

// Role - User
Role.hasMany(User, { foreignKey: 'role_id', as: 'users' });
User.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });

// User - Manager (self-referencing)
User.hasMany(User, { foreignKey: 'manager_id', as: 'subordinates' });
User.belongsTo(User, { foreignKey: 'manager_id', as: 'manager' });

// User - Department Head (self-referencing)
User.belongsTo(User, { foreignKey: 'department_head_id', as: 'departmentHead' });

// ---- Permission System ----
// Role - Permission (through RolePermission)
Role.hasMany(RolePermission, { foreignKey: 'role_id', as: 'permissions', onDelete: 'CASCADE' });
RolePermission.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });
Permission.hasMany(RolePermission, { foreignKey: 'permission_id', as: 'rolePermissions', onDelete: 'CASCADE' });
RolePermission.belongsTo(Permission, { foreignKey: 'permission_id', as: 'permission' });

// User - Permission (for user-specific overrides and resource scopes)
User.hasMany(UserPermission, { foreignKey: 'user_id', as: 'userPermissions', onDelete: 'CASCADE' });
UserPermission.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Permission.hasMany(UserPermission, { foreignKey: 'permission_id', as: 'userPermissions', onDelete: 'CASCADE' });
UserPermission.belongsTo(Permission, { foreignKey: 'permission_id', as: 'permission' });

// User - LoginAttempt (for login tracking)
User.hasMany(LoginAttempt, { foreignKey: 'user_id', as: 'loginAttempts', onDelete: 'SET NULL' });

// User - Department
Department.hasMany(User, { foreignKey: 'department_id', as: 'users' });
User.belongsTo(Department, { foreignKey: 'department_id', as: 'departmentGroup' });

// Department - Head and Deputy (linking to User)
Department.belongsTo(User, { foreignKey: 'department_head_id', as: 'head' });
Department.belongsTo(User, { foreignKey: 'deputy_id', as: 'deputy' });

// User - Activity Logs
User.hasMany(ActivityLog, { foreignKey: 'user_id', as: 'logs' });
ActivityLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// ---- Meeting Room Booking System ----
// MeetingRoom - RoomFacility
MeetingRoom.hasMany(RoomFacility, { foreignKey: 'meeting_room_id', as: 'facilities', onDelete: 'CASCADE' });
RoomFacility.belongsTo(MeetingRoom, { foreignKey: 'meeting_room_id', as: 'room' });

// MeetingRoom - Room Manager (User)
MeetingRoom.belongsTo(User, { foreignKey: 'room_manager_id', as: 'roomManager' });

// MeetingRoom - Owning Department
MeetingRoom.belongsTo(Department, { foreignKey: 'owning_department_id', as: 'owningDepartment' });
Department.hasMany(MeetingRoom, { foreignKey: 'owning_department_id', as: 'ownedRooms' });

// User - MeetingBooking (Organizer)
User.hasMany(MeetingBooking, { foreignKey: 'organizer_id', as: 'organizedBookings', onDelete: 'CASCADE' });
MeetingBooking.belongsTo(User, { foreignKey: 'organizer_id', as: 'organizer' });

// Department - MeetingBooking
Department.hasMany(MeetingBooking, { foreignKey: 'department_id', as: 'bookings', onDelete: 'SET NULL' });
MeetingBooking.belongsTo(Department, { foreignKey: 'department_id', as: 'department' });

// MeetingRoom - MeetingBooking
MeetingRoom.hasMany(MeetingBooking, { foreignKey: 'meeting_room_id', as: 'bookings', onDelete: 'CASCADE' });
MeetingBooking.belongsTo(MeetingRoom, { foreignKey: 'meeting_room_id', as: 'room' });

// MeetingBooking - BookingParticipant
MeetingBooking.hasMany(BookingParticipant, { foreignKey: 'meeting_booking_id', as: 'participants', onDelete: 'CASCADE' });
BookingParticipant.belongsTo(MeetingBooking, { foreignKey: 'meeting_booking_id', as: 'booking' });

// User - BookingParticipant
User.hasMany(BookingParticipant, { foreignKey: 'participant_id', as: 'bookingParticipations', onDelete: 'CASCADE' });
BookingParticipant.belongsTo(User, { foreignKey: 'participant_id', as: 'participant' });

// MeetingBooking - ApprovalRequest
MeetingBooking.hasMany(ApprovalRequest, { foreignKey: 'meeting_booking_id', as: 'approvals', onDelete: 'CASCADE' });
ApprovalRequest.belongsTo(MeetingBooking, { foreignKey: 'meeting_booking_id', as: 'booking' });

// User - ApprovalRequest (Approver)
User.hasMany(ApprovalRequest, { foreignKey: 'approver_id', as: 'approvalsAssigned', onDelete: 'CASCADE' });
ApprovalRequest.belongsTo(User, { foreignKey: 'approver_id', as: 'approver' });

// ApprovalRequest - ApprovalHistory
ApprovalRequest.hasMany(ApprovalHistory, { foreignKey: 'approval_request_id', as: 'history', onDelete: 'CASCADE' });
ApprovalHistory.belongsTo(ApprovalRequest, { foreignKey: 'approval_request_id', as: 'approval' });

// User - ApprovalHistory
User.hasMany(ApprovalHistory, { foreignKey: 'performed_by_id', as: 'approvalHistories', onDelete: 'CASCADE' });
ApprovalHistory.belongsTo(User, { foreignKey: 'performed_by_id', as: 'performer' });

// MeetingBooking - BookingStatusHistory
MeetingBooking.hasMany(BookingStatusHistory, { foreignKey: 'meeting_booking_id', as: 'statusHistory', onDelete: 'CASCADE' });
BookingStatusHistory.belongsTo(MeetingBooking, { foreignKey: 'meeting_booking_id', as: 'booking' });

// User - BookingStatusHistory
User.hasMany(BookingStatusHistory, { foreignKey: 'changed_by_id', as: 'statusChanges', onDelete: 'CASCADE' });
BookingStatusHistory.belongsTo(User, { foreignKey: 'changed_by_id', as: 'changedBy' });

// User - Notification
User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications', onDelete: 'CASCADE' });
Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// MeetingBooking - Notification (optional)
MeetingBooking.hasMany(Notification, { foreignKey: 'related_booking_id', as: 'bookingNotifications', onDelete: 'SET NULL' });
Notification.belongsTo(MeetingBooking, { foreignKey: 'related_booking_id', as: 'booking' });

const db = {
  sequelize,
  Role,
  User,
  Department,
  Notification,
  PasswordResetOtp,
  ActivityLog,
  AppSetting,
  Permission,
  RolePermission,
  UserPermission,
  LoginAttempt,
  MeetingRoom,
  RoomFacility,
  MeetingBooking,
  BookingParticipant,
  ApprovalRequest,
  ApprovalHistory,
  BookingStatusHistory,
};

export default db;
