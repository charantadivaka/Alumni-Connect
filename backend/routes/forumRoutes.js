const router = require('express').Router();
const { getThreads, getThreadById, createThread, addReply, upvoteThread, deleteThread } = require('../controllers/forumController');
const { protect } = require('../middleware/authMiddleware');
const { cacheMiddleware } = require('../config/redis');

router.get('/',          protect, cacheMiddleware(30), getThreads);
router.get('/:id',       protect, getThreadById);
router.post('/',         protect, createThread);
router.post('/:id/reply', protect, addReply);
router.put('/:id/upvote', protect, upvoteThread);
router.delete('/:id',    protect, deleteThread);

module.exports = router;
