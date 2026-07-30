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

const ANALYTICS_CACHE_PATTERN = '__express__/api/admin/analytics*';
const MATCH_CACHE_PATTERN     = '__express__/api/match*';

/** Get all users with optional role/search/status filters. */
const getAllUsers = async ({ role, search, status }) => {
    const filter = {};
    if (role)   filter.role = role;
    if (status === 'suspended') filter.isSuspended = true;
    if (search) filter.$or = [
        { name:  { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
    ];
    return User.find(filter).select('-password').sort({ createdAt: -1 });
};

/** Get alumni pending verification. */
const getVerificationQueue = async () => {
    return User.find({ role: 'alumni', verificationStatus: 'Pending' })
        .select('name email department company graduationYear idProof createdAt')
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

/** Aggregate platform analytics. */
const getAnalytics = async () => {
    const MockInterview = require('../../models/MockInterview');
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
        totalUsers, totalStudents, totalAlumni, totalJobs,
        totalMentorships, totalMockInterviews, totalJobApplications,
        totalStories, totalEvents, totalForums,
        pendingVerifications, recentRegistrations,
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
    ]);

    return {
        totalUsers, totalStudents, totalAlumni, totalJobs,
        totalMentorships, totalMockInterviews, totalJobApplications,
        totalStories, totalEvents, totalForums,
        pendingVerifications, recentRegistrations,
    };
};

/** Get jobs with at least one report. */
const getReportedJobs = async () => {
    return Job.find({ $expr: { $gt: [{ $size: '$reports' }, 0] } })
        .populate('postedBy', 'name email')
        .sort({ createdAt: -1 });
};

/** Get events with at least one report. */
const getReportedEvents = async () => {
    return Event.find({ $expr: { $gt: [{ $size: '$reports' }, 0] } })
        .populate('createdBy', 'name email')
        .sort({ date: -1 });
};

module.exports = {
    getAllUsers, getVerificationQueue, verifyAlumni,
    toggleSuspend, getAnalytics, getReportedJobs, getReportedEvents,
};
