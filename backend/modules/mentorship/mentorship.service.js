'use strict';

/**
 * Mentorship Service
 * ───────────────────
 * Business logic for mentorship sessions, slot booking,
 * completion, feedback, and rating aggregation.
 * Extracted from mentorshipController.js.
 */

const Mentorship = require('../../models/Mentorship');
const MentorSlot = require('../../models/MentorSlot');
const User = require('../../models/User');
const { checkAndAwardBadges } = require('../../utils/badgeService');
const { sendMentorshipAcceptedEmail } = require('../../utils/emailService');

/**
 * Create a new mentorship session request.
 * Returns { session, alumniId } so the caller can trigger notifications.
 */
const requestSession = async (data, studentUser) => {
    const { alumniId, slotId, topic, goals } = data;

    const session = await Mentorship.create({
        student: studentUser._id,
        alumni:  alumniId,
        slot:    slotId || undefined,
        topic,
        goals,
    });

    // Mark the slot as booked if one was selected
    if (slotId) {
        await MentorSlot.findByIdAndUpdate(slotId, { isBooked: true });
    }

    return { session, alumniId };
};

/** Get all sessions for the current user (filtered by role). */
const getMySessions = async (user) => {
    const filter = user.role === 'student'
        ? { student: user._id }
        : { alumni:  user._id };

    return Mentorship.find(filter)
        .populate('student', 'name profilePicture department skills')
        .populate('alumni',  'name profilePicture company designation')
        .populate('slot',    'date startTime duration')
        .sort({ createdAt: -1 });
};

/**
 * Accept or reject a mentorship session (alumni).
 * Returns the updated session.
 * If accepted, also fires an acceptance email (synchronously — no queue needed here
 * because the email utility is already non-blocking with its own try/catch).
 */
const respondToSession = async (sessionId, status, alumniUser) => {
    if (!['Accepted', 'Rejected'].includes(status)) {
        throw Object.assign(new Error('Status must be Accepted or Rejected'), { statusCode: 400 });
    }

    const session = await Mentorship.findById(sessionId)
        .populate('student', 'name email')
        .populate('alumni',  'name');

    if (!session) throw Object.assign(new Error('Session not found'), { statusCode: 404 });

    if (session.alumni._id.toString() !== alumniUser._id.toString()) {
        throw Object.assign(new Error('Not authorized'), { statusCode: 403 });
    }

    session.status = status;
    await session.save();

    // Send email if accepted (non-blocking — wrapped in try/catch inside the util)
    if (status === 'Accepted') {
        await sendMentorshipAcceptedEmail(
            session.student.email,
            session.student.name,
            session.alumni.name,
            session.topic
        );
    }

    return session;
};

/**
 * Mark a session as complete and add session notes (alumni).
 * Updates alumni's mentorship counts and awards badge if threshold met.
 */
const completeSession = async (sessionId, sessionNotes, alumniUser) => {
    const session = await Mentorship.findById(sessionId);
    if (!session) throw Object.assign(new Error('Session not found'), { statusCode: 404 });

    if (session.alumni.toString() !== alumniUser._id.toString()) {
        throw Object.assign(new Error('Not authorized'), { statusCode: 403 });
    }

    session.status       = 'Completed';
    session.sessionNotes = sessionNotes || '';
    await session.save();

    // Update alumni mentorship stats
    await User.findByIdAndUpdate(session.alumni, {
        $inc: { mentorshipsCount: 1, studentsHelped: 1 },
    });

    // Non-blocking badge check
    checkAndAwardBadges(session.alumni.toString(), 'mentorship_complete').catch(() => {});

    return session;
};

/**
 * Submit student feedback and update alumni's average rating.
 */
const submitFeedback = async (sessionId, rating, comment, studentUser) => {
    const session = await Mentorship.findById(sessionId);
    if (!session) throw Object.assign(new Error('Session not found'), { statusCode: 404 });

    if (session.status !== 'Completed') {
        throw Object.assign(new Error('Can only submit feedback for completed sessions'), { statusCode: 400 });
    }

    if (session.student.toString() !== studentUser._id.toString()) {
        throw Object.assign(new Error('Not authorized'), { statusCode: 403 });
    }

    session.studentFeedback = { rating, comment };
    await session.save();

    // Recalculate and persist the alumni's average rating
    const allFeedback = await Mentorship.find({
        alumni: session.alumni,
        'studentFeedback.rating': { $exists: true, $ne: null },
    }).select('studentFeedback.rating');

    if (allFeedback.length > 0) {
        const avg = allFeedback.reduce((sum, s) => sum + s.studentFeedback.rating, 0) / allFeedback.length;
        await User.findByIdAndUpdate(session.alumni, { rating: Math.round(avg * 10) / 10 });
    }

    return session;
};

module.exports = {
    requestSession,
    getMySessions,
    respondToSession,
    completeSession,
    submitFeedback,
};
