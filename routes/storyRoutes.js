const router = require('express').Router();
const { getStories, getMyStories, createStory, likeStory, deleteStory } = require('../controllers/storyController');
const { protect } = require('../middleware/authMiddleware');
const { restrict } = require('../middleware/roleMiddleware');
const { cacheMiddleware } = require('../config/redis');

router.get('/',          protect, cacheMiddleware(30), getStories);
router.get('/my',        protect, restrict('alumni'), getMyStories);
router.post('/',         protect, restrict('alumni'), createStory);
router.put('/:id/like',  protect, likeStory);
router.delete('/:id',    protect, deleteStory);

module.exports = router;
