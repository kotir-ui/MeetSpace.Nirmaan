import { DataTypes } from 'sequelize';
import sequelize from '../../../config/database.js';

const BookingStatusHistory = sequelize.define(
  'BookingStatusHistory',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    meeting_booking_id: { type: DataTypes.INTEGER, allowNull: false },
    previous_status: {
      type: DataTypes.ENUM(
        'pending_department_head',
        'pending_hr',
        'confirmed',
        'rejected',
        'cancelled',
        'completed'
      ),
      allowNull: true,
    },
    new_status: {
      type: DataTypes.ENUM(
        'pending_department_head',
        'pending_hr',
        'confirmed',
        'rejected',
        'cancelled',
        'completed'
      ),
      allowNull: false,
    },
    changed_by_id: { type: DataTypes.INTEGER, allowNull: false }, // FK to User
    reason: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    tableName: 'booking_status_history',
    underscored: true,
    timestamps: true,
    indexes: [
      { fields: ['meeting_booking_id'] },
      { fields: ['changed_by_id'] },
      { fields: ['new_status'] },
      { fields: ['created_at'] },
    ],
  }
);

export default BookingStatusHistory;
