const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const { createOrder, verifyPayment } = require('../controllers/paymentController');

// Strict rate limit for payment routes — prevents payment-order spam
const paymentLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    message: { message: 'Too many payment requests. Please wait 15 minutes before trying again.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Public routes — no auth required (college admin registers their own institution)
// POST /api/payments/create-order → create Razorpay order for ₹50,000 fee
router.post('/create-order', paymentLimiter, createOrder);

// POST /api/payments/verify → verify payment signature & register college
router.post('/verify', paymentLimiter, verifyPayment);

module.exports = router;
