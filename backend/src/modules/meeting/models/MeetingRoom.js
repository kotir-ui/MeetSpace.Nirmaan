import { DataTypes } from 'sequelize';
import sequelize from '../../../config/database.js';

const MeetingRoom = sequelize.define(
  'MeetingRoom',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(100), allowNull: false },
    room_number: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    building: { type: DataTypes.STRING(100), allowNull: false, comment: 'Building name or code' },
    floor: { type: DataTypes.INTEGER, allowNull: false },
    location: { type: DataTypes.STRING(200), allowNull: false },
    room_type: {
      type: DataTypes.ENUM('conference_room', 'board_room', 'training_room', 'interview_room', 'meeting_room', 'discussion_room'),
      allowNull: false,
      defaultValue: 'meeting_room',
      comment: 'Type of meeting room',
    },
    capacity: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1 } },
    room_manager_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'users', key: 'id' },
      comment: 'Person responsible for this room',
    },
    owning_department_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'departments', key: 'id' },
      comment: 'Department that owns/manages this room',
    },
    status: {
      type: DataTypes.ENUM('available', 'under_maintenance', 'inactive'),
      allowNull: false,
      defaultValue: 'available',
      comment: 'available | under_maintenance | inactive',
    },
    image_url: { type: DataTypes.STRING(255), allowNull: true, comment: 'URL to room image' },
    booking_availability: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'JSON: {monday: {start: "09:00", end: "18:00"}, ...}',
    },
    description: { type: DataTypes.TEXT, allowNull: true },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    tableName: 'meeting_rooms',
    underscored: true,
    timestamps: true,
    indexes: [
      { fields: ['room_number'] },
      { fields: ['status'] },
      { fields: ['building', 'floor'] },
      { fields: ['room_type'] },
      { fields: ['room_manager_id'] },
      { fields: ['owning_department_id'] },
    ],
  }
);

export default MeetingRoom;
