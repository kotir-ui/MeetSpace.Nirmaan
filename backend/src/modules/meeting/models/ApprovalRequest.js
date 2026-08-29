import { DataTypes } from 'sequelize';
import sequelize from '../../../config/database.js';

const ApprovalRequest = sequelize.define(
  'ApprovalRequest',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    meeting_booking_id: { type: DataTypes.INTEGER, allowNull: false, unique: 'uq_booking_approver' },
    approver_id: { type: DataTypes.INTEGER, allowNull: false, unique: 'uq_booking_approver' }, // FK to User
    approver_type: {
      type: DataTypes.ENUM('department_head', 'hr'),
      allowNull: false,
      unique: 'uq_booking_approver',
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      allowNull: false,
      defaultValue: 'pending',
    },
    comments: { type: DataTypes.TEXT, allowNull: true },
    approved_at: { type: DataTypes.DATE, allowNull: true },
    rejected_at: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: 'approval_requests',
    underscored: true,
    timestamps: true,
    indexes: [
      { fields: ['meeting_booking_id'] },
      { fields: ['approver_id'] },
      { fields: ['status'] },
      { fields: ['approver_type'] },
    ],
  }
);

export default ApprovalRequest;
