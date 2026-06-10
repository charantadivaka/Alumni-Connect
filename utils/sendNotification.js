const Notification = require('../models/Notification');

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
        // Emit to user's socket room if they're online
        if (io) {
            io.to(userId.toString()).emit('new_notification', notification);
        }
    } catch (err) {
        console.error('Notification error:', err.message);
    }
};

module.exports = sendNotification;
