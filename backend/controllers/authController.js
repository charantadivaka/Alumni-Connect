const crypto = require('crypto');
const User = require('../models/User');
const College = require('../models/College');
const PasswordReset = require('../models/PasswordReset');
const generateToken = require('../utils/generateToken');
const { sendOtpEmail, sendPasswordResetEmail } = require('../utils/emailService');

// ── Redis client (optional — gracefully falls back to in-memory) ──────────────
let redisClient = null;
try {
    const { getRedisClient } = require('../config/redis');
    redisClient = getRedisClient();
} catch {
    /* Redis not available — fall back to in-memory Map */
}

// ── In-memory OTP store (fallback when Redis is unavailable) ──────────────────
const otpStore = new Map();
const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes

/** Generate a cryptographically safe 6-digit OTP */
const generateOtp = () => String(crypto.randomInt(100000, 999999));

/** Clean up expired OTPs from in-memory store */
const purgeExpiredOtps = () => {
    const now = Date.now();
    for (const [key, val] of otpStore.entries()) {
        if (val.expiresAt < now) otpStore.delete(key);
    }
};

/** Store OTP record — prefers Redis, falls back to in-memory Map */
const storeOtp = async (email, record) => {
    if (redisClient && !redisClient.isDummy) {
        await redisClient.setex(`otp:${email}`, 600, JSON.stringify(record)); // 10 min TTL
    } else {
        otpStore.set(email, { ...record, expiresAt: Date.now() + OTP_TTL_MS });
    }
};

/** Retrieve OTP record — prefers Redis, falls back to in-memory Map */
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

/** Update OTP record (for resend) */
const updateOtp = async (email, newOtp) => {
    const record = await getOtp(email);
    if (!record) return false;
    record.otp = newOtp;
    record.expiresAt = Date.now() + OTP_TTL_MS;
    await storeOtp(email, record);
    return record;
};

// @desc  Step 1 of registration — validate fields, send OTP
// @route POST /api/auth/send-otp
const sendOtp = async (req, res) => {
    try {
        purgeExpiredOtps();

        const {
            name, email, password, role, collegeRollNumber, college: collegeId,
            skills, department, graduationYear, company, designation,
            industry, linkedin, bio, idProof, currentYear, gpa,
        } = req.body;

        if (!name || !email || !password || !role) {
            return res.status(400).json({ message: 'Name, email, password and role are required' });
        }

        if (!['student', 'alumni'].includes(role)) {
            return res.status(400).json({ message: 'Role must be student or alumni' });
        }

        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        if (collegeRollNumber) {
            const existingRoll = await User.findOne({ collegeRollNumber });
            if (existingRoll) {
                return res.status(400).json({ message: 'Roll number already registered' });
            }
        }

        if (collegeId && collegeRollNumber) {
            const collegeDoc = await College.findById(collegeId);
            if (!collegeDoc) {
                return res.status(400).json({ message: 'Selected college not found' });
            }
            try {
                const pattern = new RegExp(collegeDoc.rollNumberPattern);
                if (!pattern.test(collegeRollNumber.trim())) {
                    return res.status(400).json({
                        message: `Invalid roll number format for ${collegeDoc.name}. Expected: ${collegeDoc.exampleFormat}`,
                    });
                }
            } catch {
                console.error(`[College ${collegeId}] Malformed rollNumberPattern`);
            }
        }

        const otp = generateOtp();
        await storeOtp(email, {
            otp,
            userData: {
                name, email, password, role, collegeRollNumber,
                college: collegeId || null,
                skills: skills || [],
                department, bio,
                ...(role === 'alumni' && { graduationYear, company, designation, industry, linkedin, idProof, profilePicture: idProof }),
                ...(role === 'student' && { currentYear, gpa }),
            },
        });

        await sendOtpEmail(email, otp, name);

        res.status(200).json({
            message: 'OTP sent successfully',
            email,
        });
    } catch (err) {
        console.error('sendOtp error:', err);
        res.status(500).json({ message: 'Failed to send OTP. Please try again.' });
    }
};

