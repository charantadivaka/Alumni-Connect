const router = require('express').Router();
const { getMyProfile, getProfileById, updateProfile, uploadPicture, deleteAccount } = require('../controllers/profileController');
const { protect } = require('../middleware/authMiddleware');

router.get('/',       protect, getMyProfile);
router.get('/:id',    protect, getProfileById);
router.put('/',       protect, updateProfile);
router.put('/picture', protect, uploadPicture);
router.delete('/me',   protect, deleteAccount);

module.exports = router;
