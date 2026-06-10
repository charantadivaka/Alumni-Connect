const router = require('express').Router();
const { applyJob, getMyApplications, getJobApplications, getAlumniApplications, updateStage, withdrawApplication } = require('../controllers/applicationController');
const { protect } = require('../middleware/authMiddleware');
const { restrict } = require('../middleware/roleMiddleware');

router.post('/',                protect, restrict('student'), applyJob);
router.get('/my',               protect, restrict('student'), getMyApplications);
router.get('/alumni',           protect, restrict('alumni'), getAlumniApplications);
router.get('/job/:jobId',       protect, restrict('alumni'), getJobApplications);
router.put('/:id/stage',        protect, restrict('alumni'), updateStage);
router.delete('/:id',           protect, restrict('student'), withdrawApplication);

module.exports = router;
