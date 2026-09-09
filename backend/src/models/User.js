import { DataTypes } from 'sequelize';
import bcrypt from 'bcryptjs';
import sequelize from '../config/database.js';

const User = sequelize.define(
  'User',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    employee_id: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      comment: 'Unique employee identifier',
    },
    name: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(160),
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    mobile: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    designation: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    role_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    department_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Department this user belongs to',
    },
    manager_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'users', key: 'id' },
      comment: 'Direct manager/supervisor',
    },
    department_head_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'users', key: 'id' },
      comment: 'Department head for approval workflows',
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'suspended', 'locked'),
      defaultValue: 'active',
      comment: 'active | inactive | suspended | locked',
    },
    joining_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    profile_image: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'URL or path to profile image',
    },
    password_status: {
      type: DataTypes.STRING(50),
      defaultValue: 'set',
      comment: 'set | reset_required | expired',
    },
    last_login: {
      type: DataTypes.DATE,
      allowNull: true,
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
    tableName: 'users',
    timestamps: true,
    underscored: true,
    defaultScope: {
      attributes: { exclude: ['password'] },
    },
    scopes: {
      withPassword: { attributes: {} },
    },
    hooks: {
      beforeSave: async (user) => {
        if (user.changed('password')) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
    },
  }
);

User.prototype.comparePassword = async function (plain) {
  if (!this.password) return false;
  if (this.password === plain) return true;
  try {
    return await bcrypt.compare(plain, this.password);
  } catch (err) {
    return false;
  }
};

export default User;
