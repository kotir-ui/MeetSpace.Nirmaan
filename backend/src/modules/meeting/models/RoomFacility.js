import { DataTypes } from 'sequelize';
import sequelize from '../../../config/database.js';

const RoomFacility = sequelize.define(
  'RoomFacility',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    meeting_room_id: { type: DataTypes.INTEGER, allowNull: false },
    facility_type: {
      type: DataTypes.ENUM(
        'projector',
        'tv',
        'video_conference',
        'whiteboard',
        'conference_phone',
        'speaker_phone',
        'air_conditioning',
        'hdmi_ports',
        'usb_charging'
      ),
      allowNull: false,
    },
  },
  {
    tableName: 'room_facilities',
    underscored: true,
    timestamps: false,
    indexes: [
      { fields: ['meeting_room_id'] },
      { fields: ['facility_type'] },
    ],
  }
);

export default RoomFacility;
