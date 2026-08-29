import db from '../models/index.js';

const { Notification, User, Role } = db;

// Reusable helper — create a notification for a single user.
export const createNotification = async (userId, { title, message = null, type = 'info' }) => {
  if (!userId || !title) return null;
  try {
    return await Notification.create({ user_id: userId, title, message, type });
  } catch (err) {
    console.error('Failed to create notification:', err.message);
    return null;
  }
};

// Notify every user holding one of the given role names.
export const notifyRoles = async (roleNames, payload) => {
  const users = await User.findAll({
    include: [{ model: Role, as: 'role', where: { name: roleNames }, attributes: [] }],
    attributes: ['id'],
    raw: true,
  });
  await Promise.all(users.map((u) => createNotification(u.id, payload)));
};

// GET /api/notifications — current user's notifications (newest first).
export const listNotifications = async (req, res, next) => {
  try {
    const rows = await Notification.findAll({
      where: { user_id: req.user.id },
      order: [['created_at', 'DESC']],
      limit: 50,
      raw: true,
    });
    const unread = rows.filter((r) => !r.is_read).length;
    res.json({ data: rows, unread });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/notifications/:id/read
export const markRead = async (req, res, next) => {
  try {
    await Notification.update(
      { is_read: true },
      { where: { id: req.params.id, user_id: req.user.id } }
    );
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/notifications/read-all
export const markAllRead = async (req, res, next) => {
  try {
    await Notification.update({ is_read: true }, { where: { user_id: req.user.id, is_read: false } });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/notifications — clear the current user's notifications.
export const clearNotifications = async (req, res, next) => {
  try {
    await Notification.destroy({ where: { user_id: req.user.id } });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};
