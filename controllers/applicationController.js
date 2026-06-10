const JobApplication = require('../models/JobApplication');
const Job = require('../models/Job');
const sendNotification = require('../utils/sendNotification');

let _io;
const setIo = (io) => { _io = io; };

// @desc  Apply for a job
// @route POST /api/applications
const applyJob = async (req, res) => {
    try {
        const { 
            jobId, resumeId, coverNote,
            rollNo, name, branch, email, mobileNo, cgpa, majorProjects, cvFile, cvFileName
        } = req.body;

        const job = await Job.findById(jobId);
        if (!job || !job.isActive) return res.status(404).json({ message: 'Job not found or closed' });

        const existing = await JobApplication.findOne({ job: jobId, applicant: req.user._id });
        if (existing) return res.status(400).json({ message: 'Already applied to this job' });

        const application = await JobApplication.create({
            job: jobId,
            applicant: req.user._id,
            resume: resumeId || undefined,
            coverNote: coverNote || '',
            rollNo: rollNo || '',
            name: name || '',
            branch: branch || '',
            email: email || '',
            mobileNo: mobileNo || '',
            cgpa: cgpa || '',
            majorProjects: majorProjects || '',
            cvFile: cvFile || '',
            cvFileName: cvFileName || '',
            stageHistory: [{ stage: 'Applied' }],
        });

        await sendNotification(
            _io, job.postedBy,
            'job_application',
            `${req.user.name} applied for your job: ${job.title}`,
            `/alumni/applications/${job._id}`
        );

        res.status(201).json(application);
    } catch (err) {
        if (err.code === 11000) return res.status(400).json({ message: 'Already applied' });
        res.status(500).json({ message: err.message });
    }
};

// @desc  Get my applications (student)
// @route GET /api/applications/my
const getMyApplications = async (req, res) => {
    try {
        const apps = await JobApplication.find({ applicant: req.user._id })
            .populate('job', 'title company location jobType isActive postedBy')
            .populate('resume', 'name')
            .sort({ createdAt: -1 });
        res.json(apps);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc  Get applications for a job (alumni)
// @route GET /api/applications/job/:jobId
const getJobApplications = async (req, res) => {
    try {
        const job = await Job.findById(req.params.jobId);
        if (!job || job.postedBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        const apps = await JobApplication.find({ job: req.params.jobId, isWithdrawn: false })
            .populate('applicant', 'name email profilePicture department skills careerInterests')
            .populate('resume', 'name fileData')
            .sort({ createdAt: -1 });
        res.json(apps);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc  Get applications for all jobs posted by alumni
// @route GET /api/applications/alumni
const getAlumniApplications = async (req, res) => {
    try {
        const jobs = await Job.find({ postedBy: req.user._id }).select('_id');
        const jobIds = jobs.map(j => j._id);
        const apps = await JobApplication.find({ job: { $in: jobIds }, isWithdrawn: false })
            .populate('job', 'title company location jobType')
            .populate('applicant', 'name email profilePicture department skills careerInterests')
            .sort({ createdAt: -1 });
        res.json(apps);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc  Update application stage (alumni)
// @route PUT /api/applications/:id/stage
const updateStage = async (req, res) => {
    try {
        const { stage, note } = req.body;
        const validStages = ['Applied', 'Under Review', 'Interview', 'Offer', 'Rejected'];
        if (!validStages.includes(stage)) return res.status(400).json({ message: 'Invalid stage' });

        const app = await JobApplication.findById(req.params.id).populate('job', 'title postedBy');
        if (!app) return res.status(404).json({ message: 'Application not found' });
        if (app.job.postedBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        app.stage = stage;
        app.stageHistory.push({ stage, note: note || '' });
        await app.save();

        await sendNotification(
            _io, app.applicant,
            'application_update',
            `Your application for "${app.job.title}" moved to: ${stage}`,
            '/student/applications'
        );

        res.json(app);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc  Withdraw application (student)
// @route DELETE /api/applications/:id
const withdrawApplication = async (req, res) => {
    try {
        const app = await JobApplication.findById(req.params.id);
        if (!app) return res.status(404).json({ message: 'Application not found' });
        if (app.applicant.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        app.isWithdrawn = true;
        await app.save();
        res.json({ message: 'Application withdrawn' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { applyJob, getMyApplications, getJobApplications, getAlumniApplications, updateStage, withdrawApplication, setIo };
