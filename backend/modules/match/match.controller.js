'use strict';

const matchService = require('./match.service');
const { sendSuccess } = require('../../shared/utils/response');

const getMatches = async (req, res, next) => {
    try {
        const result = await matchService.getMatches(req.user, req.query);
        sendSuccess(res, result);
    } catch (err) {
        next(err);
    }
};

const getDirectory = async (req, res, next) => {
    try {
        const result = await matchService.getDirectory(req.user, req.query);
        sendSuccess(res, result);
    } catch (err) {
        next(err);
    }
};

const getAlumniById = async (req, res, next) => {
    try {
        const alumni = await matchService.getAlumniById(req.params.id);
        sendSuccess(res, alumni);
    } catch (err) {
        next(err);
    }
};

module.exports = { getMatches, getDirectory, getAlumniById };
