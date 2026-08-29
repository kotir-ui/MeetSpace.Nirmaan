import db from '../models/index.js';

const { Notification, User } = db;

// Get user notifications
export const getUserNotifications = async (req, res) => {
  try {
    const { userId } = req.user;
    const { isRead } = req.query;

    let where = { user_id: userId };
    if (isRead !== undefined) {
      where.is_read = isRead === 'true';
    }

    const notifications = await Notification.findAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
      ],
      order: [['created_at', 'DESC']],
      limit: 50,
    });

    res.json({ success: true, data: notifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get unread notification count
export const getUnreadCount = async (req, res) => {
  try {
    const { userId } = req.user;

    const count = await Notification.count({
      where: { user_id: userId, is_read: false },
    });

    res.json({ success: true, data: { unreadCount: count } });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Mark notification as read
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.user;

    const notification = await Notification.findByPk(id);
    if (!notification) {
      return res.status(404).json({ success: false, error: 'Notification not found' });
    }

    // Check if user owns this notification
    if (notification.user_id !== userId) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    await notification.update({ is_read: true });

    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Mark all notifications as read
export const markAllAsRead = async (req, res) => {
  try {
    const { userId } = req.user;

    await Notification.update(
      { is_read: true },
      { where: { user_id: userId, is_read: false } }
    );

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Delete notification
export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.user;

    const notification = await Notification.findByPk(id);
    if (!notification) {
      return res.status(404).json({ success: false, error: 'Notification not found' });
    }

    // Check if user owns this notification
    if (notification.user_id !== userId) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    await notification.destroy();

    res.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Delete all notifications
export const deleteAllNotifications = async (req, res) => {
  try {
    const { userId } = req.user;

    await Notification.destroy({
      where: { user_id: userId },
    });

    res.json({ success: true, message: 'All notifications deleted' });
  } catch (error) {
    console.error('Error deleting all notifications:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get notification statistics
export const getNotificationStats = async (req, res) => {
  try {
    const { userId } = req.user;

    const total = await Notification.count({ where: { user_id: userId } });
    const unread = await Notification.count({ where: { user_id: userId, is_read: false } });

    // Group by type
    const byType = await Notification.findAll({
      attributes: ['type', [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']],
      where: { user_id: userId },
      group: ['type'],
      raw: true,
    });

    res.json({
      success: true,
      data: {
        total,
        unread,
        byType,
      },
    });
  } catch (error) {
    console.error('Error fetching notification stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export default {
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
  getNotificationStats,
};
