const User = require('../models/User');
const College = require('../models/College');
const generateToken = require('../utils/generateToken');
const { sendOtpEmail } = require('../utils/emailService');

// ── In-memory OTP store ───────────────────────────────────────────────────────
// Structure: Map<email, { otp, expiresAt, name, userData }>
// We store the full user payload here temporarily; the user record is only
// created AFTER successful OTP verification.
const otpStore = new Map();

const OTP_TTL_MS  = 10 * 60 * 1000; // 10 minutes

/** Generate a cryptographically safe 6-digit OTP */
const generateOtp = () => {
    const crypto = require('crypto');
    return String(crypto.randomInt(100000, 999999));
};

/** Clean up expired OTPs from memory (called on each new OTP request) */
const purgeExpiredOtps = () => {
    const now = Date.now();
    for (const [key, val] of otpStore.entries()) {
        if (val.expiresAt < now) otpStore.delete(key);
    }
};

// @desc  Step 1 of registration — validate fields, save user, send OTP
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

        // Check if email is already a registered user
        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        // Check roll number uniqueness
        if (collegeRollNumber) {
            const existingRoll = await User.findOne({ collegeRollNumber });
            if (existingRoll) {
                return res.status(400).json({ message: 'Roll number already registered' });
            }
        }

        // Roll number pattern validation
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

        // Generate OTP and store pending registration data
        const otp = generateOtp();
        otpStore.set(email, {
            otp,
            expiresAt: Date.now() + OTP_TTL_MS,
            userData: {
                name, email, password, role, collegeRollNumber,
                college: collegeId || null,
                skills: skills || [],
                department, bio,
                ...(role === 'alumni' && { graduationYear, company, designation, industry, linkedin, idProof }),
                ...(role === 'student' && { currentYear, gpa }),
            },
        });

        // Send OTP email
        await sendOtpEmail(email, otp, name);

        res.status(200).json({
            message: 'OTP sent successfully',
            email, // echo back so frontend can use it
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

        const record = otpStore.get(email);

        if (!record) {
            return res.status(400).json({ message: 'No OTP found for this email. Please register again.' });
        }

        if (Date.now() > record.expiresAt) {
            otpStore.delete(email);
            return res.status(400).json({ message: 'OTP has expired. Please register again.' });
        }

        if (record.otp !== String(otp).trim()) {
            return res.status(400).json({ message: 'Incorrect OTP. Please try again.' });
        }

        // OTP verified — create the user now
        const { userData } = record;
        otpStore.delete(email); // clean up

        // Double-check that nobody else registered with the same email in the meantime
        const existingEmail = await User.findOne({ email: userData.email });
        if (existingEmail) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        const user = await User.create({
            ...userData,
            isEmailVerified: true,
        });

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

// @desc  Resend OTP (re-generates and re-sends without re-validating form)
// @route POST /api/auth/resend-otp
const resendOtp = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: 'Email is required' });

        const record = otpStore.get(email);
        if (!record) {
            return res.status(400).json({
                message: 'Session expired. Please go back and fill the registration form again.',
            });
        }

        // Generate fresh OTP and update TTL
        const otp = generateOtp();
        record.otp = otp;
        record.expiresAt = Date.now() + OTP_TTL_MS;
        otpStore.set(email, record);

        await sendOtpEmail(email, otp, record.userData.name);

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

        // ── Roll number pattern validation ────────────────────────────────────
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
                console.error(`[College ${collegeDoc._id}] Malformed rollNumberPattern: ${collegeDoc.rollNumberPattern}`);
            }
        }

        const user = await User.create({
            name, email, password, role, collegeRollNumber,
            college: collegeId || null,
            skills: skills || [],
            department, bio,
            ...(role === 'alumni' && { graduationYear, company, designation, industry, linkedin, idProof }),
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

// @desc  Admin login
// @route POST /api/auth/admin-login
const adminLogin = async (req, res) => {
    try {
        const { username, password } = req.body;
        if (username !== 'Admin' || password !== 'Admin@123') {
            return res.status(401).json({ message: 'Invalid Admin credentials' });
        }

        let admin = await User.findOne({ email: 'admin@college.edu' });
        if (!admin) {
            admin = await User.create({
                name: 'System Admin',
                email: 'admin@college.edu',
                password: 'Admin@123',
                role: 'admin',
                collegeRollNumber: 'ADMIN001'
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



module.exports = { register, login, logout, getMe, changePassword, adminLogin, sendOtp, verifyOtp, resendOtp };
