'use strict';

/**
 * Notification Service (Shared)
 * ──────────────────────────────
 * Creates a DB notification record and emits a real-time socket event.
 * Used by every feature module that needs to notify users.
 *
 * Kept in shared/ because it is called by many different modules.
 */

const Notification = require('../../models/Notification');
const { invalidatePattern } = require('../../config/redis');

const eventBus = require('../events/eventBus');

/**
 * Create a notification and push it to the user via EventBus -> Socket.io.
 *
 * @param {string|ObjectId}  userId        - recipient user ID
 * @param {string}           type          - notification type key (e.g. 'connection_request')
 * @param {string}           message       - human-readable message shown in the UI
 * @param {string}           [link='']     - optional frontend route to navigate on click
 * @returns {Promise<import('mongoose').Document>} the created notification document
 */
const sendNotification = async (userId, type, message, link = '') => {
    try {
        const notification = await Notification.create({
            user: userId,
            type,
            message,
            link,
        });

        // Push real-time event via internal bus
        eventBus.emit('send_notification', { userId, notification });

        // Invalidate the cached notifications list for this user
        await invalidatePattern('__express__:*:/api/notifications*').catch(() => {});

        return notification;
    } catch (err) {
        // Notification failure must never crash the main request flow
        console.error('[NotificationService] Failed to create notification:', err.message);
    }
};

module.exports = { sendNotification };
