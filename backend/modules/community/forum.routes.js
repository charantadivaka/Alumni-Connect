'use strict';

const express = require('express');
const router = express.Router();
const forumController = require('./forum.controller');
const { protect } = require('../../middleware/authMiddleware');

router.get('/', forumController.getThreads); // Public browsing
router.get('/:id', forumController.getThreadById);

router.use(protect);
router.post('/', forumController.createThread);
router.post('/:id/reply', forumController.addReply);
router.put('/:id/upvote', forumController.upvoteThread);
router.delete('/:id', forumController.deleteThread);

module.exports = router;
