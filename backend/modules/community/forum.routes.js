'use strict';

const express = require('express');
const router = express.Router();
const forumController = require('./forum.controller');
const { protect } = require('../../middleware/authMiddleware');

router.use(protect);

router.get('/', forumController.getThreads);
router.get('/:id', forumController.getThreadById);

router.post('/', forumController.createThread);
router.put('/:id', forumController.editThread);
router.delete('/:id', forumController.deleteThread);

router.post('/:id/reply', forumController.addReply);
router.put('/:id/reply/:replyId', forumController.editReply);
router.delete('/:id/reply/:replyId', forumController.deleteReply);
router.put('/:id/reply/:replyId/accept', forumController.acceptReply);

router.put('/:id/upvote', forumController.upvoteThread);
router.post('/:id/follow', forumController.toggleFollow);
router.post('/:id/report', forumController.reportContent);

module.exports = router;
