import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Department = sequelize.define(
  'Department',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(120),
      allowNull: false,
      comment: 'Department Name',
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: true,
      defaultValue: null,
      comment: 'Unique department code',
    },
    department_head_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Primary department head/manager',
    },
    deputy_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Deputy/Assistant manager',
    },
    email: {
      type: DataTypes.STRING(160),
      allowNull: true,
      validate: { isEmail: true },
      comment: 'Department contact email',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'active',
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'departments',
    timestamps: true,
    underscored: true,
  }
);

export default Department;
