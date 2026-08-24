'use strict';

const express = require('express');
const router = express.Router();
const storyController = require('./story.controller');
const { protect, roleCheck } = require('../../middleware/authMiddleware');

router.use(protect);

router.get('/', storyController.getStories);

router.get('/my', roleCheck(['alumni', 'student']), storyController.getMyStories);
router.post('/', roleCheck(['alumni', 'admin', 'student']), storyController.createStory);
router.put('/:id/like', storyController.likeStory);
router.delete('/:id', roleCheck(['alumni', 'admin', 'student']), storyController.deleteStory);

module.exports = router;
