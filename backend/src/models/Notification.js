import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

// Per-user in-app notification.
const Notification = sequelize.define(
  'Notification',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.STRING(160), allowNull: false },
    message: { type: DataTypes.STRING(500), allowNull: true },
    type: {
      type: DataTypes.ENUM(
        'info',
        'success',
        'warning',
        'error',
        'booking_request',
        'approval_required',
        'approved',
        'rejected',
        'confirmation',
        'reminder',
        'cancellation',
        'modification'
      ),
      allowNull: false,
      defaultValue: 'info',
    },
    related_booking_id: { type: DataTypes.INTEGER, allowNull: true }, // FK to MeetingBooking
    is_read: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  },
  { tableName: 'notifications', underscored: true, timestamps: true }
);

export default Notification;
