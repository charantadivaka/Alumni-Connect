const User = require('../models/User');
const College = require('../models/College');
const generateToken = require('../utils/generateToken');

// @desc  Register new user
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
                // Stored pattern is malformed — skip validation but log it
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
                collegeRollNumber: 'ADMIN001' // To pass validations if any
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

module.exports = { register, login, logout, getMe, changePassword, adminLogin };
