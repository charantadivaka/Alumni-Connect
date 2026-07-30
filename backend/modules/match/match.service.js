'use strict';

/**
 * Match Service
 * ─────────────
 * Business logic for matching students with alumni.
 */

const User = require('../../models/User');
const { getMatchedAlumni } = require('../../utils/matchingAlgorithm');

/**
 * Get smart-matched alumni for logged-in student.
 * Hard boundary: Students ONLY see alumni from their own college.
 */
const getMatches = async (studentUser, query) => {
    const student = await User.findById(studentUser._id).populate('college', 'name');
    const { industry, availability, skill, search } = query;

    if (!student.college) {
        return { alumni: [], noCollege: true, collegeName: '', total: 0, totalPages: 0 };
    }

    let filter = {
        _id: { $ne: student._id },
        role: 'alumni',
        verificationStatus: 'Verified',
        isSuspended: false,
        college: student.college._id,
    };

    if (industry)      filter.industry = { $regex: industry, $options: 'i' };
    if (availability === 'true') filter.mentorshipAvailability = 'Available';
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
    
    const page  = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 50;
    const paginatedMatched = matched.slice((page - 1) * limit, page * limit);

    return {
        alumni: paginatedMatched,
        noCollege: false,
        collegeName: student.college.name,
        total: matched.length,
        totalPages: Math.ceil(matched.length / limit),
    };
};

/** Get unscored alumni directory. */
const getDirectory = async (requesterUser, query) => {
    const requester = await User.findById(requesterUser._id).populate('college', 'name');

    const filter = {
        _id: { $ne: requesterUser._id },
        role: 'alumni',
        verificationStatus: 'Verified',
        isSuspended: false,
    };

    if (requester.college) {
        filter.college = requester.college._id;
    }

    const page  = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 50;
    const skip  = (page - 1) * limit;

    const [total, alumni] = await Promise.all([
        User.countDocuments(filter),
        User.find(filter)
            .populate('college', 'name')
            .select('name profilePicture company designation industry skills location mentorshipAvailability graduationYear badges bio department college')
            .skip(skip)
            .limit(limit)
    ]);

    return { alumni, total, totalPages: Math.ceil(total / limit) };
};

/** Get single alumni profile. */
const getAlumniById = async (alumniId) => {
    const alumni = await User.findById(alumniId)
        .populate('college', 'name exampleFormat')
        .select('-password');
        
    if (!alumni || alumni.role !== 'alumni') {
        throw Object.assign(new Error('Alumni not found'), { statusCode: 404 });
    }
    
    return alumni;
};

module.exports = { getMatches, getDirectory, getAlumniById };
