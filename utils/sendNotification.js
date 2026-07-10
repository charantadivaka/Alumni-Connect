const Notification = require('../models/Notification');
const { invalidatePattern } = require('../config/redis');

/**
 * Create a notification and emit it via Socket.io
 * @param {object} io - Socket.io server instance
 * @param {string} userId - recipient user ID
 * @param {string} type - notification type key
 * @param {string} message - human-readable message
 * @param {string} link - optional frontend route to navigate to
 */
const sendNotification = async (io, userId, type, message, link = '') => {
    try {
        const notification = await Notification.create({
            user: userId,
            type,
            message,
            link,
        });
        // Emit real-time socket event if receiver is online
        io.to(userId.toString()).emit('new_notification', notification);

        // Invalidate Redis cache for this user's notifications
        await invalidatePattern(`__express__/api/notifications*`).catch(() => {});
    } catch (err) {
        console.error('Notification error:', err.message);
    }
};

module.exports = sendNotification;
