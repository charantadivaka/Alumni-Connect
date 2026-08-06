'use strict';

/**
 * Auth Service
 * ─────────────
 * All authentication business logic lives here.
 * The controller only validates input and calls these functions.
 *
 * Responsibilities:
 *  - OTP generation, storage, retrieval, deletion (Redis-backed with in-memory fallback)
 *  - User registration (post-OTP verification)
 *  - Login credential checking
 *  - Password management (change, forgot, reset)
 *  - Admin login / auto-creation
 */

const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const User = require('../../models/User');
const College = require('../../models/College');
const PasswordReset = require('../../models/PasswordReset');
const { sendOtpEmail, sendPasswordResetEmail } = require('../../utils/emailService');
const { jwt: jwtConfig, admin: adminConfig, server: serverConfig } = require('../../shared/config');

// ── OTP Storage (Redis preferred, in-memory fallback) ────────────────────────
let redisClient = null;
try {
    const { redisClient: rc } = require('../../config/redis');
    if (rc && !rc.isDummy) redisClient = rc;
} catch { /* Redis unavailable — fallback to in-memory */ }

const otpStore    = new Map();       // email → { otp, userData, expiresAt }
const OTP_TTL_MS  = 10 * 60 * 1000; // 10 minutes

/** Generate a cryptographically safe 6-digit OTP */
const generateOtp = () => String(crypto.randomInt(100000, 999999));

/** Remove expired OTP records from the in-memory store */
const purgeExpiredOtps = () => {
    const now = Date.now();
    for (const [key, val] of otpStore.entries()) {
        if (val.expiresAt < now) otpStore.delete(key);
    }
};

/** Persist OTP — prefers Redis (TTL handled by Redis), falls back to Map */
const storeOtp = async (email, record) => {
    if (redisClient && !redisClient.isDummy) {
        await redisClient.setex(`otp:${email}`, 600, JSON.stringify(record));
    } else {
        otpStore.set(email, { ...record, expiresAt: Date.now() + OTP_TTL_MS });
    }
};

/** Retrieve OTP record */
const getOtp = async (email) => {
    if (redisClient && !redisClient.isDummy) {
        const raw = await redisClient.get(`otp:${email}`);
        return raw ? JSON.parse(raw) : null;
    }
    return otpStore.get(email) || null;
};

/** Delete OTP record after use */
const deleteOtp = async (email) => {
    if (redisClient && !redisClient.isDummy) {
        await redisClient.del(`otp:${email}`);
    } else {
        otpStore.delete(email);
    }
};

/** Update OTP record for resend — returns false if session expired */
const updateOtp = async (email, newOtp) => {
    const record = await getOtp(email);
    if (!record) return false;
    record.otp        = newOtp;
    record.expiresAt  = Date.now() + OTP_TTL_MS;
    await storeOtp(email, record);
    return record;
};

// ── Public service methods ────────────────────────────────────────────────────

/**
 * Step 1 of registration.
 * Validates uniqueness of email/roll number, checks college roll pattern,
 * generates OTP, stores registration data, sends OTP email.
 */
