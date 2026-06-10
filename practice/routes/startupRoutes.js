const router = require('express').Router();
const { getStartups, getMyStartup, createOrUpdateStartup, requestCollaboration, respondCollaboration } = require('../controllers/startupController');
const { protect } = require('../middleware/authMiddleware');
const { restrict } = require('../middleware/roleMiddleware');

router.get('/', protect, getStartups);
router.get('/my', protect, restrict('alumni'), getMyStartup);
router.post('/', protect, restrict('alumni'), createOrUpdateStartup);
router.post('/:id/collaborate', protect, restrict('student'), requestCollaboration);
router.put('/:id/collaborate/:reqId', protect, restrict('alumni'), respondCollaboration);

module.exports = router;