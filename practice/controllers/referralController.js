const Referral = require('../models/Referral');
const sendNotification = require('../utils/sendNotification');

let _io;
const setIo = (io) => { _io = io; };

const requestReferral = async (req, res) => {
    try {
        const { alumniId, jobTitle, company, message, resumeId } = req.body;
        const referral = await Referral.create({
            student: req.user._id,
            alumni: alumniId,
            jobTitle, company,
            message: message || '',
            resume: resumeId || undefined,
        });

        await sendNotification(_io, alumniId, 'referral_request',
            `${req.user.name} is requesting a referral at ${company} for ${jobTitle}`,
            '/alumni/referrals'
        );

        res.status(201).json(referral);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const getMyReferrals = async (req, res) => {
    try {
        const filter = req.user.role === 'student'
            ? { student: req.user._id }
            : { alumni: req.user._id };

        const referrals = await Referral.find(filter)
            .populate('student', 'name profilePicture department skills')
            .populate('alumni', 'name profilePicture company designation')
            .populate('resume', 'name')
            .sort({ createdAt: -1 });

        res.json(referrals);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const respondReferral = async (req, res) => {
    try {
        const { status, alumniNote } = req.body;
        const validStatuses = ['Submitted', 'Rejected', 'Not Available'];
        if (!validStatuses.includes(status)) return res.status(400).json({ message: 'Invalid status' });

        const referral = await Referral.findById(req.params.id);
        if (!referral) return res.status(404).json({ message: 'Not found' });
        if (referral.alumni.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        referral.status = status;
        referral.alumniNote = alumniNote || '';
        await referral.save();

        await sendNotification(_io, referral.student, 'referral_update',
            `Your referral request for ${referral.jobTitle} at ${referral.company} is now: ${status}`,
            '/student/referrals'
        );

        res.json(referral);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { requestReferral, getMyReferrals, respondReferral, setIo };

