import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const RolePermission = sequelize.define(
  'RolePermission',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    role_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'roles', key: 'id' },
    },
    permission_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'permissions', key: 'id' },
    },
    status: {
      type: DataTypes.ENUM('granted', 'denied'),
      defaultValue: 'granted',
      comment: 'Explicitly grant or deny permission at role level',
    },
  },
  {
    tableName: 'role_permissions',
    indexes: [
      { fields: ['role_id', 'permission_id'], unique: true },
    ],
  }
);

export default RolePermission;
