const router = require('express').Router();
const { requestSession, getMySessions, respondSession, completeSession, submitFeedback } = require('../controllers/mentorshipController');
const { protect } = require('../middleware/authMiddleware');
const { restrict } = require('../middleware/roleMiddleware');

router.post('/', protect, restrict('student'), requestSession);
router.get('/my', protect, getMySessions);
router.put('/:id/respond', protect, restrict('alumni'), respondSession);
router.put('/:id/complete', protect, restrict('alumni'), completeSession);
router.put('/:id/feedback', protect, restrict('student'), submitFeedback);

module.exports = router;