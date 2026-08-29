import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const ActivityLog = sequelize.define(
  'ActivityLog',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    action: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },
    entity: {
      type: DataTypes.STRING(80),
      allowNull: true,
    },
    details: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    ip_address: {
      type: DataTypes.STRING(60),
      allowNull: true,
    },
  },
  {
    tableName: 'activity_logs',
  }
);

export default ActivityLog;
