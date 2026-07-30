'use strict';

const resumeService = require('./resume.service');
const { sendSuccess } = require('../../shared/utils/response');

const uploadResume = async (req, res, next) => {
    try {
        const resume = await resumeService.uploadResume(req.body, req.user);
        sendSuccess(res, {
            _id: resume._id,
            name: resume.name,
            isDefault: resume.isDefault,
            createdAt: resume.createdAt
        }, 'Resume uploaded successfully', 201);
    } catch (err) {
        next(err);
    }
};

const getMyResumes = async (req, res, next) => {
    try {
        const resumes = await resumeService.getMyResumes(req.user._id);
        sendSuccess(res, resumes);
    } catch (err) {
        next(err);
    }
};

const getResumeById = async (req, res, next) => {
    try {
        const resume = await resumeService.getResumeById(req.params.id, req.user);
        sendSuccess(res, resume);
    } catch (err) {
        next(err);
    }
};

const setDefault = async (req, res, next) => {
    try {
        await resumeService.setDefault(req.params.id, req.user._id);
        sendSuccess(res, null, 'Default updated');
    } catch (err) {
        next(err);
    }
};

const deleteResume = async (req, res, next) => {
    try {
        await resumeService.deleteResume(req.params.id, req.user._id);
        sendSuccess(res, null, 'Resume deleted');
    } catch (err) {
        next(err);
    }
};

module.exports = { uploadResume, getMyResumes, getResumeById, setDefault, deleteResume };
