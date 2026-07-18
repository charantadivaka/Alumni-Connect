const router = require('express').Router();
const { getAllEvents, createEvent, rsvpEvent, deleteEvent, reportEvent } = require('../controllers/eventController');
const { protect } = require('../middleware/authMiddleware');
const { restrict } = require('../middleware/roleMiddleware');
const { cacheMiddleware } = require('../config/redis');

router.get('/', protect, cacheMiddleware(30), getAllEvents);
router.post('/', protect, restrict('student', 'alumni', 'admin'), createEvent);
router.put('/:id/rsvp', protect, rsvpEvent);
router.put('/:id/report', protect, reportEvent);
router.delete('/:id', protect, deleteEvent);

module.exports = router;
