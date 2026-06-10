const router = require('express').Router();
const { createSlot, getMySlots, getAlumniSlots, deleteSlot } = require('../controllers/slotController');
const { protect } = require('../middleware/authMiddleware');
const { restrict } = require('../middleware/roleMiddleware');

router.post('/',                protect, restrict('alumni'), createSlot);
router.get('/my',               protect, restrict('alumni'), getMySlots);
router.get('/alumni/:alumniId', protect, getAlumniSlots);
router.delete('/:id',           protect, restrict('alumni'), deleteSlot);

module.exports = router;
