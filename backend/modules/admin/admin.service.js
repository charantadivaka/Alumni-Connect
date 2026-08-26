'use strict';

/**
 * Admin Service
 * ──────────────
 * Business logic for admin operations: user management,
 * verification, analytics, and reported content.
 * Extracted from adminController.js.
 */

const User          = require('../../models/User');
const Job           = require('../../models/Job');
const Mentorship    = require('../../models/Mentorship');
const Story         = require('../../models/Story');
const Event         = require('../../models/Event');
const Forum         = require('../../models/Forum');
const JobApplication = require('../../models/JobApplication');
const AuditLog      = require('../../models/AuditLog');
const { invalidatePattern } = require('../../config/redis');
const { escapeRegex }       = require('../../shared/utils/escapeRegex');

const ANALYTICS_CACHE_PATTERN = '__express__:*:/api/admin/analytics*';
const MATCH_CACHE_PATTERN     = '__express__:*:/api/match*';

/** Get all users with advanced filters and sorting. */
const getAllUsers = async ({ role, search, accountStatus, verificationStatus, college, department, sort }) => {
    const filter = {};
    if (role) filter.role = role;
    
    // Account Status
    if (accountStatus === 'suspended' || accountStatus === 'banned') filter.isSuspended = true;
    else if (accountStatus === 'active') filter.isSuspended = false;

    // Verification Status
    if (verificationStatus) filter.verificationStatus = verificationStatus;

    // College
    if (college) filter.college = college;

    // Department
    if (department) filter.department = { $regex: new RegExp(escapeRegex(department), 'i') };

    // Search
    if (search) {
        const safe = escapeRegex(search);
        filter.$or = [
            { name:  { $regex: safe, $options: 'i' } },
            { email: { $regex: safe, $options: 'i' } },
        ];
    }

    // Sort
    const sortConfig = {};
    if (sort === 'oldest') {
        sortConfig.createdAt = 1;
    } else {
        // default 'newest'
        sortConfig.createdAt = -1;
    }

    return User.find(filter)
        .select('-password')
        .populate('college', 'name')
        .sort(sortConfig);
};

/** Get alumni pending verification. */
const getVerificationQueue = async () => {
    return User.find({ role: 'alumni', verificationStatus: 'Pending' })
        .select('name email department company designation graduationYear idProof college collegeRollNumber createdAt')
        .populate('college', 'name')
        .sort({ createdAt: 1 });
};

/**
 * Verify or reject an alumni.
 * Logs the action and invalidates relevant caches.
 */
const verifyAlumni = async (userId, status, adminUser, ip) => {
    if (!['Verified', 'Rejected'].includes(status)) {
        throw Object.assign(new Error('Status must be Verified or Rejected'), { statusCode: 400 });
    }

    const user = await User.findByIdAndUpdate(
        userId,
        { verificationStatus: status },
        { new: true }
    ).select('-password');

    if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });

    await Promise.all([
        invalidatePattern(ANALYTICS_CACHE_PATTERN),
        invalidatePattern(MATCH_CACHE_PATTERN),
        AuditLog.create({
            adminId:     adminUser._id,
            action:      status === 'Verified' ? 'VERIFY_ALUMNI' : 'REJECT_ALUMNI',
            targetId:    user._id,
            targetModel: 'User',
            details:     `Alumni verification status set to ${status}`,
            ip,
        }),
    ]);

    return user;
};

/**
 * Toggle suspension status of a user.
 * Logs the action.
 */
const toggleSuspend = async (userId, adminUser, ip) => {
    const user = await User.findById(userId);
    if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });
    if (user.role === 'admin') throw Object.assign(new Error('Cannot suspend admin'), { statusCode: 400 });

    user.isSuspended = !user.isSuspended;
    await user.save();

    await Promise.all([
        invalidatePattern(ANALYTICS_CACHE_PATTERN),
        invalidatePattern(MATCH_CACHE_PATTERN),
        AuditLog.create({
            adminId:     adminUser._id,
            action:      user.isSuspended ? 'SUSPEND_USER' : 'UNSUSPEND_USER',
            targetId:    user._id,
            targetModel: 'User',
            details:     user.isSuspended ? 'Suspended user account' : 'Reactivated user account',
            ip,
        }),
    ]);

    return user;
};

