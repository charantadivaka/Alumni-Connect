const User = require('../models/User');
const Job = require('../models/Job');
const Mentorship = require('../models/Mentorship');
const Story = require('../models/Story');
const Event = require('../models/Event');
const Forum = require('../models/Forum');
const JobApplication = require('../models/JobApplication');

// @desc  Get all users (with filters)
// @route GET /api/admin/users
const getAllUsers = async (req, res) => {
    try {
        const { role, search, status } = req.query;
        const filter = {};
        if (role)   filter.role = role;
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

// @desc  Get pending alumni verification queue
// @route GET /api/admin/verification-queue
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

// @desc  Verify or reject an alumni
// @route PUT /api/admin/users/:id/verify
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

// @desc  Suspend or unsuspend a user
// @route PUT /api/admin/users/:id/suspend
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

// @desc  Platform analytics
// @route GET /api/admin/analytics
const getAnalytics = async (req, res) => {
    try {
        const MockInterview = require('../models/MockInterview');
        
        const [
            totalUsers, totalStudents, totalAlumni, totalJobs,
            totalMentorships, totalMockInterviews, totalJobApplications,
            totalStories, totalEvents, totalForums,
            pendingVerifications,
        ] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ role: 'student' }),
            User.countDocuments({ role: 'alumni' }),
            Job.countDocuments({ isActive: true }),
            Mentorship.countDocuments(),
            MockInterview.countDocuments(),
            JobApplication.countDocuments(),
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
            totalMentorships, totalMockInterviews, totalJobApplications,
            totalStories, totalEvents, totalForums,
            pendingVerifications, recentRegistrations,
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc  Get reported jobs (admin)
// @route GET /api/admin/jobs/reported
const getReportedJobs = async (req, res) => {
    try {
        const jobs = await Job.find({ $expr: { $gt: [{ $size: "$reports" }, 0] } })
            .populate('postedBy', 'name email')
            .sort({ createdAt: -1 });
        res.json(jobs);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc  Get reported events (admin)
// @route GET /api/admin/events/reported
const getReportedEvents = async (req, res) => {
    try {
        const events = await Event.find({ $expr: { $gt: [{ $size: "$reports" }, 0] } })
            .populate('createdBy', 'name email')
            .sort({ date: -1 });
        res.json(events);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { getAllUsers, getVerificationQueue, verifyAlumni, toggleSuspend, getAnalytics, getReportedJobs, getReportedEvents };
