import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

// Simple key/value store for Super Admin feature toggles.
const AppSetting = sequelize.define(
  'AppSetting',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    key: { type: DataTypes.STRING(64), allowNull: false, unique: true },
    value: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  { tableName: 'app_settings', underscored: true }
);

export default AppSetting;
