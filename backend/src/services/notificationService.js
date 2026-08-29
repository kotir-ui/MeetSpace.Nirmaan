import db from '../models/index.js';

const { Notification } = db;

/**
 * Deliver a system notification to a user.
 */
export const createNotification = async (userId, { title, message, type = 'info', relatedBookingId = null }) => {
  try {
    return await Notification.create({
      user_id: userId,
      title,
      message,
      type,
      related_booking_id: relatedBookingId,
    });
  } catch (err) {
    console.error('Failed to create notification:', err.message);
    return null;
  }
};

/**
 * Deliver a single email notification (log fallback).
 */
export const deliverEmail = async ({ to, subject, body }) => {
  console.log(`📧 [notification] to=${to} :: ${subject}`);
  return true;
};
