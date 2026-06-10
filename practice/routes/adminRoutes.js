const router = require('express').Router();
const { getAllUsers, getVerificationQueue, verifyAlumni, toggleSuspend, getAnalytics } = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { restrict } = require('../middleware/roleMiddleware');

router.get('/users', protect, restrict('admin'), getAllUsers);
router.get('/verification-queue', protect, restrict('admin'), getVerificationQueue);
router.put('/users/:id/verify', protect, restrict('admin'), verifyAlumni);
router.put('/users/:id/suspend', protect, restrict('admin'), toggleSuspend);
router.get('/analytics', protect, restrict('admin'), getAnalytics);

module.exports = router;