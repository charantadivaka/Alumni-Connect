const Notification = require('../models/Notification');

// @desc  Get all notifications for user
// @route GET /api/notifications
const getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .limit(50);
        res.json(notifications);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc  Mark one notification as read
// @route PUT /api/notifications/:id/read
const markRead = async (req, res) => {
    try {
        const n = await Notification.findOneAndUpdate(
            { _id: req.params.id, user: req.user._id },
            { isRead: true },
            { new: true }
        );
        if (!n) return res.status(404).json({ message: 'Not found' });
        res.json(n);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc  Mark all as read
// @route PUT /api/notifications/read-all
const markAllRead = async (req, res) => {
    try {
        await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
        res.json({ message: 'All marked as read' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc  Delete one notification
// @route DELETE /api/notifications/:id
const deleteNotification = async (req, res) => {
    try {
        await Notification.findOneAndDelete({ _id: req.params.id, user: req.user._id });
        res.json({ message: 'Deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { getNotifications, markRead, markAllRead, deleteNotification };
