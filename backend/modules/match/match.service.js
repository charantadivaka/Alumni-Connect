'use strict';

/**
 * Match Service
 * ─────────────
 * Business logic for matching students with alumni.
 */

const User = require('../../models/User');
const { getMatchedAlumni } = require('../../utils/matchingAlgorithm');
const { escapeRegex }       = require('../../shared/utils/escapeRegex');
const { esClient }          = require('../../config/elasticsearch');

async function applySearchAndFilters(filter, query, excludeUserId) {
    const { industry, availability, skill, search } = query;

    if (industry) filter.industry = { $regex: escapeRegex(industry), $options: 'i' };
    if (availability === 'true') filter.mentorshipAvailability = 'Available';
    if (skill) filter.skills = { $in: [new RegExp(escapeRegex(skill), 'i')] };

    // Try Elasticsearch first for fast fuzzy search, fall back to MongoDB regex on error
    if (search) {
        let userIds = null;
        if (esClient) {
            try {
                const { hits } = await esClient.search({
                    index: 'users',
                    body: {
                        query: {
                            bool: {
                                must: [
                                    { match: { role: 'alumni' } },
                                    {
                                        multi_match: {
                                            query: search,
                                            fields: ['name^3', 'company^2', 'designation^2', 'skills', 'industry'],
                                            fuzziness: 'AUTO',
                                            operator: 'or'
                                        }
                                    }
                                ]
                            }
                        },
                        _source: false,
                        size: 500
                    }
                });
                userIds = hits.hits.map(h => h._id);
            } catch (err) {
                console.error('[Elasticsearch] User search failed, falling back to MongoDB regex:', err.message);
            }
        }

        if (userIds !== null) {
            // ES returned results (may be empty — honour that)
            filter._id = { $in: userIds, $ne: excludeUserId };
        } else {
            // ES not available — use MongoDB regex
            const terms = search.trim().split(/\s+/).map(escapeRegex);
            filter.$and = terms.map(term => ({
                $or: [
                    { name:        { $regex: term, $options: 'i' } },
                    { company:     { $regex: term, $options: 'i' } },
                    { designation: { $regex: term, $options: 'i' } },
                    { industry:    { $regex: term, $options: 'i' } },
                    { skills:      { $regex: term, $options: 'i' } }
                ]
            }));
        }
    }
}

/**
 * Get smart-matched alumni for logged-in student.
 * Hard boundary: Students ONLY see alumni from their own college.
 */
const getMatches = async (studentUser, query) => {
    const student = await User.findById(studentUser._id).populate('college', 'name');

    if (!student || !student.college) {
        return { alumni: [], noCollege: true, collegeName: '', total: 0, totalPages: 1 };
    }

    let filter = {
        _id: { $ne: student._id },
        role: 'alumni',
        verificationStatus: 'Verified',
        isSuspended: false,
        college: student.college._id,
    };

    await applySearchAndFilters(filter, query, student._id);

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
        totalPages: Math.max(1, Math.ceil(matched.length / limit)),
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

    await applySearchAndFilters(filter, query, requesterUser._id);

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

    return { alumni, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
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
