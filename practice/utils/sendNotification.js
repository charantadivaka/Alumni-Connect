const Notification = require('../models/Notification');

const sendNotification = async (io, userId, type, Message, link = '') => {
    try {
        const notification = await Notification.create({
            user: userId,
            type,
            message,
            link,
        });
        if (io) {
            io.to(userId.toString()).emit('new_notification', notification);
        }
    } catch (err) {
        console.error('Notification Error:', err.message);
    }
};

module.exports = sendNotification;