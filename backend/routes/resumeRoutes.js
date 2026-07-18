const router = require('express').Router();
const { uploadResume, getMyResumes, getResumeById, setDefault, deleteResume } = require('../controllers/resumeController');
const { protect } = require('../middleware/authMiddleware');
const { restrict } = require('../middleware/roleMiddleware');

router.post('/',             protect, restrict('student'), uploadResume);
router.get('/my',            protect, restrict('student'), getMyResumes);
router.get('/:id',           protect, getResumeById);
router.put('/:id/default',   protect, restrict('student'), setDefault);
router.delete('/:id',        protect, restrict('student'), deleteResume);

module.exports = router;
