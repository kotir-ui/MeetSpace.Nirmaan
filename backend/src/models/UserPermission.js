import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const UserPermission = sequelize.define(
  'UserPermission',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' },
    },
    permission_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'permissions', key: 'id' },
    },
    status: {
      type: DataTypes.ENUM('granted', 'denied'),
      defaultValue: 'granted',
      comment: 'User-specific permission override',
    },
    scope: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Resource-level access scope (building_ids, floor_ids, room_ids, department_ids, etc.)',
    },
  },
  {
    tableName: 'user_permissions',
    indexes: [
      { fields: ['user_id', 'permission_id'], unique: true },
    ],
  }
);

export default UserPermission;
