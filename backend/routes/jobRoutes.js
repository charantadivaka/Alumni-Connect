const router = require('express').Router();
const { getAllJobs, getJobById, createJob, updateJob, deleteJob, getMyJobs, toggleJobStatus, reportJob } = require('../controllers/jobController');
const { protect } = require('../middleware/authMiddleware');
const { restrict } = require('../middleware/roleMiddleware');
const { cacheMiddleware } = require('../config/redis');

router.get('/',          protect, cacheMiddleware(30), getAllJobs);
router.get('/my',        protect, restrict('alumni'), getMyJobs);
router.get('/:id',       protect, getJobById);
router.post('/',         protect, restrict('alumni'), createJob);
router.put('/:id',       protect, restrict('alumni'), updateJob);
router.put('/:id/toggle', protect, restrict('alumni'), toggleJobStatus);
router.put('/:id/report', protect, reportJob);
router.delete('/:id',    protect, deleteJob);

module.exports = router;
