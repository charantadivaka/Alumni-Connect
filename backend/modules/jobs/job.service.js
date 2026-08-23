'use strict';

/**
 * Job Service
 * ────────────
 * Business logic for job listings and operations.
 * Extracted from jobController.js.
 */

const Job = require('../../models/Job');
const { invalidatePattern } = require('../../config/redis');
const { escapeRegex }       = require('../../shared/utils/escapeRegex');
const { esClient }          = require('../../config/elasticsearch');

const JOB_CACHE_PATTERN = '__express__:*:/api/jobs*';

/**
 * Build a Mongoose filter object from query parameters.
 */
const buildJobFilter = ({ search, type, location, skill }) => {
    const filter = { isActive: true };

    if (search) {
        const terms = search.trim().split(/\s+/).filter(t => t).map(escapeRegex);
        if (terms.length > 0) {
            filter.$and = terms.map(term => ({
                $or: [
                    { title:    { $regex: term, $options: 'i' } },
                    { company:  { $regex: term, $options: 'i' } },
                    { location: { $regex: term, $options: 'i' } },
                ]
            }));
        }
    }
    if (type)     filter.jobType  = type;
    if (location) filter.location = { $regex: escapeRegex(location), $options: 'i' };
    if (skill)    filter.skills   = { $in: [new RegExp(escapeRegex(skill), 'i')] };

    return filter;
};

/**
 * Fetch paginated list of active jobs.
 * Uses Elasticsearch for text search (fast, fuzzy), falls back to MongoDB regex if ES errors.
 */
const getAllJobs = async (query) => {
    const page   = parseInt(query.page,  10) || 1;
    const limit  = parseInt(query.limit, 10) || 50;
    const skip   = (page - 1) * limit;

    const filter = buildJobFilter(query);

    // Override text-search part with ES results if ES is available
    if (query.search && esClient) {
        let jobIds = null;
        try {
            const { hits } = await esClient.search({
                index: 'jobs',
                body: {
                    query: {
                        bool: {
                            must: [
                                { match: { isActive: true } },
                                {
                                    multi_match: {
                                        query: query.search,
                                        fields: ['title^3', 'company^2', 'location', 'description'],
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
            jobIds = hits.hits.map(h => h._id);
        } catch (err) {
            console.error('[Elasticsearch] Job search failed, falling back to MongoDB regex:', err.message);
        }

        if (jobIds !== null) {
            // ES returned IDs (may be empty — honour it as a valid empty result)
            delete filter.$and;
            filter._id = { $in: jobIds };
        }
        // If jobIds is null (ES error), filter already has the MongoDB $and regex from buildJobFilter
    }

    const [total, jobs] = await Promise.all([
        Job.countDocuments(filter),
        Job.find(filter)
            .populate('postedBy', 'name company designation profilePicture')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
    ]);

    return { jobs, total, page, totalPages: Math.max(1, Math.ceil(total / limit)) };
};

/** Fetch a single job by ID. */
const getJobById = async (id) => {
    const job = await Job.findById(id)
        .populate('postedBy', 'name company designation profilePicture linkedin');
    if (!job) throw Object.assign(new Error('Job not found'), { statusCode: 404 });
    return job;
};

/**
 * Create a new job posting.
 * Enforces that alumni can only post for their own company.
 */
const createJob = async (data, user) => {
    if (user.role === 'alumni') {
        if (!user.company) {
            throw Object.assign(
                new Error('Please update your profile with your company name before posting jobs.'),
                { statusCode: 400 }
            );
        }
        if (data.company && data.company.toLowerCase().trim() !== user.company.toLowerCase().trim()) {
            throw Object.assign(
                new Error(`You can only post jobs for your company (${user.company}).`),
                { statusCode: 400 }
            );
        }
    }

    const job = await Job.create({ ...data, postedBy: user._id });
    await invalidatePattern(JOB_CACHE_PATTERN);
    return job;
};

/** Update an existing job — only the owner or admin can update. */
const updateJob = async (jobId, data, user) => {
    const job = await Job.findById(jobId);
    if (!job) throw Object.assign(new Error('Job not found'), { statusCode: 404 });

    // Allow admin to edit any job (e.g. for moderation); otherwise only owner can update
    if (job.postedBy.toString() !== user._id.toString() && user.role !== 'admin') {
        throw Object.assign(new Error('Not authorized'), { statusCode: 403 });
    }

    if (user.role === 'alumni' && data.company) {
        if (!user.company) {
            throw Object.assign(
                new Error('Please update your profile with your company name before updating jobs.'),
                { statusCode: 400 }
            );
        }
        if (data.company.toLowerCase().trim() !== user.company.toLowerCase().trim()) {
            throw Object.assign(
                new Error(`You can only post jobs for your company (${user.company}).`),
                { statusCode: 400 }
            );
        }
    }

    const updated = await Job.findByIdAndUpdate(jobId, data, { new: true });
    await invalidatePattern(JOB_CACHE_PATTERN);
    return updated;
};

/** Delete a job — owner or admin only. */
const deleteJob = async (jobId, user) => {
    const job = await Job.findById(jobId);
    if (!job) throw Object.assign(new Error('Job not found'), { statusCode: 404 });

    const isOwner = job.postedBy.toString() === user._id.toString();
    if (!isOwner && user.role !== 'admin') {
        throw Object.assign(new Error('Not authorized'), { statusCode: 403 });
    }

    await job.deleteOne();
    await invalidatePattern(JOB_CACHE_PATTERN);
};

/** Get jobs posted by the current user. */
const getMyJobs = async (userId) => {
    return Job.find({ postedBy: userId }).sort({ createdAt: -1 });
};

/** Toggle a job's active/inactive status. */
const toggleJobStatus = async (jobId, userId) => {
    const job = await Job.findById(jobId);
    if (!job) throw Object.assign(new Error('Job not found'), { statusCode: 404 });

    if (job.postedBy.toString() !== userId.toString()) {
        throw Object.assign(new Error('Not authorized'), { statusCode: 403 });
    }

    job.isActive = !job.isActive;
    await job.save();
    await invalidatePattern(JOB_CACHE_PATTERN);
    return job;
};

/** Report a job listing. */
const reportJob = async (jobId, userId) => {
    const job = await Job.findById(jobId);
    if (!job) throw Object.assign(new Error('Job not found'), { statusCode: 404 });

    if (job.reports.includes(userId)) {
        throw Object.assign(new Error('You have already reported this job'), { statusCode: 400 });
    }

    job.reports.push(userId);
    await job.save();
    await invalidatePattern(JOB_CACHE_PATTERN);
};

module.exports = {
    getAllJobs, getJobById, createJob, updateJob,
    deleteJob, getMyJobs, toggleJobStatus, reportJob,
};
