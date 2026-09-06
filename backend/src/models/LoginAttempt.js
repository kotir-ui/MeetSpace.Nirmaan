import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const LoginAttempt = sequelize.define(
  'LoginAttempt',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'users', key: 'id' },
      onDelete: 'SET NULL',
    },
    email: {
      type: DataTypes.STRING(160),
      allowNull: false,
    },
    attempt_status: {
      type: DataTypes.ENUM('success', 'failed'),
      allowNull: false,
    },
    ip_address: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    user_agent: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    failed_reason: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Reason for failed login (invalid_credentials, account_inactive, account_locked, etc.)',
    },
    attempted_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'login_attempts',
    indexes: [
      { fields: ['email', 'attempted_at'] },
      { fields: ['attempt_status'] },
    ],
  }
);

export default LoginAttempt;
