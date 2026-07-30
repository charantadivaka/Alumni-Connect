'use strict';

/**
 * Payment Service
 * ───────────────
 * Business logic for Razorpay integrations (College Registration).
 */

const Razorpay = require('razorpay');
const crypto = require('crypto');
const College = require('../../models/College');
const { razorpay: rzpConfig } = require('../../shared/config');

// Platform fee: ₹50,000/year (Razorpay amount is in paise, 1 INR = 100 paise)
const PLATFORM_FEE_INR = 50000;
const PLATFORM_FEE_PAISE = PLATFORM_FEE_INR * 100;

let razorpay = null;
if (rzpConfig.isConfigured) {
    razorpay = new Razorpay({
        key_id: rzpConfig.keyId,
        key_secret: rzpConfig.keySecret,
    });
}

/** Safely compile a regex from a stored string */
const compilePattern = (patternStr) => {
    try {
        return new RegExp(patternStr);
    } catch {
        return null;
    }
};

/**
 * Create a Razorpay order for college registration.
 */
const createOrder = async (data) => {
    if (!razorpay) throw Object.assign(new Error('Razorpay is not configured'), { statusCode: 500 });

    const { collegeName, rollNumberPattern, exampleFormat, registrantEmail } = data;

    const compiled = compilePattern(rollNumberPattern);
    if (!compiled) {
        throw Object.assign(new Error('Invalid regex pattern. Please check the syntax.'), { statusCode: 400 });
    }
    if (!compiled.test(exampleFormat)) {
        throw Object.assign(new Error('The example format does not match the provided regex pattern.'), { statusCode: 400 });
    }

    const escapedName = collegeName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const exists = await College.findOne({ name: { $regex: new RegExp(`^${escapedName}$`, 'i') } });
    if (exists) {
        throw Object.assign(new Error('A college with this name is already registered.'), { statusCode: 400 });
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

    return {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: rzpConfig.keyId,
    };
};

/**
 * Verify Razorpay payment and register the college.
 */
const verifyPaymentAndRegister = async (data) => {
    const {
        razorpay_order_id, razorpay_payment_id, razorpay_signature,
        collegeName, rollNumberPattern, exampleFormat,
        patternDescription, registrantEmail,
    } = data;

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
        .createHmac('sha256', rzpConfig.keySecret)
        .update(body)
        .digest('hex');

    if (expectedSignature !== razorpay_signature) {
        throw Object.assign(new Error('Payment verification failed. Invalid signature.'), { statusCode: 400 });
    }

    const compiled = compilePattern(rollNumberPattern);
    if (!compiled || !compiled.test(exampleFormat)) {
        throw Object.assign(new Error('College data validation failed after payment.'), { statusCode: 400 });
    }

    const escapedName = collegeName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const exists = await College.findOne({ name: { $regex: new RegExp(`^${escapedName}$`, 'i') } });
    if (exists) {
        throw Object.assign(new Error('A college with this name is already registered.'), { statusCode: 400 });
    }

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

    return college;
};

module.exports = { createOrder, verifyPaymentAndRegister };
