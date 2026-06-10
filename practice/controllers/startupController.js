const Startup = require('../models/Startup');

const getStartups = async (req, res) => {
    try {
        const { stage, skill } = req.query;
        const filter = { isActive: true };
        if (stage) filter.stage = stage;
        if (skill) filter.skillsNeeded = { $in: [new RegExp(skill, 'i')] };

        const startups = await Startup.find(filter)
            .populate('founder', 'name profilePicture company designation')
            .sort({ createdAt: -1 });
        res.json(startups);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const getMyStartup = async (req, res) => {
    try {
        const startup = await Startup.findOne({ founder: req.user._id });
        res.json(startup);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const createOrUpdateStartup = async (req, res) => {
    try {
        let startup = await Startup.findOne({ founder: req.user._id });
        if (startup) {
            Object.assign(startup, req.body);
            await startup.save();
        } else {
            startup = await Startup.create({ ...req.body, founder: req.user._id });
        }
        res.status(201).json(startup);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const requestCollaboration = async (req, res) => {
    try {
        const { message } = req.body;
        const startup = await Startup.findById(req.params.id);
        if (!startup) return res.status(404).json({ message: 'Startup not found' });

        const alreadyRequested = startup.collaborationRequests.some(
            r => r.student.toString() === req.user._id.toString()
        );
        if (alreadyRequested) return res.status(400).json({ message: 'Already requested' });

        startup.collaborationRequests.push({ student: req.user._id, message });
        await startup.save();
        res.status(201).json({ message: 'Collaboration request sent' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const respondCollaboration = async (req, res) => {
    try {
        const { status } = req.body;
        const startup = await Startup.findById(req.params.id);
        if (!startup) return res.status(404).json({ message: 'Not found' });
        if (startup.founder.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        const collab = startup.collaborationRequests.id(req.params.reqId);
        if (!collab) return res.status(404).json({ message: 'Request not found' });
        collab.status = status;
        await startup.save();
        res.json({ message: `Request ${status}` });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { getStartups, getMyStartup, createOrUpdateStartup, requestCollaboration, respondCollaboration };
