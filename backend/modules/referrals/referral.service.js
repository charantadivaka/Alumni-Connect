'use strict';

/**
 * Referral Service
 * ────────────────
 * Business logic for job referrals.
 */

const Referral = require('../../models/Referral');
const { checkAndAwardBadges } = require('../../utils/badgeService');

/**
 * Request a referral (student).
 * Returns { referral, alumniId } for notifications.
 */
const requestReferral = async (data, studentUser) => {
    const { alumniId, jobTitle, company, message, resumeId } = data;

    const referral = await Referral.create({
        student:  studentUser._id,
        alumni:   alumniId,
        jobTitle, 
        company,
        message:  message || '',
        resume:   resumeId || undefined,
    });

    return { referral, alumniId };
};

/** Get referrals involving the current user. */
const getMyReferrals = async (user) => {
    const filter = user.role === 'student'
        ? { student: user._id }
        : { alumni:  user._id };

    return Referral.find(filter)
        .populate('student', 'name profilePicture department skills')
        .populate('alumni', 'name profilePicture company designation')
        .populate('resume', 'name')
        .sort({ createdAt: -1 });
};

/**
 * Respond to a referral request (alumni).
 * Returns { referral, studentId } for notifications.
 */
const respondReferral = async (referralId, status, alumniNote, alumniUser) => {
    const validStatuses = ['Submitted', 'Rejected', 'Not Available'];
    if (!validStatuses.includes(status)) {
        throw Object.assign(new Error('Invalid status'), { statusCode: 400 });
    }

    const referral = await Referral.findById(referralId);
    if (!referral) throw Object.assign(new Error('Referral not found'), { statusCode: 404 });

    if (referral.alumni.toString() !== alumniUser._id.toString()) {
        throw Object.assign(new Error('Not authorized'), { statusCode: 403 });
    }

    referral.status = status;
    referral.alumniNote = alumniNote || '';
    await referral.save();

    if (status === 'Submitted') {
        checkAndAwardBadges(alumniUser._id.toString(), 'referral_submitted').catch(() => {});
    }

    return { referral, studentId: referral.student };
};

module.exports = { requestReferral, getMyReferrals, respondReferral };
