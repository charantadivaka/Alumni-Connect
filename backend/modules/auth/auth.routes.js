'use strict';

const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const { protect } = require('../../middleware/authMiddleware');
const validate = require('../../middleware/validate');

// Public routes
router.post('/register', validate.validateSendOtp, authController.register); // Legacy
router.post('/send-otp', validate.validateSendOtp, authController.sendOtp);
router.post('/verify-otp', authController.verifyOtp);
router.post('/resend-otp', authController.resendOtp);
router.post('/login', validate.validateLogin, authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.post('/admin/login', authController.adminLogin);
router.post('/logout', authController.logout);
router.get('/me', protect, authController.getMe);          // session check

// Protected routes
router.put('/change-password', protect, validate.validateChangePassword, authController.changePassword);

module.exports = router;
