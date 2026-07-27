const Razorpay = require('razorpay');
const crypto = require('crypto');
const College = require('../models/College');

// ── Helper: safely compile a regex from a stored string ──────────────────────
const compilePattern = (patternStr) => {
    try {
        return new RegExp(patternStr);
    } catch {
        return null;
    }
};

// ── Razorpay instance ─────────────────────────────────────────────────────────
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Platform fee: ₹50,000/year (Razorpay amount is in paise, 1 INR = 100 paise)
const PLATFORM_FEE_INR = 50000;
const PLATFORM_FEE_PAISE = PLATFORM_FEE_INR * 100;

// @desc  Create a Razorpay order for ₹50,000 college registration fee
// @route POST /api/payments/create-order
const createOrder = async (req, res) => {
    try {
        const { collegeName, rollNumberPattern, exampleFormat, patternDescription, registrantEmail } = req.body;

        if (!collegeName || !rollNumberPattern || !exampleFormat) {
            return res.status(400).json({ message: 'College name, roll number pattern, and example format are required.' });
        }

        // Validate regex before charging
        const compiled = compilePattern(rollNumberPattern);
        if (!compiled) {
            return res.status(400).json({ message: 'Invalid regex pattern. Please check the syntax.' });
        }
        if (!compiled.test(exampleFormat)) {
            return res.status(400).json({ message: 'The example format does not match the provided regex pattern.' });
        }

        // Check for duplicate college name (case-insensitive, regex-safe)
        const escapedName = collegeName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const exists = await College.findOne({ name: { $regex: new RegExp(`^${escapedName}$`, 'i') } });
        if (exists) {
            return res.status(400).json({ message: 'A college with this name is already registered.' });
        }

        const options = {
            amount: PLATFORM_FEE_PAISE,
            currency: 'INR',
            receipt: `college_${Date.now()}`,
            notes: {
                collegeName: collegeName.trim(),
                registrantEmail: registrantEmail || '',
            },
        };

        const order = await razorpay.orders.create(options);

        res.json({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            keyId: process.env.RAZORPAY_KEY_ID,
        });
    } catch (err) {
        console.error('[Payment] createOrder error:', err);
        res.status(500).json({ message: 'Failed to create payment order. Please try again.' });
    }
};

// @desc  Verify Razorpay payment and register the college
// @route POST /api/payments/verify
const verifyPayment = async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            collegeName,
            rollNumberPattern,
            exampleFormat,
            patternDescription,
            registrantEmail,
        } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ message: 'Payment verification data is incomplete.' });
        }

        // ── HMAC Signature Verification ────────────────────────────────────────
        const body = `${razorpay_order_id}|${razorpay_payment_id}`;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({ message: 'Payment verification failed. Invalid signature.' });
        }

        // ── Validate data once more before saving ──────────────────────────────
        const compiled = compilePattern(rollNumberPattern);
        if (!compiled || !compiled.test(exampleFormat)) {
            return res.status(400).json({ message: 'College data validation failed after payment.' });
        }

        // Double-check duplicate (race condition guard)
        const escapedName2 = collegeName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const exists = await College.findOne({ name: { $regex: new RegExp(`^${escapedName2}$`, 'i') } });
        if (exists) {
            return res.status(400).json({ message: 'A college with this name is already registered.' });
        }

        // ── Create the college record ──────────────────────────────────────────
        const feePaidUntil = new Date();
        feePaidUntil.setFullYear(feePaidUntil.getFullYear() + 1);

        const college = await College.create({
            name: collegeName.trim(),
            rollNumberPattern,
            exampleFormat,
            patternDescription: patternDescription || '',
            registrantEmail: registrantEmail || '',
            isActive: true,
            feesPaid: true,
            feePaidUntil,
            razorpayOrderId: razorpay_order_id,
            razorpayPaymentId: razorpay_payment_id,
        });

        console.log(`✅ [Payment] College registered: ${college.name} | Payment: ${razorpay_payment_id}`);

        res.status(201).json({
            message: 'Payment verified and college registered successfully!',
            college: {
                id: college._id,
                name: college.name,
                feePaidUntil: college.feePaidUntil,
            },
        });
    } catch (err) {
        console.error('[Payment] verifyPayment error:', err);
        if (err.code === 11000) {
            return res.status(400).json({ message: 'A college with this name already exists.' });
        }
        res.status(500).json({ message: 'Failed to register college after payment. Contact support with your payment ID.' });
    }
};

module.exports = { createOrder, verifyPayment };
