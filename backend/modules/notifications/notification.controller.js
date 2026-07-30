'use strict';

const notificationService = require('./notification.service');
const { sendSuccess } = require('../../shared/utils/response');

const getMyNotifications = async (req, res, next) => {
    try {
        const result = await notificationService.getMyNotifications(req.user._id, req.query);
        sendSuccess(res, result);
    } catch (err) {
        next(err);
    }
};

const markAsRead = async (req, res, next) => {
    try {
        await notificationService.markAsRead(req.params.id, req.user._id);
        sendSuccess(res, null, 'Notification marked as read');
    } catch (err) {
        next(err);
    }
};

const markAllAsRead = async (req, res, next) => {
    try {
        await notificationService.markAllAsRead(req.user._id);
        sendSuccess(res, null, 'All notifications marked as read');
    } catch (err) {
        next(err);
    }
};

module.exports = { getMyNotifications, markAsRead, markAllAsRead };
