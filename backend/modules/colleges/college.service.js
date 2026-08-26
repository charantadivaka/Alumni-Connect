'use strict';

/**
 * College Service
 * ───────────────
 * Business logic for college management, validation, and fee checks.
 */

const College = require('../../models/College');

/** Safely compile a regex from a stored string */
const compilePattern = (patternStr) => {
    try {
        return new RegExp(patternStr);
    } catch {
        return null;
    }
};

/** Get all active colleges (public use). */
const getActiveColleges = async () => {
    return College.find({ isActive: true })
        .select('name rollNumberPattern exampleFormat patternDescription')
        .sort({ name: 1 });
};

/** Get all colleges (admin use). */
const getAllCollegesAdmin = async () => {
    return College.find().sort({ name: 1 });
};

/**
 * Admin create college manually.
 * Validates regex pattern and example.
 */
const createCollege = async (data) => {
    const { name, rollNumberPattern, exampleFormat, patternDescription } = data;

    const compiled = compilePattern(rollNumberPattern);
    if (!compiled) {
        throw Object.assign(new Error('Invalid regex pattern. Please check the syntax.'), { statusCode: 400 });
    }
    if (!compiled.test(exampleFormat)) {
        throw Object.assign(new Error('The example format does not match the provided pattern.'), { statusCode: 400 });
    }

    const college = await College.create({ name, rollNumberPattern, exampleFormat, patternDescription });
    return college;
};

/**
 * Admin update college.
 * Validates regex if provided.
 */
const updateCollege = async (collegeId, data) => {
    const { name, rollNumberPattern, exampleFormat, patternDescription, isActive } = data;

    if (rollNumberPattern) {
        const compiled = compilePattern(rollNumberPattern);
        if (!compiled) {
            throw Object.assign(new Error('Invalid regex pattern. Please check the syntax.'), { statusCode: 400 });
        }

        const college = await College.findById(collegeId);
        if (!college) throw Object.assign(new Error('College not found'), { statusCode: 404 });

        const exampleToTest = exampleFormat || college.exampleFormat;
        if (exampleToTest && !compiled.test(exampleToTest)) {
            throw Object.assign(new Error('The example format does not match the pattern.'), { statusCode: 400 });
        }
    }

    const college = await College.findByIdAndUpdate(
        collegeId,
        { name, rollNumberPattern, exampleFormat, patternDescription, isActive },
        { new: true, runValidators: true }
    );

    if (!college) throw Object.assign(new Error('College not found'), { statusCode: 404 });
    return college;
};

/** Admin delete college. */
const deleteCollege = async (collegeId) => {
    const college = await College.findByIdAndDelete(collegeId);
    if (!college) throw Object.assign(new Error('College not found'), { statusCode: 404 });
};

/** Validate a roll number against a college's pattern (utility). */
const validateRollNumber = async (collegeId, rollNumber) => {
    const college = await College.findById(collegeId);
    if (!college) throw Object.assign(new Error('College not found'), { statusCode: 404 });

    const compiled = compilePattern(college.rollNumberPattern);
    if (!compiled) throw Object.assign(new Error('Stored pattern is invalid — contact admin'), { statusCode: 500 });

    const valid = compiled.test(rollNumber.trim());
    return { valid, exampleFormat: college.exampleFormat, patternDescription: college.patternDescription };
};

/** Check a college's fee/subscription status by name (public). */
const getCollegeFeeStatus = async (name) => {
    const escapedName = name.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const college = await College.findOne({
        name: { $regex: new RegExp(`^${escapedName}$`, 'i') },
    }).select('name feesPaid feePaidUntil isActive');

    if (!college) {
        return { found: false };
    }

    const now = new Date();
    const expiry = college.subscriptionExpiry ? new Date(college.subscriptionExpiry) : null;
    const isExpired = college.subscriptionStatus === 'Expired' || (expiry && expiry < now);
    const daysRemaining = expiry
        ? Math.max(0, Math.ceil((expiry - now) / (1000 * 60 * 60 * 24)))
        : 0;

    return {
        found: true,
        collegeName: college.name,
        isActive: college.isActive,
        subscriptionStatus: college.subscriptionStatus,
        subscriptionPlan: college.subscriptionPlan,
        subscriptionExpiry: expiry ? expiry.toISOString() : null,
        isExpired,
        daysRemaining,
    };
};

/**
 * Get full details of a single college, including aggregated stats.
 */
const getCollegeDetails = async (id) => {
    const college = await College.findById(id);
    if (!college) throw Object.assign(new Error('College not found'), { statusCode: 404 });

    const User = require('../../models/User');
    const Job = require('../../models/Job');
    const Connection = require('../../models/Connection');

    // Stats
    const studentsCount = await User.countDocuments({ college: id, role: 'student' });
    const alumniCount = await User.countDocuments({ college: id, role: 'alumni' });
    const activeUsersCount = await User.countDocuments({ college: id, isSuspended: false });

    // Mentorships & Jobs (Count items owned by alumni of this college)
    const alumniIds = (await User.find({ college: id, role: 'alumni' }).select('_id')).map(u => u._id);
    
    // Total students helped by these alumni
    const alumniData = await User.find({ college: id, role: 'alumni' }).select('studentsHelped');
    const mentorshipsCount = alumniData.reduce((acc, curr) => acc + (curr.studentsHelped || 0), 0);
    
    const jobsCount = await Job.countDocuments({ postedBy: { $in: alumniIds } });

    // Connections (Count where either sender or receiver is from this college)
    const allUserIds = (await User.find({ college: id }).select('_id')).map(u => u._id);
    const connectionsCount = await Connection.countDocuments({
        $or: [{ sender: { $in: allUserIds } }, { receiver: { $in: allUserIds } }],
        status: 'Accepted'
    });

    return {
        college,
        stats: {
            studentsCount,
            alumniCount,
            activeUsersCount,
            mentorshipsCount,
            jobsCount,
            connectionsCount
        }
    };
};

/**
 * Renew or update subscription for a college.
 */
const renewSubscription = async (id, renewalData) => {
    const college = await College.findById(id);
    if (!college) throw Object.assign(new Error('College not found'), { statusCode: 404 });

    const { plan, amount, expiryDate, status = 'Paid', notes = '' } = renewalData;

    college.subscriptionStatus = 'Active';
    if (plan) college.subscriptionPlan = plan;
    if (expiryDate) college.subscriptionExpiry = new Date(expiryDate);
    
    college.subscriptionHistory.push({
        plan: plan || college.subscriptionPlan,
        amount: Number(amount) || 0,
        status,
        paymentDate: new Date(),
        notes
    });

    await college.save();
    return college;
};

module.exports = {
    getActiveColleges, getAllCollegesAdmin, createCollege, updateCollege,
    deleteCollege, validateRollNumber, getCollegeFeeStatus,
    getCollegeDetails, renewSubscription
};
