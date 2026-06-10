const router = require('express').Router();
const { getAllJobs, getJobById, createJob, updateJob, deleteJob, getMyJobs, toggleJobStatus } = require('../controllers/jobController');
const { protect } = require('../middleware/authMiddleware');
const { restrict } = require('../middleware/roleMiddleware');

router.get('/', protect, getAllJobs);
router.get('/my', protect, restrict('alumni'), getMyJobs);
router.get('/:id', protect, getJobById);
router.post('/', protect, restrict('alumni'), createJob);
router.put('/:id', protect, restrict('alumni'), updateJob);
router.put('/:id/toggle', protect, restrict('alumni'), toggleJobStatus);
router.delete('/:id', protect, deleteJob);

module.exports = router;
