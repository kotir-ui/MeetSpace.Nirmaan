import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Permission = sequelize.define(
  'Permission',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    module: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'Module name (Dashboard, Calendar, Meeting Rooms, etc.)',
    },
    action: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'Permission action (View, Create, Edit, Delete, Approve, etc.)',
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'active',
    },
  },
  {
    tableName: 'permissions',
    indexes: [
      { fields: ['module', 'action'], unique: true },
    ],
  }
);

export default Permission;
