'use strict';

const express = require('express');
const router = express.Router();
const bookmarkController = require('./bookmark.controller');
const { protect } = require('../../middleware/authMiddleware');

router.use(protect);

router.post('/', bookmarkController.toggleBookmark);
router.get('/', bookmarkController.getBookmarks);

module.exports = router;
