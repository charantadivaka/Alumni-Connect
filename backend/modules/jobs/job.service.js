'use strict';

/**
 * Job Service
 * ────────────
 * Business logic for job listings and operations.
 * Extracted from jobController.js.
 */

const Job = require('../../models/Job');
const { invalidatePattern } = require('../../config/redis');

const JOB_CACHE_PATTERN = '__express__/api/jobs*';

/**
 * Build a Mongoose filter object from query parameters.
 */
const buildJobFilter = ({ search, type, location, skill }) => {
    const filter = { isActive: true };

    if (search) filter.$or = [
        { title:   { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
    ];
    if (type)     filter.jobType  = type;
    if (location) filter.location = { $regex: location, $options: 'i' };
    if (skill)    filter.skills   = { $in: [new RegExp(skill, 'i')] };

    return filter;
};

/**
 * Fetch paginated list of active jobs.
 */
const getAllJobs = async (query) => {
    const filter = buildJobFilter(query);
    const page   = parseInt(query.page,  10) || 1;
    const limit  = parseInt(query.limit, 10) || 50;
    const skip   = (page - 1) * limit;

    const [total, jobs] = await Promise.all([
        Job.countDocuments(filter),
        Job.find(filter)
            .populate('postedBy', 'name company designation profilePicture')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
    ]);

    return { jobs, total, page, totalPages: Math.ceil(total / limit) };
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

/** Update an existing job — only the owner can update. */
const updateJob = async (jobId, data, user) => {
    const job = await Job.findById(jobId);
    if (!job) throw Object.assign(new Error('Job not found'), { statusCode: 404 });

    if (job.postedBy.toString() !== user._id.toString()) {
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
