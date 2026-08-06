'use strict';

/**
 * Interview Service
 * ─────────────────
 * Business logic for booking and managing mock interviews.
 */

const MockInterview = require('../../models/MockInterview');
const MentorSlot = require('../../models/MentorSlot');

/**
 * Book a mock interview slot.
 * Returns { interview, alumniId } for notifications.
 */
const bookInterview = async (data, studentUser) => {
    const { alumniId, slotId, interviewType, targetRole } = data;

    const interview = await MockInterview.create({
        student:       studentUser._id,
        alumni:        alumniId,
        slot:          slotId || undefined,
        interviewType, 
        targetRole,
    });

    if (slotId) {
        await MentorSlot.findByIdAndUpdate(slotId, { isBooked: true });
    }

    return { interview, alumniId };
};

/** Get interviews involving the current user. */
const getMyInterviews = async (user) => {
    const filter = user.role === 'student'
        ? { student: user._id }
        : { alumni:  user._id };

    return MockInterview.find(filter)
        .populate('student', 'name profilePicture department')
        .populate('alumni',  'name profilePicture company designation')
        .populate('slot', 'date startTime duration')
        .sort({ createdAt: -1 });
};

/**
 * Respond to an interview request (alumni only).
 * Returns { interview, studentId } for notifications.
 */
const respondInterview = async (interviewId, status, alumniUser) => {
    if (!['Accepted', 'Rejected'].includes(status)) {
        throw Object.assign(new Error('Invalid status'), { statusCode: 400 });
    }

    const interview = await MockInterview.findById(interviewId);
    if (!interview) throw Object.assign(new Error('Interview not found'), { statusCode: 404 });

    if (interview.alumni.toString() !== alumniUser._id.toString()) {
        throw Object.assign(new Error('Not authorized'), { statusCode: 403 });
    }

    interview.status = status;
    await interview.save();

    return { interview, studentId: interview.student };
};

/**
 * Submit feedback for a completed interview (alumni only).
 * Returns { interview, studentId } for notifications.
 */
const submitFeedback = async (interviewId, data, alumniUser) => {
    const { strengths, improvements, rating } = data;
    
    const interview = await MockInterview.findById(interviewId);
    if (!interview) throw Object.assign(new Error('Interview not found'), { statusCode: 404 });

    if (interview.status !== 'Accepted') {
        throw Object.assign(new Error('Can only submit feedback for accepted interviews'), { statusCode: 400 });
    }

    if (interview.alumni.toString() !== alumniUser._id.toString()) {
        throw Object.assign(new Error('Not authorized'), { statusCode: 403 });
    }

    interview.feedback = { strengths, improvements, rating };
    interview.status   = 'Completed';
    await interview.save();

    return { interview, studentId: interview.student };
};

module.exports = { bookInterview, getMyInterviews, respondInterview, submitFeedback };
