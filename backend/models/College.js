const mongoose = require('mongoose');

const collegeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    // Stored as a regex pattern string, e.g. "^S\\d{4}\\d{7}$"
    rollNumberPattern: {
        type: String,
        required: true,
        trim: true,
    },
    // Human-readable example shown to the user during registration
    exampleFormat: {
        type: String,
        required: true,
        trim: true,
    },
    // Short description / hint about the format
    patternDescription: {
        type: String,
        default: '',
        trim: true,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    // ── Fee / Payment tracking (Legacy) ──────────────────────────────────
    feesPaid: {
        type: Boolean,
        default: false,
    },
    feePaidUntil: {
        type: Date,
        default: null,
    },
    razorpayOrderId: {
        type: String,
        default: null,
    },
    razorpayPaymentId: {
        type: String,
        default: null,
    },
    
    // ── Subscription Details ─────────────────────────────────────────────
    subscriptionStatus: {
        type: String,
        enum: ['Active', 'Payment Pending', 'Expired', 'Suspended'],
        default: 'Active'
    },
    subscriptionPlan: {
        type: String,
        default: 'Standard'
    },
    subscriptionExpiry: {
        type: Date,
        default: null
    },
    subscriptionHistory: [{
        plan: String,
        amount: Number,
        status: { type: String, enum: ['Paid', 'Failed', 'Pending'] },
        paymentDate: { type: Date, default: Date.now },
        notes: String
    }],
    // Contact email of whoever registered the college
    registrantEmail: {
        type: String,
        default: '',
        trim: true,
    },
}, { timestamps: true });

module.exports = mongoose.model('College', collegeSchema);
