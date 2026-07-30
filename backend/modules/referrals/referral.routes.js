'use strict';

const express = require('express');
const router = express.Router();
const referralController = require('./referral.controller');
const { protect, roleCheck } = require('../../middleware/authMiddleware');

router.use(protect);

router.post('/', roleCheck(['student']), referralController.requestReferral);
router.get('/my', referralController.getMyReferrals);
router.put('/:id/respond', roleCheck(['alumni']), referralController.respondReferral);

module.exports = router;
