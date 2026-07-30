'use strict';

const express = require('express');
const router = express.Router();
const resumeController = require('./resume.controller');
const { protect } = require('../../middleware/authMiddleware');

router.use(protect);

router.post('/', resumeController.uploadResume);
router.get('/my', resumeController.getMyResumes);
router.get('/:id', resumeController.getResumeById);
router.put('/:id/default', resumeController.setDefault);
router.delete('/:id', resumeController.deleteResume);

module.exports = router;
