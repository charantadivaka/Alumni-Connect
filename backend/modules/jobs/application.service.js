'use strict';

/**
 * Application Service
 * ────────────────────
 * Business logic for job applications (apply, review, stage update, withdraw).
 * Extracted from applicationController.js.
 */

const JobApplication = require('../../models/JobApplication');
const Job = require('../../models/Job');

const VALID_STAGES = ['Applied', 'Under Review', 'Interview', 'Offer', 'Rejected'];

/**
 * Apply for a job.
 * Validates job existence, activity, and no-duplicate application.
 * Returns { application, job } so the caller can trigger notifications.
 */
const applyForJob = async (data, applicantUser) => {
    const {
        jobId, resumeId, coverNote,
        rollNo, name, branch, email, mobileNo, cgpa, majorProjects, cvFile, cvFileName,
    } = data;

    const job = await Job.findById(jobId).populate('postedBy', 'name email');
    if (!job || !job.isActive) {
        throw Object.assign(new Error('Job not found or closed'), { statusCode: 404 });
    }

    const existing = await JobApplication.findOne({ job: jobId, applicant: applicantUser._id });
    if (existing) {
        throw Object.assign(new Error('Already applied to this job'), { statusCode: 400 });
    }

    const application = await JobApplication.create({
        job:      jobId,
        applicant: applicantUser._id,
        resume:   resumeId || undefined,
        coverNote: coverNote || '',
        rollNo:   rollNo    || '',
        name:     name      || '',
        branch:   branch    || '',
        email:    email     || '',
        mobileNo: mobileNo  || '',
        cgpa:     cgpa      || '',
        majorProjects: majorProjects || '',
        cvFile:      cvFile      || '',
        cvFileName:  cvFileName  || '',
        stageHistory: [{ stage: 'Applied' }],
    });

    return { application, job };
};

/** Get all applications submitted by the current user. */
const getMyApplications = async (userId) => {
    return JobApplication.find({ applicant: userId })
        .populate('job', 'title company location jobType isActive postedBy')
        .populate('resume', 'name')
        .sort({ createdAt: -1 });
};

/** Get applications for a specific job (alumni who posted it only). */
const getJobApplications = async (jobId, requestingUser) => {
    const job = await Job.findById(jobId);
    if (!job || job.postedBy.toString() !== requestingUser._id.toString()) {
        throw Object.assign(new Error('Not authorized'), { statusCode: 403 });
    }

    return JobApplication.find({ job: jobId, isWithdrawn: false })
        .populate('applicant', 'name email profilePicture department skills careerInterests')
        .populate('resume', 'name fileData')
        .sort({ createdAt: -1 });
};

/** Get all applications for jobs posted by the current alumni. */
const getAlumniApplications = async (alumniId) => {
    const jobs   = await Job.find({ postedBy: alumniId }).select('_id');
    const jobIds = jobs.map(j => j._id);

    return JobApplication.find({ job: { $in: jobIds }, isWithdrawn: false })
        .populate('job',       'title company location jobType')
        .populate('applicant', 'name email profilePicture department skills careerInterests')
        .sort({ createdAt: -1 });
};

/**
 * Update application stage.
 * Returns { application, applicantId } so the caller can notify the student.
 */
const updateApplicationStage = async (applicationId, stage, note, alumniUser) => {
    if (!VALID_STAGES.includes(stage)) {
        throw Object.assign(new Error('Invalid stage'), { statusCode: 400 });
    }

    const app = await JobApplication.findById(applicationId).populate('job', 'title postedBy');
    if (!app) throw Object.assign(new Error('Application not found'), { statusCode: 404 });

    if (app.job.postedBy.toString() !== alumniUser._id.toString()) {
        throw Object.assign(new Error('Not authorized'), { statusCode: 403 });
    }

    app.stage = stage;
    app.stageHistory.push({ stage, note: note || '' });
    await app.save();

    return { application: app, jobTitle: app.job.title, applicantId: app.applicant };
};

/** Withdraw an application (student only). */
const withdrawApplication = async (applicationId, studentId) => {
    const app = await JobApplication.findById(applicationId);
    if (!app) throw Object.assign(new Error('Application not found'), { statusCode: 404 });

    if (app.applicant.toString() !== studentId.toString()) {
        throw Object.assign(new Error('Not authorized'), { statusCode: 403 });
    }

    app.isWithdrawn = true;
    await app.save();
};

module.exports = {
    applyForJob,
    getMyApplications,
    getJobApplications,
    getAlumniApplications,
    updateApplicationStage,
    withdrawApplication,
};
