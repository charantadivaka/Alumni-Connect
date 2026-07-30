'use strict';

const express = require('express');
const router = express.Router();
const jobController = require('./job.controller');
const { protect, roleCheck } = require('../../middleware/authMiddleware');
const validate = require('../../middleware/validate');
const { cacheMiddleware } = require('../../config/redis');

// Public endpoints (if caching, adjust accordingly)
router.get('/', cacheMiddleware(300), jobController.getJobs);
router.get('/:id', jobController.getJobById);

// Protected endpoints
router.use(protect);

router.post('/', roleCheck(['alumni', 'admin']), validate.validateCreateJob, jobController.createJob);
router.get('/my/posts', roleCheck(['alumni']), jobController.getMyJobs);
router.put('/:id', roleCheck(['alumni', 'admin']), validate.validateCreateJob, jobController.updateJob);
router.delete('/:id', roleCheck(['alumni', 'admin']), jobController.deleteJob);
router.put('/:id/toggle-status', roleCheck(['alumni', 'admin']), jobController.toggleJobStatus);
router.post('/:id/report', jobController.reportJob);

module.exports = router;
