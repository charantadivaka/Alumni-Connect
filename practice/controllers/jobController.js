const Job = require('../models/Job');
const JobApplication = require('../models/JobApplication');

const getAllJobs = async (req, res) => {
    try {
        const { search, type, location, skill } = req.query;
        const filter = { isActive: true };
        if (search) filter.$or = [
            { title: { $regex: search, $options: 'i' } },
            { company: { $regex: search, $options: 'i' } }
        ];
        if (type) filter.jobType = type;
        if (location) filter.location = { $regex: location, $options: 'i' };
        if (skill) filter.skills = { $in: [new RegExp(skill, 'i')] };

        const jobs = await Job.find(filter)
            .populate('postedBy', 'name company designation profilePicture')
            .sort({ createdAt: -1 });
        res.json(jobs);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const getJobById = async (req, res) => {
    try {
        const job = await Job.findById(req.params.id).populate('postedBy', 'name company designation profilePicture linkedin');
        if (!job) return res.status(404).json({ message: 'Job not found' });
        res.json(job);
    } catch (error) {
        res.status(500).json({ message: err.message });
    }
};

const createJob = async (req, res) => {
    try {
        const job = await Job.create({ ...req.body, postedBy: req.user._id });
        res.status(201).json(job);
    } catch (error) {
        res.status(500).json({ message: err.message });
    }
};

const updateJob = async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);
        if (!job) return res.status(404).json({ message: 'Job not found' });
        if (job.postedBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        const updated = await Job.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: err.message });
    }
};

const deleteJob = async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);
        if (!job) return res.status(404).json({ message: 'Job not found' });
        if (job.postedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }
        await job.deleteOne();
        res.json({ message: 'Job deleted' });
    } catch (error) {
        res.status(500).json({ message: err.message });
    }
};

const getMyJobs = async (req, res) => {
    try {
        const jobs = await Job.find({ postedBy: req.user._id }).sort({ createdAt: -1 });
        res.json(jobs);
    } catch (error) {
        res.status(500).json({ message: err.message });
    }
};

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
    } catch (error) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = {
    getAllJobs,
    getJobById,
    createJob,
    updateJob,
    deleteJob,
    getMyJobs,
    toggleJobStatus
};