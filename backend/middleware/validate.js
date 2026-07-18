const { body, validationResult } = require('express-validator');

/**
 * Middleware that reads express-validator errors and returns a 400 if any exist.
 */
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const firstError = errors.array()[0];
        return res.status(400).json({ message: firstError.msg, errors: errors.array() });
    }
    next();
};

// ── Rule Sets ─────────────────────────────────────────────────────────────────

const validateLogin = [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
    handleValidationErrors,
];

const validateSendOtp = [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2–100 characters'),
    body('password')
        .isLength({ min: 6, max: 128 })
        .withMessage('Password must be 6–128 characters'),
    body('role').isIn(['student', 'alumni']).withMessage('Role must be student or alumni'),
    handleValidationErrors,
];

const validateForgotPassword = [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    handleValidationErrors,
];

const validateResetPassword = [
    body('token').notEmpty().withMessage('Reset token is required'),
    body('password')
        .isLength({ min: 6, max: 128 })
        .withMessage('New password must be 6–128 characters'),
    handleValidationErrors,
];

const validateChangePassword = [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword')
        .isLength({ min: 6, max: 128 })
        .withMessage('New password must be 6–128 characters'),
    handleValidationErrors,
];

const validateCreateJob = [
    body('title').trim().isLength({ min: 3, max: 200 }).withMessage('Job title must be 3–200 characters'),
    body('company').trim().isLength({ min: 1, max: 200 }).withMessage('Company name is required'),
    body('description').trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
    body('jobType')
        .optional()
        .isIn(['Full-time', 'Part-time', 'Internship', 'Contract', 'Remote'])
        .withMessage('Invalid job type'),
    handleValidationErrors,
];

const validateRequestSession = [
    body('alumniId').isMongoId().withMessage('Valid alumni ID is required'),
    body('topic').trim().isLength({ min: 3, max: 300 }).withMessage('Topic must be 3–300 characters'),
    handleValidationErrors,
];

const validateCreateThread = [
    body('title').trim().isLength({ min: 3, max: 300 }).withMessage('Thread title must be 3–300 characters'),
    body('content').trim().isLength({ min: 10 }).withMessage('Content must be at least 10 characters'),
    handleValidationErrors,
];

const validateCreateEvent = [
    body('title').trim().isLength({ min: 3, max: 200 }).withMessage('Event title must be 3–200 characters'),
    body('description').trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
    body('date').isISO8601().toDate().withMessage('Valid event date is required'),
    handleValidationErrors,
];

const validateCreateStory = [
    body('title').trim().isLength({ min: 3, max: 200 }).withMessage('Story title must be 3–200 characters'),
    body('content').trim().isLength({ min: 30 }).withMessage('Story content must be at least 30 characters'),
    handleValidationErrors,
];

module.exports = {
    handleValidationErrors,
    validateLogin,
    validateSendOtp,
    validateForgotPassword,
    validateResetPassword,
    validateChangePassword,
    validateCreateJob,
    validateRequestSession,
    validateCreateThread,
    validateCreateEvent,
    validateCreateStory,
};
