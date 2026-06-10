const User = require('../models/User');
const Job = require('../models/Job');
const Mentorship = require('../models/Mentorship');
const Story = require('../models/Story');
const Event = require('../models/Event');
const Forum = require('../models/Forum');

const getAllUsers = async (req, res) => {
    try {
        const { role, search, status } = req.query;
        const filter = {};
        if (role) filter.role = role;
        if (status === 'suspended') filter.isSuspended = true;
        if (search) filter.$or = [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
        ];
        const users = await User.find(filter).select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const getVerificationQueue = async (req, res) => {
    try {
        const pending = await User.find({ role: 'alumni', verificationStatus: 'Pending' })
            .select('name email department company graduationYear idProof createdAt')
            .sort({ createdAt: 1 });
        res.json(pending);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const verifyAlumni = async (req, res) => {
    try {
        const { status } = req.body; // 'Verified' | 'Rejected'
        if (!['Verified', 'Rejected'].includes(status)) {
            return res.status(400).json({ message: 'Status must be Verified or Rejected' });
        }
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { verificationStatus: status },
            { new: true }
        ).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const toggleSuspend = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        if (user.role === 'admin') return res.status(400).json({ message: 'Cannot suspend admin' });
        user.isSuspended = !user.isSuspended;
        await user.save();
        res.json({ isSuspended: user.isSuspended, message: user.isSuspended ? 'User suspended' : 'User reactivated' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const getAnalytics = async (req, res) => {
    try {
        const [
            totalUsers, totalStudents, totalAlumni, totalJobs,
            totalMentorships, totalStories, totalEvents, totalForums,
            pendingVerifications,
        ] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ role: 'student' }),
            User.countDocuments({ role: 'alumni' }),
            Job.countDocuments({ isActive: true }),
            Mentorship.countDocuments(),
            Story.countDocuments({ isPublished: true }),
            Event.countDocuments({ isActive: true }),
            Forum.countDocuments(),
            User.countDocuments({ role: 'alumni', verificationStatus: 'Pending' }),
        ]);

        // Recent 7-day registrations
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const recentRegistrations = await User.countDocuments({ createdAt: { $gte: weekAgo } });

        res.json({
            totalUsers, totalStudents, totalAlumni, totalJobs,
            totalMentorships, totalStories, totalEvents, totalForums,
            pendingVerifications, recentRegistrations,
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { getAllUsers, getVerificationQueue, verifyAlumni, toggleSuspend, getAnalytics };
