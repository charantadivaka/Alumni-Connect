const router = require('express').Router();
const { getAllUsers, getVerificationQueue, verifyAlumni, toggleSuspend, getAnalytics, getReportedJobs, getReportedEvents } = require('../controllers/adminController');
const { getAuditLogs } = require('../controllers/auditLogController');
const { getAllCollegesAdmin, createCollege, updateCollege, deleteCollege } = require('../controllers/collegeController');
const { protect } = require('../middleware/authMiddleware');
const { restrict } = require('../middleware/roleMiddleware');
const { cacheMiddleware } = require('../config/redis');

router.get('/users',                   protect, restrict('admin'), getAllUsers);
router.get('/verification-queue',      protect, restrict('admin'), getVerificationQueue);
router.put('/users/:id/verify',        protect, restrict('admin'), verifyAlumni);
router.put('/users/:id/suspend',       protect, restrict('admin'), toggleSuspend);
router.get('/analytics',               protect, restrict('admin'), cacheMiddleware(60), getAnalytics);
router.get('/jobs/reported',           protect, restrict('admin'), getReportedJobs);
router.get('/events/reported',         protect, restrict('admin'), getReportedEvents);
router.get('/audit',                   protect, restrict('admin'), getAuditLogs);

// ── College Management ────────────────────────────────────────────────────────
router.get('/colleges',                protect, restrict('admin'), getAllCollegesAdmin);
router.post('/colleges',               protect, restrict('admin'), createCollege);
router.put('/colleges/:id',            protect, restrict('admin'), updateCollege);
router.delete('/colleges/:id',         protect, restrict('admin'), deleteCollege);

module.exports = router;
