'use strict';

const express = require('express');
const router = express.Router();
const mentorshipController = require('./mentorship.controller');
const { protect, roleCheck } = require('../../middleware/authMiddleware');

router.use(protect);

router.post('/', roleCheck(['student']), mentorshipController.requestSession);
router.get('/my', mentorshipController.getMySessions);
router.put('/:id/respond', roleCheck(['alumni']), mentorshipController.respondToSession);
router.put('/:id/complete', roleCheck(['alumni']), mentorshipController.completeSession);
router.put('/:id/feedback', roleCheck(['student']), mentorshipController.submitFeedback);

module.exports = router;
