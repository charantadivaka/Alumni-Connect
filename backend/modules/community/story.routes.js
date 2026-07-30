'use strict';

const express = require('express');
const router = express.Router();
const storyController = require('./story.controller');
const { protect, roleCheck } = require('../../middleware/authMiddleware');

router.get('/', storyController.getStories); // Public browsing

router.use(protect);
router.get('/my', roleCheck(['alumni']), storyController.getMyStories);
router.post('/', roleCheck(['alumni', 'admin']), storyController.createStory);
router.put('/:id/like', storyController.likeStory);
router.delete('/:id', roleCheck(['alumni', 'admin']), storyController.deleteStory);

module.exports = router;
