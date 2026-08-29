import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

// One-time password for the "forgot password" email flow. The code itself is
// stored hashed; only the hash is persisted.
const PasswordResetOtp = sequelize.define(
  'PasswordResetOtp',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    email: { type: DataTypes.STRING(160), allowNull: false },
    otp_hash: { type: DataTypes.STRING(255), allowNull: false },
    expires_at: { type: DataTypes.DATE, allowNull: false },
    used: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    attempts: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  },
  { tableName: 'password_reset_otps', underscored: true }
);

export default PasswordResetOtp;
