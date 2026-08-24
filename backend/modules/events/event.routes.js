'use strict';

const express = require('express');
const router = express.Router();
const eventController = require('./event.controller');
const { protect } = require('../../middleware/authMiddleware');
const validate = require('../../middleware/validate');

router.use(protect);

router.get('/', eventController.getEvents); // Now protected

router.post('/', validate.validateCreateEvent, eventController.createEvent);
router.put('/:id', eventController.updateEvent);
router.put('/:id/rsvp', eventController.rsvpEvent);
router.delete('/:id', eventController.deleteEvent);
router.post('/:id/report', eventController.reportEvent);

module.exports = router;
