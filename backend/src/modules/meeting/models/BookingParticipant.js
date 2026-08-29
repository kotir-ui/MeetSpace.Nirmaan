import { DataTypes } from 'sequelize';
import sequelize from '../../../config/database.js';

const BookingParticipant = sequelize.define(
  'BookingParticipant',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    meeting_booking_id: { type: DataTypes.INTEGER, allowNull: false },
    participant_id: { type: DataTypes.INTEGER, allowNull: false }, // FK to User
    is_required: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    attendance_status: {
      type: DataTypes.ENUM('invited', 'accepted', 'declined', 'no_response'),
      allowNull: false,
      defaultValue: 'invited',
    },
    rsvp_at: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: 'booking_participants',
    underscored: true,
    timestamps: false,
    indexes: [
      { fields: ['meeting_booking_id'] },
      { fields: ['participant_id'] },
      { unique: true, fields: ['meeting_booking_id', 'participant_id'], name: 'idx_booking_participant_unique' },
    ],
  }
);

export default BookingParticipant;
