'use strict';

const express = require('express');
const router = express.Router();
const adminController = require('./admin.controller');
const { protect, roleCheck } = require('../../middleware/authMiddleware');
const { cacheMiddleware } = require('../../config/redis');

router.use(protect);
router.use(roleCheck(['admin']));

router.get('/users', adminController.getAllUsers);
router.get('/verifications', adminController.getVerificationQueue);
router.put('/users/:id/verify', adminController.verifyAlumni);
router.put('/users/:id/suspend', adminController.toggleSuspend);
router.get('/analytics', cacheMiddleware(600), adminController.getAnalytics);
router.get('/growth', adminController.getUserGrowth);
router.get('/reports/jobs', adminController.getReportedJobs);
router.get('/reports/events', adminController.getReportedEvents);
router.post('/reports/:type/:id/:reportId/resolve', adminController.resolveReport);

module.exports = router;
