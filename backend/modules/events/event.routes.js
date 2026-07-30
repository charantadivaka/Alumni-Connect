'use strict';

const express = require('express');
const router = express.Router();
const eventController = require('./event.controller');
const { protect } = require('../../middleware/authMiddleware');
const validate = require('../../middleware/validate');

router.get('/', eventController.getEvents); // Public for browsing

router.use(protect);
router.post('/', validate.validateCreateEvent, eventController.createEvent);
router.put('/:id/rsvp', eventController.rsvpEvent);
router.delete('/:id', eventController.deleteEvent);
router.post('/:id/report', eventController.reportEvent);

module.exports = router;
