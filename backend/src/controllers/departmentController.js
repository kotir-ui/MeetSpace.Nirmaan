import db from '../models/index.js';
import { logActivity } from '../utils/activity.js';

const { Department, User } = db;

export const listDepartments = async (req, res, next) => {
  try {
    res.json(await Department.findAll({ order: [['name', 'ASC']], raw: true }));
  } catch (err) {
    next(err);
  }
};

export const createDepartment = async (req, res, next) => {
  try {
    const name = String(req.body.name || '').trim();
    if (!name) return res.status(400).json({ message: 'Department name is required' });
    const exists = await Department.findOne({ where: { name } });
    if (exists) return res.status(409).json({ message: 'Department already exists' });
    const dept = await Department.create({ name });
    await logActivity(req, 'CREATE', 'department', `Created department ${name}`);
    res.status(201).json(dept);
  } catch (err) {
    next(err);
  }
};

export const updateDepartment = async (req, res, next) => {
  try {
    const dept = await Department.findByPk(req.params.id);
    if (!dept) return res.status(404).json({ message: 'Department not found' });
    const name = String(req.body.name || '').trim();
    if (!name) return res.status(400).json({ message: 'Department name is required' });
    const old = dept.name;
    dept.name = name;
    await dept.save();
    // Department is stored on users as a plain string — keep them in sync on rename.
    if (old !== name) await User.update({ department: name }, { where: { department: old } });
    await logActivity(req, 'UPDATE', 'department', `Renamed department ${old} → ${name}`);
    res.json(dept);
  } catch (err) {
    next(err);
  }
};

export const deleteDepartment = async (req, res, next) => {
  try {
    const dept = await Department.findByPk(req.params.id);
    if (!dept) return res.status(404).json({ message: 'Department not found' });
    await dept.destroy();
    await logActivity(req, 'DELETE', 'department', `Deleted department ${dept.name}`);
    res.json({ message: 'Department deleted' });
  } catch (err) {
    next(err);
  }
};
