const router = require('express').Router();
const { getThreads, getConversation, saveMessage, markRead } = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

router.get('/threads',       protect, getThreads);
router.get('/:userId',       protect, getConversation);
router.post('/',             protect, saveMessage);
router.put('/:userId/read',  protect, markRead);

module.exports = router;
