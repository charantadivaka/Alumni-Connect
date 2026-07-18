const MockInterview = require('../models/MockInterview');
const MentorSlot = require('../models/MentorSlot');
const sendNotification = require('../utils/sendNotification');

let _io;
const setIo = (io) => { _io = io; };

// @desc  Book a mock interview
// @route POST /api/interviews
const bookInterview = async (req, res) => {
    try {
        const { alumniId, slotId, interviewType, targetRole } = req.body;
        const interview = await MockInterview.create({
            student: req.user._id,
            alumni: alumniId,
            slot: slotId || undefined,
            interviewType, targetRole,
        });

        if (slotId) await MentorSlot.findByIdAndUpdate(slotId, { isBooked: true });

        await sendNotification(_io, alumniId, 'interview_request',
            `${req.user.name} booked a ${interviewType} mock interview with you`,
            '/alumni/interviews'
        );

        res.status(201).json(interview);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc  Get my interviews
// @route GET /api/interviews/my
const getMyInterviews = async (req, res) => {
    try {
        const filter = req.user.role === 'student'
            ? { student: req.user._id }
            : { alumni: req.user._id };

        const interviews = await MockInterview.find(filter)
            .populate('student', 'name profilePicture department')
            .populate('alumni',  'name profilePicture company designation')
            .populate('slot', 'date startTime duration')
            .sort({ createdAt: -1 });

        res.json(interviews);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc  Respond to interview request (alumni)
// @route PUT /api/interviews/:id/respond
const respondInterview = async (req, res) => {
    try {
        const { status } = req.body;
        if (!['Accepted', 'Rejected'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }
        const interview = await MockInterview.findById(req.params.id);
        if (!interview) return res.status(404).json({ message: 'Not found' });
        if (interview.alumni.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        interview.status = status;
        await interview.save();

        await sendNotification(_io, interview.student, 'interview_response',
            `Your mock interview request was ${status.toLowerCase()}`,
            '/student/interviews'
        );

        res.json(interview);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc  Submit feedback after interview (alumni)
// @route PUT /api/interviews/:id/feedback
const submitFeedback = async (req, res) => {
    try {
        const { strengths, improvements, rating } = req.body;
        const interview = await MockInterview.findById(req.params.id);
        if (!interview) return res.status(404).json({ message: 'Not found' });
        if (interview.alumni.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        interview.feedback = { strengths, improvements, rating };
        interview.status = 'Completed';
        await interview.save();

        await sendNotification(_io, interview.student, 'interview_feedback',
            'Your mock interview feedback is ready!',
            '/student/interviews'
        );

        res.json(interview);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { bookInterview, getMyInterviews, respondInterview, submitFeedback, setIo };
