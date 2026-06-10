const User = require('../models/User');
const { getMatchedAlumni } = require('../utils/matchingAlgorithm');

const getMatches = async (req, res) => {
    try {
        const student = await User.findById(req.user._id);
        const { industry, availability, skill, search } = req.query;

        let filter = {
            role: 'alumni',
            verificationStatus: 'Verified',
            isSuspended: false,
        };

        if (industry) filter.industry = { $regex: industry, $options: 'i' };
        if (availability === 'true') filter.availableForMentorship = true;
        if (skill) filter.skills = { $in: [new RegExp(skill, 'i')] };
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { company: { $regex: search, $options: 'i' } },
                { designation: { $regex: search, $options: 'i' } }
            ];
        }

        const alumni = await User.find(filter)
            .select('name profilePicture company designation industry skills careerInterests department location availableForMentorship graduationYear badges bio');

        const matched = getMatchedAlumni(student, alumni);
        res.json(matched);

    } catch (error) {
        res.status(500).json({ message: err.message });
    }
};

const getDirectory = async (req, res) => {
    try {
        const alumni = await User.find({
            role: 'alumni',
            verificationStatus: 'Verified',
            isSuspended: false,
        })
            .select('name profilePicture company designation industry skills careerInterests department location availableForMentorship graduationYear badges bio');
        res.json(alumni);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const getAlumniById = async (req, res) => {
    try {
        const alumni = await User.findById(req.params.id).select('-password');
        if (!alumni || alumni.role !== 'alumni') {
            return res.status(404).json({ message: 'Alumni not found' });
        }
        res.json(alumni);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { getMatches, getDirectory, getAlumniById };