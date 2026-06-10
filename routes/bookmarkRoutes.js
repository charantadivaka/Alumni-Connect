const router = require('express').Router();
const { toggleBookmark, getBookmarks } = require('../controllers/bookmarkController');
const { protect } = require('../middleware/authMiddleware');

router.get('/',   protect, getBookmarks);
router.post('/',  protect, toggleBookmark);

module.exports = router;
