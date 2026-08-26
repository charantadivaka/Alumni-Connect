'use strict';

const collegeService = require('./college.service');
const { sendSuccess } = require('../../shared/utils/response');

const getColleges = async (req, res, next) => {
    try {
        const colleges = await collegeService.getActiveColleges();
        sendSuccess(res, colleges);
    } catch (err) {
        next(err);
    }
};

const getAllCollegesAdmin = async (req, res, next) => {
    try {
        const colleges = await collegeService.getAllCollegesAdmin();
        sendSuccess(res, colleges);
    } catch (err) {
        next(err);
    }
};

const createCollege = async (req, res, next) => {
    try {
        const college = await collegeService.createCollege(req.body);
        sendSuccess(res, college, 'College created successfully', 201);
    } catch (err) {
        next(err);
    }
};

const updateCollege = async (req, res, next) => {
    try {
        const college = await collegeService.updateCollege(req.params.id, req.body);
        sendSuccess(res, college, 'College updated successfully');
    } catch (err) {
        next(err);
    }
};

const deleteCollege = async (req, res, next) => {
    try {
        await collegeService.deleteCollege(req.params.id);
        sendSuccess(res, null, 'College deleted successfully');
    } catch (err) {
        next(err);
    }
};

const validateRollNumber = async (req, res, next) => {
    try {
        const { collegeId, rollNumber } = req.body;
        if (!collegeId || !rollNumber) {
            return res.status(400).json({ message: 'collegeId and rollNumber are required' });
        }
        const result = await collegeService.validateRollNumber(collegeId, rollNumber);
        sendSuccess(res, result);
    } catch (err) {
        next(err);
    }
};

const getCollegeFeeStatus = async (req, res, next) => {
    try {
        const { name } = req.query;
        if (!name || !name.trim()) return res.status(400).json({ message: 'College name is required.' });
        
        const result = await collegeService.getCollegeFeeStatus(name);
        if (!result.found) return res.status(404).json(result);
        
        sendSuccess(res, result);
    } catch (err) {
        next(err);
    }
};

const getCollegeDetails = async (req, res, next) => {
    try {
        const result = await collegeService.getCollegeDetails(req.params.id);
        sendSuccess(res, result);
    } catch (err) {
        next(err);
    }
};

const renewSubscription = async (req, res, next) => {
    try {
        const college = await collegeService.renewSubscription(req.params.id, req.body);
        sendSuccess(res, college, 'Subscription renewed successfully');
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getColleges,
    getAllCollegesAdmin,
    createCollege,
    updateCollege,
    deleteCollege,
    validateRollNumber,
    getCollegeFeeStatus,
    getCollegeDetails,
    renewSubscription
};
