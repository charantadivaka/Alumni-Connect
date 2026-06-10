const User = require('../models/User');
const { getMatchedAlumni } = require('../utils/matchingAlgorithm');

// @desc  Get smart-matched alumni for logged-in student
// @route GET /api/match
const getMatches = async (req, res) => {
    try {
        const student = await User.findById(req.user._id).populate('college', 'name');
        const { industry, availability, skill, search } = req.query;

        // ── Hard college boundary enforcement ────────────────────────────────
        // Students ONLY see alumni from their own college. No exceptions.
        if (!student.college) {
            // Student hasn't set a college — return empty with a flag so the
            // frontend can prompt them to update their profile.
            return res.json({ alumni: [], noCollege: true });
        }

        let filter = {
            role: 'alumni',
            verificationStatus: 'Verified',
            isSuspended: false,
            college: student.college._id,   // always scoped to student's college
        };

        if (industry)      filter.industry = { $regex: industry, $options: 'i' };
        if (availability === 'true') filter.mentorshipAvailability = { $in: ['Available', 'Limited'] };
        if (skill)         filter.skills = { $in: [new RegExp(skill, 'i')] };
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { company: { $regex: search, $options: 'i' } },
                { designation: { $regex: search, $options: 'i' } },
            ];
        }

        const alumni = await User.find(filter)
            .populate('college', 'name')
            .select(
                'name profilePicture company designation industry skills careerInterests department location mentorshipAvailability graduationYear badges bio college yearsOfExperience mentorshipsCount studentsHelped rating createdAt'
            );

        const matched = getMatchedAlumni(student, alumni);
        
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 50;
        const paginatedMatched = matched.slice((page - 1) * limit, page * limit);

        res.set('X-Total-Count', matched.length);
        res.set('X-Total-Pages', Math.ceil(matched.length / limit));
        res.json({ alumni: paginatedMatched, collegeName: student.college.name, noCollege: false });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc  Get all alumni directory (unscored, for browsing)
// @route GET /api/match/directory
const getDirectory = async (req, res) => {
    try {
        const requester = await User.findById(req.user._id).populate('college', 'name');

        const filter = {
            role: 'alumni',
            verificationStatus: 'Verified',
            isSuspended: false,
        };

        // Scope directory to college if requester has one
        if (requester.college) {
            filter.college = requester.college._id;
        }

        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 50;
        const skip = (page - 1) * limit;

        const total = await User.countDocuments(filter);
        const alumni = await User.find(filter)
            .populate('college', 'name')
            .select('name profilePicture company designation industry skills location mentorshipAvailability graduationYear badges bio department college')
            .skip(skip)
            .limit(limit);

        res.set('X-Total-Count', total);
        res.set('X-Total-Pages', Math.ceil(total / limit));
        res.json(alumni);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc  Get single alumni profile
// @route GET /api/match/:id
const getAlumniById = async (req, res) => {
    try {
        const alumni = await User.findById(req.params.id)
            .populate('college', 'name exampleFormat')
            .select('-password');
        if (!alumni || alumni.role !== 'alumni') {
            return res.status(404).json({ message: 'Alumni not found' });
        }
        res.json(alumni);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { getMatches, getDirectory, getAlumniById };


