const router = require('express').Router();
const { getAllEvents, createEvent, rsvpEvent, deleteEvent } = require('../controllers/eventController');
const { protect } = require('../middleware/authMiddleware');
const { restrict } = require('../middleware/roleMiddleware');

router.get('/', protect, getAllEvents);
router.post('/', protect, restrict('alumni', 'admin'), createEvent);
router.put('/:id/rsvp', protect, rsvpEvent);
router.delete('/:id', protect, deleteEvent);

module.exports = router;
