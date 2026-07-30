'use strict';

const express = require('express');
const router = express.Router();
const collegeController = require('./college.controller');
const { protect, roleCheck } = require('../../middleware/authMiddleware');

// Public endpoints
router.get('/', collegeController.getColleges);
router.post('/validate', collegeController.validateRollNumber);
router.get('/fee-status', collegeController.getCollegeFeeStatus);

// Admin endpoints
router.use(protect);
router.use(roleCheck(['admin']));
router.get('/admin', collegeController.getAllCollegesAdmin);
router.post('/admin', collegeController.createCollege);
router.put('/admin/:id', collegeController.updateCollege);
router.delete('/admin/:id', collegeController.deleteCollege);

module.exports = router;
