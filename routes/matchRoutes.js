const router = require('express').Router();
const { getMatches, getDirectory, getAlumniById } = require('../controllers/matchController');
const { protect } = require('../middleware/authMiddleware');
const { restrict } = require('../middleware/roleMiddleware');

router.get('/',            protect, restrict('student'), getMatches);
router.get('/directory',   protect, getDirectory);
router.get('/:id',         protect, getAlumniById);

module.exports = router;
