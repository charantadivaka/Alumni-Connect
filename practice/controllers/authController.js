const User = require('../models/User');
const generateToken = require('../utils/generateToken');

const register = async (req, res) => {
    try {
        const {
            name, email, password, role, collegeRollNumber,
            skills, department, graduationYear, company, designation,
            industry, linkedin, bio, idProof, currentYear, gpa,
        } = req.body;

        if (!['student', 'alumni'].includes(role)) {
            return res.status(400).json({ message: 'Role must be student or alumni' });
        }

        const existingEmail = await user.findOne({ email });
        if (existingEmail) return res.status(400).json({ message: 'Email already registered' });

        const existingRoll = await user.findOne({ collegeRollNumber });
        if (existingRoll) return res.status(400).json({ message: 'Roll number already registered' });

        const user = await User.create({
            name, email, password, role, collegeRollNumber,
            skills: skills || [],
            department, bio,
            ...(role === 'alumni' && { graduationYear, company, designation, industry, linkedin, idProof }),
            ...(role === 'student' && { currentYear, gpa }),
        });

        generateToken(res, user._id);

        res.status(201).json({
            _id: user._id, name: user.name, email: user.email,
            role: user.role, department: user.department,
            verificationStatus: user.verificationStatus,
        });
    } catch (err) {
        if (err.code === 11000) {
            const field = Object.keys(err.keyValue)[0];
            return res.status(400).json({ message: `${field} is already taken` });
        }
        res.status(500).json({ message: err.message });
    }
}

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });

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
            availableForMentorship: user.availableForMentorship,
            verificationStatus: user.verificationStatus,
        });
    } catch (error) {
        res.status(500).json({ message: err.message });
    }
};

const logout = (req, res) => {
    res.cookie('jwt', '', {
        httpOnly: true,
        expires: new Date(0),
    });
    res.json({ message: 'Logged out successfully' });
};

const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user._id).select('+password');
        if (!(await user.comparePassword(currentPassword))) {
            return res.status(401).json({ message: 'Invalid current password' });
        }

        user.password = newPassword;
        await user.save();
        res.json({ message: 'Password updated successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { register, login, logout, getMe, changePassword };