const Mentorship = require('../models/Mentorship');
const MentorSlot = require('../models/MentorSlot');
const sendNotification = require('../utils/sendNotification');

let _io;
const setIo = (io) => { _io = io; };

const requestSession = async (req, res) => {
    try {
        const { alumniId, slotId, topic, goals } = req.body;

        const session = await Mentorship.create({
            student: req.user._id,
            alumni: alumniId,
            slot: slotId || undefined,
            topic, goals,
        });

        if (slotId) {
            await MentorSlot.findByIdAndUpdate(slotId, { isBooked: true });
        }

        await sendNotification(_io, alumniId, 'mentorship_request',
            `${req.user.name} requested a mentorship session: "${topic}"`,
            '/alumni/mentorship'
        );

        res.status(201).json(session);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const getMySessions = async (req, res) => {
    try {
        const filter = req.user.role === 'student'
            ? { student: req.user._id }
            : { alumni: req.user._id };

        const sessions = await Mentorship.find(filter)
            .populate('student', 'name profilePicture department skills')
            .populate('alumni', 'name profilePicture company designation')
            .populate('slot', 'date startTime duration')
            .sort({ createdAt: -1 });

        res.json(sessions);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const respondSession = async (req, res) => {
    try {
        const { status } = req.body; // 'Accepted' | 'Rejected'
        if (!['Accepted', 'Rejected'].includes(status)) {
            return res.status(400).json({ message: 'Status must be Accepted or Rejected' });
        }

        const session = await Mentorship.findById(req.params.id);
        if (!session) return res.status(404).json({ message: 'Session not found' });
        if (session.alumni.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        session.status = status;
        await session.save();

        await sendNotification(_io, session.student, 'mentorship_response',
            `Your mentorship request was ${status.toLowerCase()} by alumni`,
            '/student/mentorship'
        );

        res.json(session);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const completeSession = async (req, res) => {
    try {
        const { sessionNotes } = req.body;
        const session = await Mentorship.findById(req.params.id);
        if (!session) return res.status(404).json({ message: 'Not found' });
        if (session.alumni.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        session.status = 'Completed';
        session.sessionNotes = sessionNotes || '';
        await session.save();

        await sendNotification(_io, session.student, 'mentorship_complete',
            'Your mentorship session has been marked complete. Please leave feedback!',
            '/student/mentorship'
        );

        res.json(session);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const submitFeedback = async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const session = await Mentorship.findById(req.params.id);
        if (!session) return res.status(404).json({ message: 'Not found' });
        if (session.student.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        session.studentFeedback = { rating, comment };
        await session.save();
        res.json(session);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { requestSession, getMySessions, respondSession, completeSession, submitFeedback, setIo };
