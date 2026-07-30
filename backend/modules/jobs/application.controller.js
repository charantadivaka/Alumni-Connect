'use strict';

const applicationService = require('./application.service');
const { sendSuccess } = require('../../shared/utils/response');

const applyForJob = async (req, res, next) => {
    try {
        const { application, job } = await applicationService.applyForJob(req.body, req.user);
        
        // Notifications are sent via event bus later, but for now we fallback to the service
        const { sendNotification } = require('../../shared/services/notificationService');
        await sendNotification(job.postedBy._id, 'job_application',
            `${req.user.name} applied for your job: ${job.title}`,
            `/alumni/applications/${job._id}`
        );
        
        sendSuccess(res, application, 'Application submitted successfully', 201);
    } catch (err) {
        next(err);
    }
};

const getMyApplications = async (req, res, next) => {
    try {
        const applications = await applicationService.getMyApplications(req.user._id);
        sendSuccess(res, applications);
    } catch (err) {
        next(err);
    }
};

const getJobApplications = async (req, res, next) => {
    try {
        const applications = await applicationService.getJobApplications(req.params.jobId, req.user);
        sendSuccess(res, applications);
    } catch (err) {
        next(err);
    }
};

const getAlumniApplications = async (req, res, next) => {
    try {
        const applications = await applicationService.getAlumniApplications(req.user._id);
        sendSuccess(res, applications);
    } catch (err) {
        next(err);
    }
};

const updateApplicationStage = async (req, res, next) => {
    try {
        const { stage, note } = req.body;
        const { application, jobTitle, applicantId } = await applicationService.updateApplicationStage(
            req.params.id, stage, note, req.user
        );
        
        const { sendNotification } = require('../../shared/services/notificationService');
        await sendNotification(applicantId, 'application_update',
            `Your application for ${jobTitle} has moved to: ${stage}`,
            '/student/applications'
        );
        
        sendSuccess(res, application, 'Application stage updated');
    } catch (err) {
        next(err);
    }
};

const withdrawApplication = async (req, res, next) => {
    try {
        await applicationService.withdrawApplication(req.params.id, req.user._id);
        sendSuccess(res, null, 'Application withdrawn successfully');
    } catch (err) {
        next(err);
    }
};

module.exports = {
    applyForJob, getMyApplications, getJobApplications,
    getAlumniApplications, updateApplicationStage, withdrawApplication
};
