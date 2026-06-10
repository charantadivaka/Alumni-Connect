const router = require('express').Router();
const { requestReferral, getMyReferrals, respondReferral } = require('../controllers/referralController');
const { protect } = require('../middleware/authMiddleware');
const { restrict } = require('../middleware/roleMiddleware');

router.post('/', protect, restrict('student'), requestReferral);
router.get('/my', protect, getMyReferrals);
router.put('/:id/respond', protect, restrict('alumni'), respondReferral);

module.exports = router;