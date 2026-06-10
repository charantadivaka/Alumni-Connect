const router = require('express').Router();
const { bookInterview, getMyInterviews, respondInterview, submitFeedback } = require('../controllers/interviewController');
const { protect } = require('../middleware/authMiddleware');
const { restrict } = require('../middleware/roleMiddleware');

router.post('/',              protect, restrict('student'), bookInterview);
router.get('/my',             protect, getMyInterviews);
router.put('/:id/respond',    protect, restrict('alumni'), respondInterview);
router.put('/:id/feedback',   protect, restrict('alumni'), submitFeedback);

module.exports = router;