const initiateSendOtp = async (data) => {
    purgeExpiredOtps();

    const {
        name, email, password, role, collegeRollNumber, college: collegeId,
        skills, department, graduationYear, company, designation,
        industry, linkedin, bio, idProof, currentYear, gpa,
    } = data;

    // Uniqueness checks
    const existingEmail = await User.findOne({ email });
    if (existingEmail) throw Object.assign(new Error('Email already registered'), { statusCode: 400 });

    if (collegeRollNumber) {
        const existingRoll = await User.findOne({ collegeRollNumber });
        if (existingRoll) throw Object.assign(new Error('Roll number already registered'), { statusCode: 400 });
    }

    // College roll-number pattern validation
    if (collegeId && collegeRollNumber) {
        const collegeDoc = await College.findById(collegeId);
        if (!collegeDoc) throw Object.assign(new Error('Selected college not found'), { statusCode: 400 });

        try {
            const pattern = new RegExp(collegeDoc.rollNumberPattern);
            if (!pattern.test(collegeRollNumber.trim())) {
                throw Object.assign(
                    new Error(`Invalid roll number format for ${collegeDoc.name}. Expected: ${collegeDoc.exampleFormat}`),
                    { statusCode: 400 }
                );
            }
        } catch (err) {
            // Re-throw structured errors, ignore malformed pattern errors
            if (err.statusCode) throw err;
            console.error(`[AuthService] Malformed rollNumberPattern for college ${collegeId}`);
        }
    }

    const otp = generateOtp();
    const userData = {
        name, email, password, role, collegeRollNumber,
        college: collegeId || null,
        skills:  skills || [],
        department, bio,
        ...(role === 'alumni' && { graduationYear, company, designation, industry, linkedin, idProof, profilePicture: idProof }),
        ...(role === 'student' && { currentYear, gpa }),
    };

    await storeOtp(email, { otp, userData });
    await sendOtpEmail(email, otp, name);

    return { email };
};

/**
 * Step 2 of registration.
 * Verifies OTP, creates user in DB, returns user document.
 */
const verifyAndCreateUser = async (email, otp) => {
    const record = await getOtp(email);

    if (!record) {
        throw Object.assign(
            new Error('No OTP found for this email. Please register again.'),
            { statusCode: 400 }
        );
    }

    // In-memory fallback: check manual expiry
    if (record.expiresAt && Date.now() > record.expiresAt) {
        await deleteOtp(email);
        throw Object.assign(new Error('OTP has expired. Please register again.'), { statusCode: 400 });
    }

    if (record.otp !== String(otp).trim()) {
        throw Object.assign(new Error('Incorrect OTP. Please try again.'), { statusCode: 400 });
    }

    const { userData } = record;
    await deleteOtp(email);

    // Final duplicate check (edge case: registered between OTP send and verify)
    const existingEmail = await User.findOne({ email: userData.email });
    if (existingEmail) {
        throw Object.assign(new Error('Email already registered'), { statusCode: 400 });
    }

    const user = await User.create({ ...userData, isEmailVerified: true });
    return user;
};

/**
 * Resend OTP for a pending registration session.
 * Returns the updated record or false if session expired.
 */
const resendOtp = async (email) => {
    const otp     = generateOtp();
    const updated = await updateOtp(email, otp);
    if (!updated) return null;

    await sendOtpEmail(email, otp, updated.userData?.name || 'there');
    return updated;
};

/**
 * Legacy direct registration (no OTP step).
 * Kept for backward compat with POST /api/auth/register.
 */
const registerDirectly = async (data) => {
    const {
        name, email, password, role, collegeRollNumber, college: collegeId,
        skills, department, graduationYear, company, designation,
        industry, linkedin, bio, idProof, currentYear, gpa,
    } = data;

    if (!['student', 'alumni'].includes(role)) {
        throw Object.assign(new Error('Role must be student or alumni'), { statusCode: 400 });
    }

    const existingEmail = await User.findOne({ email });
    if (existingEmail) throw Object.assign(new Error('Email already registered'), { statusCode: 400 });

    if (collegeRollNumber) {
        const existingRoll = await User.findOne({ collegeRollNumber });
        if (existingRoll) throw Object.assign(new Error('Roll number already registered'), { statusCode: 400 });
    }

    if (collegeId) {
        const collegeDoc = await College.findById(collegeId);
        if (!collegeDoc) throw Object.assign(new Error('Selected college not found'), { statusCode: 400 });

        try {
            const pattern = new RegExp(collegeDoc.rollNumberPattern);
            if (collegeRollNumber && !pattern.test(collegeRollNumber.trim())) {
                throw Object.assign(
                    new Error(`Invalid roll number format for ${collegeDoc.name}. Expected: ${collegeDoc.exampleFormat}`),
                    { statusCode: 400 }
                );
            }
        } catch (err) {
            if (err.statusCode) throw err;
            console.error(`[AuthService] Malformed rollNumberPattern for college ${collegeId}`);
        }
    }

    const user = await User.create({
        name, email, password, role, collegeRollNumber,
        college: collegeId || null,
        skills:  skills || [],
        department, bio,
        ...(role === 'alumni' && { graduationYear, company, designation, industry, linkedin, idProof, profilePicture: idProof }),
        ...(role === 'student' && { currentYear, gpa }),
    });

    return user;
};

