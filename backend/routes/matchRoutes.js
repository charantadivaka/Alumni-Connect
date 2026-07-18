const router = require('express').Router();
const { getMatches, getDirectory, getAlumniById } = require('../controllers/matchController');
const { protect } = require('../middleware/authMiddleware');
const { restrict } = require('../middleware/roleMiddleware');
const { cacheMiddleware } = require('../config/redis');

router.get('/',            protect, restrict('student', 'alumni'), cacheMiddleware(60), getMatches);
router.get('/directory',   protect, cacheMiddleware(120), getDirectory);
router.get('/:id',         protect, getAlumniById);

module.exports = router;