// @desc  Step 2 of registration — verify OTP, create user, return JWT
// @route POST /api/auth/verify-otp
const verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ message: 'Email and OTP are required' });
        }

        const record = await getOtp(email);

        if (!record) {
            return res.status(400).json({ message: 'No OTP found for this email. Please register again.' });
        }

        // In-memory fallback: check expiry manually
        if (record.expiresAt && Date.now() > record.expiresAt) {
            await deleteOtp(email);
            return res.status(400).json({ message: 'OTP has expired. Please register again.' });
        }

        if (record.otp !== String(otp).trim()) {
            return res.status(400).json({ message: 'Incorrect OTP. Please try again.' });
        }

        const { userData } = record;
        await deleteOtp(email);

        const existingEmail = await User.findOne({ email: userData.email });
        if (existingEmail) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        const user = await User.create({ ...userData, isEmailVerified: true });

        generateToken(res, user._id);

        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            department: user.department,
            college: user.college,
            verificationStatus: user.verificationStatus,
        });
    } catch (err) {
        if (err.code === 11000) {
            const field = Object.keys(err.keyValue)[0];
            return res.status(400).json({ message: `${field} is already taken` });
        }
        console.error('verifyOtp error:', err);
        res.status(500).json({ message: err.message });
    }
};

// @desc  Resend OTP
// @route POST /api/auth/resend-otp
const resendOtp = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: 'Email is required' });

        const otp = generateOtp();
        const updated = await updateOtp(email, otp);

        if (!updated) {
            return res.status(400).json({
                message: 'Session expired. Please go back and fill the registration form again.',
            });
        }

        await sendOtpEmail(email, otp, updated.userData?.name || 'there');

        res.status(200).json({ message: 'New OTP sent successfully' });
    } catch (err) {
        console.error('resendOtp error:', err);
        res.status(500).json({ message: 'Failed to resend OTP. Please try again.' });
    }
};

// @desc  Register new user  (LEGACY — kept for backward compat, not used by new flow)
// @route POST /api/auth/register
const register = async (req, res) => {
    try {
        const {
            name, email, password, role, collegeRollNumber, college: collegeId,
            skills, department, graduationYear, company, designation,
            industry, linkedin, bio, idProof, currentYear, gpa,
        } = req.body;

        if (!['student', 'alumni'].includes(role)) {
            return res.status(400).json({ message: 'Role must be student or alumni' });
        }

        const existingEmail = await User.findOne({ email });
        if (existingEmail) return res.status(400).json({ message: 'Email already registered' });

        const existingRoll = await User.findOne({ collegeRollNumber });
        if (existingRoll) return res.status(400).json({ message: 'Roll number already registered' });

        if (collegeId) {
            const collegeDoc = await College.findById(collegeId);
            if (!collegeDoc) {
                return res.status(400).json({ message: 'Selected college not found' });
            }
            try {
                const pattern = new RegExp(collegeDoc.rollNumberPattern);
                if (!pattern.test(collegeRollNumber.trim())) {
                    return res.status(400).json({
                        message: `Invalid roll number format for ${collegeDoc.name}. Expected format: ${collegeDoc.exampleFormat}${collegeDoc.patternDescription ? ' — ' + collegeDoc.patternDescription : ''}`,
                    });
                }
            } catch {
                console.error(`[College ${collegeId}] Malformed rollNumberPattern`);
            }
        }

        const user = await User.create({
            name, email, password, role, collegeRollNumber,
            college: collegeId || null,
            skills: skills || [],
            department, bio,
            ...(role === 'alumni' && { graduationYear, company, designation, industry, linkedin, idProof, profilePicture: idProof }),
            ...(role === 'student' && { currentYear, gpa }),
        });

        generateToken(res, user._id);

        res.status(201).json({
            _id: user._id, name: user.name, email: user.email,
            role: user.role, department: user.department,
            college: user.college,
            verificationStatus: user.verificationStatus,
        });
    } catch (err) {
        if (err.code === 11000) {
            const field = Object.keys(err.keyValue)[0];
            return res.status(400).json({ message: `${field} is already taken` });
        }
        res.status(500).json({ message: err.message });
    }
};

