'use strict';

const adminService = require('./admin.service');
const { sendSuccess } = require('../../shared/utils/response');

const getAllUsers = async (req, res, next) => {
    try {
        const users = await adminService.getAllUsers(req.query);
        sendSuccess(res, users);
    } catch (err) {
        next(err);
    }
};

const getVerificationQueue = async (req, res, next) => {
    try {
        const queue = await adminService.getVerificationQueue();
        sendSuccess(res, queue);
    } catch (err) {
        next(err);
    }
};

const verifyAlumni = async (req, res, next) => {
    try {
        const { status } = req.body;
        const user = await adminService.verifyAlumni(req.params.id, status, req.user, req.ip);
        sendSuccess(res, user, `Alumni status updated to ${status}`);
    } catch (err) {
        next(err);
    }
};

const toggleSuspend = async (req, res, next) => {
    try {
        const user = await adminService.toggleSuspend(req.params.id, req.user, req.ip);
        sendSuccess(res, user, `User ${user.isSuspended ? 'suspended' : 'unsuspended'} successfully`);
    } catch (err) {
        next(err);
    }
};

const getAnalytics = async (req, res, next) => {
    try {
        const stats = await adminService.getAnalytics();
        sendSuccess(res, stats);
    } catch (err) {
        next(err);
    }
};

const getReportedJobs = async (req, res, next) => {
    try {
        const jobs = await adminService.getReportedJobs();
        sendSuccess(res, jobs);
    } catch (err) {
        next(err);
    }
};

const getReportedEvents = async (req, res, next) => {
    try {
        const events = await adminService.getReportedEvents();
        sendSuccess(res, events);
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getAllUsers, getVerificationQueue, verifyAlumni,
    toggleSuspend, getAnalytics, getReportedJobs, getReportedEvents
};
