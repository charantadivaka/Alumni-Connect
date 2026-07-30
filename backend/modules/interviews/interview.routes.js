'use strict';

const express = require('express');
const router = express.Router();
const interviewController = require('./interview.controller');
const { protect, roleCheck } = require('../../middleware/authMiddleware');

router.use(protect);

router.post('/', roleCheck(['student']), interviewController.bookInterview);
router.get('/my', interviewController.getMyInterviews);
router.put('/:id/respond', roleCheck(['alumni']), interviewController.respondInterview);
router.put('/:id/feedback', roleCheck(['alumni']), interviewController.submitFeedback);

module.exports = router;
