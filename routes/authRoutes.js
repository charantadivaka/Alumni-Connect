const router = require('express').Router();
const { register, login, logout, getMe, changePassword, adminLogin, sendOtp, verifyOtp, resendOtp } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register',      register);       // legacy (kept for compat)
router.post('/send-otp',      sendOtp);        // Step 1: validate + send OTP
router.post('/verify-otp',    verifyOtp);      // Step 2: verify OTP + create user
router.post('/resend-otp',    resendOtp);      // Resend fresh OTP
router.post('/login',         login);
router.post('/admin-login',   adminLogin);
router.post('/logout',        logout);
router.get('/me',             protect, getMe);
router.put('/change-password',protect, changePassword);


module.exports = router;
