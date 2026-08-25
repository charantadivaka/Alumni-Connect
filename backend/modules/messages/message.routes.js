'use strict';

const express = require('express');
const router = express.Router();
const messageController = require('./message.controller');
const { protect } = require('../../middleware/authMiddleware');

router.use(protect);

router.get('/threads', messageController.getThreads);
router.get('/:userId', messageController.getConversation);
router.post('/', messageController.saveMessage);
router.put('/:userId/read', messageController.markRead);

// New Features
router.put('/:id', messageController.editMessage);
router.delete('/:id', messageController.deleteMessage);
router.delete('/conversation/:userId', messageController.deleteConversation);
router.post('/block/:userId', messageController.blockUser);
router.post('/report/:userId', messageController.reportUser);

module.exports = router;
