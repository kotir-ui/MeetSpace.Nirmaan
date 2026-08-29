import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Department = sequelize.define(
  'Department',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(120), allowNull: false, unique: true },
  },
  { tableName: 'departments', underscored: true }
);

export default Department;
