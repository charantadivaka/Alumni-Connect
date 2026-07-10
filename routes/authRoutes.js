const router = require('express').Router();
const {
    register, login, logout, getMe, changePassword, adminLogin,
    sendOtp, verifyOtp, resendOtp,
    forgotPassword, resetPassword,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const {
    validateLogin,
    validateSendOtp,
    validateForgotPassword,
    validateResetPassword,
    validateChangePassword,
} = require('../middleware/validate');

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication & Registration
 */

/**
 * @swagger
 * /api/auth/send-otp:
 *   post:
 *     summary: Step 1 of registration — validate fields and send OTP
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password, role]
 *             properties:
 *               name: { type: string }
 *               email: { type: string, format: email }
 *               password: { type: string, minLength: 6 }
 *               role: { type: string, enum: [student, alumni] }
 *               college: { type: string, description: MongoDB ObjectId }
 *               collegeRollNumber: { type: string }
 *     responses:
 *       200: { description: OTP sent successfully }
 *       400: { description: Validation error or email already registered }
 */
router.post('/send-otp', validateSendOtp, sendOtp);

/**
 * @swagger
 * /api/auth/verify-otp:
 *   post:
 *     summary: Step 2 of registration — verify OTP and create user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, otp]
 *             properties:
 *               email: { type: string }
 *               otp: { type: string }
 *     responses:
 *       201: { description: User created and JWT cookie set }
 *       400: { description: Invalid or expired OTP }
 */
router.post('/verify-otp', verifyOtp);

/**
 * @swagger
 * /api/auth/resend-otp:
 *   post:
 *     summary: Resend OTP for pending registration
 *     tags: [Auth]
 *     responses:
 *       200: { description: New OTP sent }
 *       400: { description: Session expired }
 */
router.post('/resend-otp', resendOtp);

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Legacy registration (kept for backward compatibility)
 *     tags: [Auth]
 *     deprecated: true
 */
router.post('/register', register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Log in with email and password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200: { description: JWT cookie set, user profile returned }
 *       401: { description: Invalid credentials }
 *       403: { description: Account suspended }
 */
router.post('/login', validateLogin, login);

/**
 * @swagger
 * /api/auth/admin-login:
 *   post:
 *     summary: Admin login with username/password
 *     tags: [Auth]
 *     responses:
 *       200: { description: Admin JWT cookie set }
 *       401: { description: Invalid credentials }
 */
router.post('/admin-login', adminLogin);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Clear JWT cookie and log out
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Logged out successfully }
 */
router.post('/logout', logout);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current authenticated user profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: User object }
 *       401: { description: Not authenticated }
 */
router.get('/me', protect, getMe);

/**
 * @swagger
 * /api/auth/change-password:
 *   put:
 *     summary: Change password (requires current password)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Password updated }
 *       400: { description: Current password incorrect }
 */
router.put('/change-password', protect, validateChangePassword, changePassword);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request a password reset email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, format: email }
 *     responses:
 *       200: { description: Reset email sent (always returns success to prevent enumeration) }
 */
router.post('/forgot-password', validateForgotPassword, forgotPassword);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password using token from email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, password]
 *             properties:
 *               token: { type: string }
 *               password: { type: string, minLength: 6 }
 *     responses:
 *       200: { description: Password reset successfully }
 *       400: { description: Invalid or expired token }
 */
router.post('/reset-password', validateResetPassword, resetPassword);

module.exports = router;