const getAnalytics = async () => {
    const MockInterview = require('../../models/MockInterview');
    const College = require('../../models/College');
    const Connection = require('../../models/Connection');
    const Referral = require('../../models/Referral');
    
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const in7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [
        totalUsers, totalStudents, totalAlumni, totalJobs,
        totalMentorships, totalMockInterviews, totalJobApplications,
        totalStories, totalEvents, totalForums,
        pendingVerifications, recentRegistrations,
        totalColleges, reportedPosts, reportedUsers, jobsApproachingDeadline,
        expiringColleges,
        mentorshipsCompleted, connectionsCreated, activeMentorships,
        mockInterviewsCompleted, jobsPostedThisMonth, referralsCompleted
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
        User.countDocuments({ createdAt: { $gte: weekAgo } }),
        College.countDocuments(),
        Forum.countDocuments({ $expr: { $gt: [{ $size: { $ifNull: ['$reports', []] } }, 0] } }),
        User.countDocuments({ $expr: { $gt: [{ $size: { $ifNull: ['$reports', []] } }, 0] } }),
        Job.countDocuments({ status: 'Active', deadline: { $gte: new Date(), $lte: in7Days } }),
        College.countDocuments({
            $or: [
                { subscriptionStatus: { $in: ['Expired', 'Payment Pending'] } },
                { subscriptionExpiry: { $gte: new Date(), $lte: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000) } }
            ]
        }),
        Mentorship.countDocuments({ status: 'Completed' }),
        Connection.countDocuments({ status: 'Accepted' }),
        Mentorship.countDocuments({ status: 'Accepted' }),
        MockInterview.countDocuments({ status: 'Completed' }),
        Job.countDocuments({ createdAt: { $gte: startOfMonth } }),
        Referral.countDocuments({ status: 'Submitted' })
    ]);
    
    const averageApplicationsPerJob = totalJobs > 0 ? (totalJobApplications / totalJobs).toFixed(1) : 0;

    return {
        totalUsers, totalStudents, totalAlumni, totalJobs,
        totalMentorships, totalMockInterviews, totalJobApplications,
        totalStories, totalEvents, totalForums,
        pendingVerifications, recentRegistrations,
        totalColleges, reportedPosts, reportedUsers, jobsApproachingDeadline,
        expiringColleges,
        mentorshipsCompleted, connectionsCreated, activeMentorships,
        mockInterviewsCompleted, jobsPostedThisMonth, referralsCompleted,
        averageApplicationsPerJob
    };
};

/** Get jobs with at least one report. */
const getReportedJobs = async () => {
    return Job.find({ $expr: { $gt: [{ $size: '$reports' }, 0] } })
        .populate('postedBy', 'name email profilePicture')
        .populate('reports.reportedBy', 'name email')
        .sort({ createdAt: -1 });
};

/** Get events with at least one report. */
const getReportedEvents = async () => {
    return Event.find({ $expr: { $gt: [{ $size: '$reports' }, 0] } })
        .populate('createdBy', 'name email profilePicture')
        .populate('reports.reportedBy', 'name email')
        .sort({ date: -1 });
};

/** Get user growth analytics grouped by date. */
const getUserGrowth = async (days = 30) => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days, 10));
    startDate.setHours(0, 0, 0, 0);

    const growth = await User.aggregate([
        { 
            $match: { 
                role: { $in: ['student', 'alumni'] }, 
                createdAt: { $gte: startDate } 
            } 
        },
        { 
            $group: { 
                _id: { 
                    date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    role: '$role'
                },
                count: { $sum: 1 }
            }
        },
        { $sort: { '_id.date': 1 } }
    ]);

    // Format into an array of { date, students, alumni }
    const dateMap = {};
    growth.forEach(item => {
        const date = item._id.date;
        if (!dateMap[date]) dateMap[date] = { date, students: 0, alumni: 0 };
        if (item._id.role === 'student') dateMap[date].students = item.count;
        if (item._id.role === 'alumni') dateMap[date].alumni = item.count;
    });

    return Object.values(dateMap);
};

/** Resolve a report by taking an action */
const resolveReport = async (type, targetId, reportId, action, adminUser, ip) => {
    const Model = type === 'job' ? Job : Event;
    if (!Model) throw Object.assign(new Error('Invalid report type'), { statusCode: 400 });

    const target = await Model.findById(targetId);
    if (!target) throw Object.assign(new Error(`${type} not found`), { statusCode: 404 });

    const report = target.reports.id(reportId);
    if (!report) throw Object.assign(new Error('Report not found'), { statusCode: 404 });

    const authorId = type === 'job' ? target.postedBy : target.createdBy;
    const author = await User.findById(authorId);
    const Message = require('../../models/Message');

    if (action === 'dismiss') {
        report.status = 'Dismissed';
        await target.save();
    } else if (action === 'remove') {
        await target.deleteOne();
    } else if (action === 'warn') {
        report.status = 'Resolved';
        await target.save();
        if (author) {
            await Message.create({
                sender: adminUser._id,
                receiver: author._id,
                text: `[Admin Warning] Your ${type} has been reviewed due to reports and was found to violate community guidelines. Please ensure future posts comply with our rules.`
            });
        }
    } else if (action === 'suspend') {
        report.status = 'Resolved';
        await target.save();
        if (author && author.role !== 'admin') {
            author.isSuspended = true;
            await author.save();
        }
    } else if (action === 'reviewing') {
        report.status = 'Under Review';
        await target.save();
    } else {
        throw Object.assign(new Error('Invalid action'), { statusCode: 400 });
    }

    await AuditLog.create({
        adminId: adminUser._id,
        action: `RESOLVE_REPORT_${action.toUpperCase()}`,
        targetId,
        targetModel: type === 'job' ? 'Job' : 'Event',
        details: `Report ${reportId} resolved with action: ${action}`,
        ip,
    });

    return target;
};

module.exports = {
    getAllUsers, getVerificationQueue, verifyAlumni,
    toggleSuspend, getAnalytics, getReportedJobs, getReportedEvents, getUserGrowth,
    resolveReport
};
