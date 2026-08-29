import db from '../models/index.js';

const { ActivityLog } = db;

export const logActivity = async (req, action, entity, details) => {
  try {
    await ActivityLog.create({
      user_id: req.user?.id || null,
      action,
      entity,
      details: typeof details === 'string' ? details : JSON.stringify(details),
      ip_address: req.ip,
    });
  } catch (err) {
    console.error('Failed to write activity log:', err.message);
  }
};
