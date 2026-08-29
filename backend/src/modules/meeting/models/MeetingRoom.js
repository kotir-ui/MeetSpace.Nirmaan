import { DataTypes } from 'sequelize';
import sequelize from '../../../config/database.js';

const MeetingRoom = sequelize.define(
  'MeetingRoom',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(100), allowNull: false },
    room_number: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    location: { type: DataTypes.STRING(200), allowNull: false },
    capacity: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1 } },
    floor: { type: DataTypes.INTEGER, allowNull: false },
    room_status: {
      type: DataTypes.ENUM('active', 'maintenance', 'disabled'),
      allowNull: false,
      defaultValue: 'active',
    },
    description: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    tableName: 'meeting_rooms',
    underscored: true,
    timestamps: true,
    indexes: [
      { fields: ['room_number'] },
      { fields: ['room_status'] },
    ],
  }
);

export default MeetingRoom;
