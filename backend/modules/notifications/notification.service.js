'use strict';

/**
 * Notification Fetching Service
 * ──────────────────────────────
 * Retrieves and updates a user's notifications.
 * (Note: The service to *send* notifications is shared/services/notificationService.js)
 */

const Notification = require('../../models/Notification');
const { invalidatePattern } = require('../../config/redis');

/** Get notifications for a user (paginated). */
const getMyNotifications = async (userId, query) => {
    const page  = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 20;
    const skip  = (page - 1) * limit;

    const [total, notifications] = await Promise.all([
        Notification.countDocuments({ user: userId }),
        Notification.find({ user: userId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
    ]);

    return { notifications, total };
};

/** Mark a specific notification as read. */
const markAsRead = async (notificationId, userId) => {
    const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, user: userId },
        { isRead: true },
        { new: true }
    );
    
    if (!notification) throw Object.assign(new Error('Notification not found'), { statusCode: 404 });
    
    await invalidatePattern('__express__:*:/api/notifications*').catch(() => {});
    return notification;
};

/** Mark all notifications for a user as read. */
const markAllAsRead = async (userId) => {
    await Notification.updateMany(
        { user: userId, isRead: false },
        { isRead: true }
    );
    
    await invalidatePattern('__express__:*:/api/notifications*').catch(() => {});
};

module.exports = { getMyNotifications, markAsRead, markAllAsRead };
