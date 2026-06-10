const Job = require('../models/Job');
const JobApplication = require('../models/JobApplication');

// @desc  Get all active jobs (with filters)
// @route GET /api/jobs
const getAllJobs = async (req, res) => {
    try {
        const { search, type, location, skill } = req.query;
        const filter = { isActive: true };

        if (search) filter.$or = [
            { title: { $regex: search, $options: 'i' } },
            { company: { $regex: search, $options: 'i' } },
        ];
        if (type)     filter.jobType = type;
        if (location) filter.location = { $regex: location, $options: 'i' };
        if (skill)    filter.skills = { $in: [new RegExp(skill, 'i')] };

        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 50;
        const skip = (page - 1) * limit;

        const total = await Job.countDocuments(filter);
        const jobs = await Job.find(filter)
            .populate('postedBy', 'name company designation profilePicture')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.set('X-Total-Count', total);
        res.set('X-Total-Pages', Math.ceil(total / limit));
        res.json(jobs);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc  Get single job
// @route GET /api/jobs/:id
const getJobById = async (req, res) => {
    try {
        const job = await Job.findById(req.params.id)
            .populate('postedBy', 'name company designation profilePicture linkedin');
        if (!job) return res.status(404).json({ message: 'Job not found' });
        res.json(job);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc  Create job (alumni only)
// @route POST /api/jobs
const createJob = async (req, res) => {
    try {
        const job = await Job.create({ ...req.body, postedBy: req.user._id });
        res.status(201).json(job);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc  Update job (owner only)
// @route PUT /api/jobs/:id
const updateJob = async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);
        if (!job) return res.status(404).json({ message: 'Job not found' });
        if (job.postedBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        const updated = await Job.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc  Delete job (owner or admin)
// @route DELETE /api/jobs/:id
const deleteJob = async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);
        if (!job) return res.status(404).json({ message: 'Job not found' });

        const isOwner = job.postedBy.toString() === req.user._id.toString();
        if (!isOwner && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }
        await job.deleteOne();
        res.json({ message: 'Job deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc  Get jobs posted by alumni
// @route GET /api/jobs/my
const getMyJobs = async (req, res) => {
    try {
        const jobs = await Job.find({ postedBy: req.user._id }).sort({ createdAt: -1 });
        res.json(jobs);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc  Toggle job active status
// @route PUT /api/jobs/:id/toggle
const toggleJobStatus = async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);
        if (!job) return res.status(404).json({ message: 'Job not found' });
        if (job.postedBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        job.isActive = !job.isActive;
        await job.save();
        res.json({ isActive: job.isActive });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc  Report a job
// @route PUT /api/jobs/:id/report
const reportJob = async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);
        if (!job) return res.status(404).json({ message: 'Job not found' });
        
        const alreadyReported = job.reports.includes(req.user._id);
        if (alreadyReported) {
            return res.status(400).json({ message: 'You have already reported this job' });
        }
        
        job.reports.push(req.user._id);
        await job.save();
        res.json({ message: 'Job reported successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { getAllJobs, getJobById, createJob, updateJob, deleteJob, getMyJobs, toggleJobStatus, reportJob };
