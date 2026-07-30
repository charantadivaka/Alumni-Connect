'use strict';

const express = require('express');
const router = express.Router();
const profileController = require('./profile.controller');
const { protect } = require('../../middleware/authMiddleware');
const validate = require('../../middleware/validate');

router.use(protect);

router.get('/my-profile', profileController.getMyProfile);
router.get('/:id', profileController.getProfileById);
router.put('/', profileController.updateProfile);
router.post('/upload-picture', profileController.uploadProfilePicture);
router.delete('/', profileController.deleteAccount);

module.exports = router;