/**
 * Validate login credentials and return the user document.
 * Throws if credentials are wrong or account is suspended.
 */
const loginUser = async (email, password) => {
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
        throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 });
    }

    if (user.isSuspended) {
        throw Object.assign(new Error('Account suspended'), { statusCode: 403 });
    }

    return user;
};

/**
 * Change password for an authenticated user.
 */
const changePassword = async (userId, currentPassword, newPassword) => {
    const user = await User.findById(userId).select('+password');
    if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });

    if (!(await user.comparePassword(currentPassword))) {
        throw Object.assign(new Error('Current password incorrect'), { statusCode: 400 });
    }

    user.password = newPassword;
    await user.save();
};

/**
 * Initiate a forgot-password flow: generate token, store hash, send email.
 * Always "succeeds" from the caller's perspective (prevents email enumeration).
 */
const initiateForgotPassword = async (email) => {
    const user = await User.findOne({ email });
    if (!user) return; // silent no-op — prevents enumeration

    const rawToken   = crypto.randomBytes(32).toString('hex');
    const tokenHash  = crypto.createHash('sha256').update(rawToken).digest('hex');

    await PasswordReset.deleteMany({ userId: user._id });
    await PasswordReset.create({
        userId:    user._id,
        tokenHash,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    });

    const resetLink = `${serverConfig.clientUrl}/reset-password?token=${rawToken}`;
    await sendPasswordResetEmail(user.email, resetLink, user.name);
};

/**
 * Complete password reset using the token from the email link.
 */
const resetPassword = async (token, newPassword) => {
    const tokenHash   = crypto.createHash('sha256').update(token).digest('hex');
    const resetRecord = await PasswordReset.findOne({
        tokenHash,
        expiresAt: { $gt: new Date() },
    });

    if (!resetRecord) {
        throw Object.assign(
            new Error('Invalid or expired reset link. Please request a new one.'),
            { statusCode: 400 }
        );
    }

    const user = await User.findById(resetRecord.userId);
    if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });

    user.password = newPassword;
    await user.save();
    await PasswordReset.deleteMany({ userId: user._id });
};

/**
 * Admin login — validates hardcoded credentials, auto-creates admin user if missing.
 */
const loginAdmin = async (username, password) => {
    if (!adminConfig.passwordHash) {
        throw Object.assign(new Error('Admin login disabled: ADMIN_PASSWORD_HASH not configured'), { statusCode: 500 });
    }
    const isMatch = await bcrypt.compare(password, adminConfig.passwordHash);
    if (username !== adminConfig.username || !isMatch) {
        throw Object.assign(new Error('Invalid Admin credentials'), { statusCode: 401 });
    }

    let admin = await User.findOne({ email: adminConfig.email });
    if (!admin) {
        admin = await User.create({
            name:              'System Admin',
            email:             adminConfig.email,
            password:          password, // Mongoose pre-save hook will hash this for DB storage
            role:              'admin',
            collegeRollNumber: 'ADMIN001',
        });
    }

    return admin;
};

module.exports = {
    initiateSendOtp,
    verifyAndCreateUser,
    resendOtp,
    registerDirectly,
    loginUser,
    changePassword,
    initiateForgotPassword,
    resetPassword,
    loginAdmin,
};
