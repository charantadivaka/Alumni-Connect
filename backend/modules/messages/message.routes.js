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

module.exports = router;
