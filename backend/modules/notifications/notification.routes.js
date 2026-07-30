'use strict';

const express = require('express');
const router = express.Router();
const notificationController = require('./notification.controller');
const { protect } = require('../../middleware/authMiddleware');
const { cacheMiddleware } = require('../../config/redis');

router.use(protect);

router.get('/', cacheMiddleware(60), notificationController.getMyNotifications);
router.put('/read-all', notificationController.markAllAsRead);
router.put('/:id/read', notificationController.markAsRead);

module.exports = router;
