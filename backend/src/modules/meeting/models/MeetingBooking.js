import { DataTypes } from 'sequelize';
import sequelize from '../../../config/database.js';

const MeetingBooking = sequelize.define(
  'MeetingBooking',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    booking_number: { type: DataTypes.STRING(50), unique: true, allowNull: false }, // e.g., BK-2026-001
    title: { type: DataTypes.STRING(200), allowNull: false },
    purpose: { type: DataTypes.TEXT, allowNull: true },
    meeting_date: { type: DataTypes.DATEONLY, allowNull: false },
    start_time: { type: DataTypes.TIME, allowNull: false }, // HH:MM:SS
    end_time: { type: DataTypes.TIME, allowNull: false },
    meeting_room_id: { type: DataTypes.INTEGER, allowNull: false },
    organizer_id: { type: DataTypes.INTEGER, allowNull: false }, // FK to User
    department_id: { type: DataTypes.INTEGER, allowNull: true }, // FK to Department
    meeting_type: {
      type: DataTypes.ENUM(
        'internal_meeting',
        'client_meeting',
        'team_meeting',
        'board_meeting',
        'training',
        'presentation',
        'interview',
        'other'
      ),
      allowNull: false,
      defaultValue: 'internal_meeting',
    },
    participants_count: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1 } },
    external_participants_count: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
    is_external_meeting: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    required_facilities: { type: DataTypes.JSON, allowNull: true }, // Array of facility types
    additional_notes: { type: DataTypes.TEXT, allowNull: true },
    status: {
      type: DataTypes.ENUM(
        'pending_department_head',
        'pending_hr',
        'confirmed',
        'rejected',
        'cancelled',
        'completed'
      ),
      allowNull: false,
      defaultValue: 'pending_department_head',
    },
    cancellation_reason: { type: DataTypes.TEXT, allowNull: true },
    cancelled_by_id: { type: DataTypes.INTEGER, allowNull: true }, // FK to User
    cancelled_at: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: 'meeting_bookings',
    underscored: true,
    timestamps: true,
    indexes: [
      { fields: ['booking_number'] },
      { fields: ['meeting_room_id', 'meeting_date', 'start_time', 'end_time'], name: 'idx_room_datetime' },
      { fields: ['organizer_id'] },
      { fields: ['department_id'] },
      { fields: ['status'] },
      { fields: ['meeting_date'] },
    ],
  }
);

export default MeetingBooking;
