import { DataTypes } from 'sequelize';
import sequelize from '../../../config/database.js';

const ApprovalHistory = sequelize.define(
  'ApprovalHistory',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    approval_request_id: { type: DataTypes.INTEGER, allowNull: false },
    action: {
      type: DataTypes.ENUM('submitted', 'approved', 'rejected', 'commented'),
      allowNull: false,
    },
    performed_by_id: { type: DataTypes.INTEGER, allowNull: false }, // FK to User
    notes: { type: DataTypes.TEXT, allowNull: true },
    ip_address: { type: DataTypes.STRING(45), allowNull: true }, // Support for IPv6
  },
  {
    tableName: 'approval_history',
    underscored: true,
    timestamps: true,
    indexes: [
      { fields: ['approval_request_id'] },
      { fields: ['performed_by_id'] },
      { fields: ['action'] },
      { fields: ['created_at'] },
    ],
  }
);

export default ApprovalHistory;
