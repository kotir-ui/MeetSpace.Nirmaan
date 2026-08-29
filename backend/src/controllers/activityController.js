import db from '../models/index.js';

const { ActivityLog, User } = db;

export const listLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const { count, rows } = await ActivityLog.findAndCountAll({
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }],
      order: [['created_at', 'DESC']],
      limit: Number(limit),
      offset,
    });
    res.json({ total: count, page: Number(page), limit: Number(limit), data: rows });
  } catch (err) {
    next(err);
  }
};