// @desc  Login user
// @route POST /api/auth/login
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

        const user = await User.findOne({ email }).select('+password');
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        if (user.isSuspended) return res.status(403).json({ message: 'Account suspended' });

        generateToken(res, user._id);

        res.json({
            _id: user._id, name: user.name, email: user.email, role: user.role,
            profilePicture: user.profilePicture, department: user.department,
            company: user.company, designation: user.designation,
            graduationYear: user.graduationYear, skills: user.skills,
            careerInterests: user.careerInterests, bio: user.bio,
            mentorshipAvailability: user.mentorshipAvailability,
            verificationStatus: user.verificationStatus,
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc  Logout — clear cookie
// @route POST /api/auth/logout
const logout = (req, res) => {
    res.cookie('jwt', '', { httpOnly: true, expires: new Date(0) });
    res.json({ message: 'Logged out successfully' });
};

// @desc  Get current user
// @route GET /api/auth/me
const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc  Change password
// @route PUT /api/auth/change-password
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user._id).select('+password');
        if (!(await user.comparePassword(currentPassword))) {
            return res.status(400).json({ message: 'Current password incorrect' });
        }
        user.password = newPassword;
        await user.save();
        res.json({ message: 'Password updated successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc  Forgot password — send reset link
// @route POST /api/auth/forgot-password
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: 'Email is required' });

        const user = await User.findOne({ email });

        // Always return success to prevent email enumeration attacks
        if (!user) {
            return res.json({ message: 'If that email exists, a reset link has been sent.' });
        }

        // Generate a cryptographically secure token
        const rawToken = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

        // Delete any existing reset tokens for this user
        await PasswordReset.deleteMany({ userId: user._id });

        // Store hashed token (expires in 15 minutes)
        await PasswordReset.create({
            userId: user._id,
            tokenHash,
            expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        });

        const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
        const resetLink = `${clientUrl}/reset-password?token=${rawToken}`;

        await sendPasswordResetEmail(user.email, resetLink, user.name);

        res.json({ message: 'If that email exists, a reset link has been sent.' });
    } catch (err) {
        console.error('forgotPassword error:', err);
        res.status(500).json({ message: 'Failed to process request. Please try again.' });
    }
};

// @desc  Reset password using token from email
// @route POST /api/auth/reset-password
const resetPassword = async (req, res) => {
    try {
        const { token, password } = req.body;
        if (!token || !password) {
            return res.status(400).json({ message: 'Token and new password are required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        // Hash the incoming token and look it up
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        const resetRecord = await PasswordReset.findOne({
            tokenHash,
            expiresAt: { $gt: new Date() },
        });

        if (!resetRecord) {
            return res.status(400).json({ message: 'Invalid or expired reset link. Please request a new one.' });
        }

        const user = await User.findById(resetRecord.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Set new password and clean up
        user.password = password;
        await user.save();
        await PasswordReset.deleteMany({ userId: user._id });

        res.json({ message: 'Password reset successfully. You can now log in.' });
    } catch (err) {
        console.error('resetPassword error:', err);
        res.status(500).json({ message: err.message });
    }
};

// @desc  Admin login
// @route POST /api/auth/admin-login
const adminLogin = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Read credentials from environment variables (never hardcode)
        const adminUsername = process.env.ADMIN_USERNAME || 'Admin';
        const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';

        if (username !== adminUsername || password !== adminPassword) {
            return res.status(401).json({ message: 'Invalid Admin credentials' });
        }

        const adminEmail = process.env.ADMIN_EMAIL || 'admin@college.edu';

        let admin = await User.findOne({ email: adminEmail });
        if (!admin) {
            admin = await User.create({
                name: 'System Admin',
                email: adminEmail,
                password: adminPassword,
                role: 'admin',
                collegeRollNumber: 'ADMIN001',
            });
        }

        generateToken(res, admin._id);

        res.json({
            _id: admin._id, name: admin.name, email: admin.email, role: admin.role,
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = {
    register, login, logout, getMe, changePassword, adminLogin,
    sendOtp, verifyOtp, resendOtp,
    forgotPassword, resetPassword,
};
