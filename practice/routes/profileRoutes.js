const router = require('express').Router();
const { getMyProfile, getProfileById, updateProfile, uploadPicture } = require('../controllers/profileController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getMyProfile);
router.get('/:id', protect, getProfileById);
router.put('/', protect, updateProfile);
router.post('/picture', protect, uploadPicture);

module.exports = router;