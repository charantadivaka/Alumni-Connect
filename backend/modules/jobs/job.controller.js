'use strict';

const jobService = require('./job.service');
const { sendSuccess } = require('../../shared/utils/response');

const getJobs = async (req, res, next) => {
    try {
        const result = await jobService.getAllJobs(req.query);
        sendSuccess(res, result);
    } catch (err) {
        next(err);
    }
};

const getJobById = async (req, res, next) => {
    try {
        const job = await jobService.getJobById(req.params.id);
        sendSuccess(res, job);
    } catch (err) {
        next(err);
    }
};

const createJob = async (req, res, next) => {
    try {
        const job = await jobService.createJob(req.body, req.user);
        sendSuccess(res, job, 'Job created successfully', 201);
    } catch (err) {
        next(err);
    }
};

const updateJob = async (req, res, next) => {
    try {
        const job = await jobService.updateJob(req.params.id, req.body, req.user);
        sendSuccess(res, job, 'Job updated successfully');
    } catch (err) {
        next(err);
    }
};

const deleteJob = async (req, res, next) => {
    try {
        await jobService.deleteJob(req.params.id, req.user);
        sendSuccess(res, null, 'Job deleted successfully');
    } catch (err) {
        next(err);
    }
};

const getMyJobs = async (req, res, next) => {
    try {
        const jobs = await jobService.getMyJobs(req.user._id);
        sendSuccess(res, jobs);
    } catch (err) {
        next(err);
    }
};

const updateJobStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        const job = await jobService.updateJobStatus(req.params.id, req.user._id, status);
        sendSuccess(res, job, `Job status updated to ${job.status}`);
    } catch (err) {
        next(err);
    }
};

const duplicateJob = async (req, res, next) => {
    try {
        const job = await jobService.duplicateJob(req.params.id, req.user._id);
        sendSuccess(res, job, 'Job duplicated successfully', 201);
    } catch (err) {
        next(err);
    }
};

const reportJob = async (req, res, next) => {
    try {
        await jobService.reportJob(req.params.id, req.user._id);
        sendSuccess(res, null, 'Job reported to admins');
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getJobs, getJobById, createJob, updateJob,
    deleteJob, getMyJobs, updateJobStatus, duplicateJob, reportJob
};
