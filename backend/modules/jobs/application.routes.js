'use strict';

const express = require('express');
const router = express.Router();
const applicationController = require('./application.controller');
const { protect, roleCheck } = require('../../middleware/authMiddleware');

router.use(protect);

// Student routes
router.post('/apply', roleCheck(['student']), applicationController.applyForJob);
router.get('/my', roleCheck(['student']), applicationController.getMyApplications);
router.put('/:id/withdraw', roleCheck(['student']), applicationController.withdrawApplication);

// Alumni routes
router.get('/alumni-all', roleCheck(['alumni']), applicationController.getAlumniApplications);
router.get('/job/:jobId', roleCheck(['alumni']), applicationController.getJobApplications);
router.put('/:id/stage', roleCheck(['alumni']), applicationController.updateApplicationStage);

module.exports = router;
