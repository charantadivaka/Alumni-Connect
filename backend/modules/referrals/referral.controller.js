'use strict';

const referralService = require('./referral.service');
const { sendSuccess } = require('../../shared/utils/response');

const requestReferral = async (req, res, next) => {
    try {
        const { referral, alumniId } = await referralService.requestReferral(req.body, req.user);
        
        const { sendNotification } = require('../../shared/services/notificationService');
        await sendNotification(alumniId, 'referral_request',
            `${req.user.name} is requesting a referral at ${req.body.company} for ${req.body.jobTitle}`,
            '/alumni/referrals'
        );
        
        sendSuccess(res, referral, 'Referral requested', 201);
    } catch (err) {
        next(err);
    }
};

const getMyReferrals = async (req, res, next) => {
    try {
        const referrals = await referralService.getMyReferrals(req.user);
        sendSuccess(res, referrals);
    } catch (err) {
        next(err);
    }
};

const respondReferral = async (req, res, next) => {
    try {
        const { status, alumniNote } = req.body;
        const { referral, studentId } = await referralService.respondReferral(req.params.id, status, alumniNote, req.user);
        
        const { sendNotification } = require('../../shared/services/notificationService');
        await sendNotification(studentId, 'referral_update',
            `Your referral request for ${referral.jobTitle} at ${referral.company} is now: ${status}`,
            '/student/referrals'
        );
        
        sendSuccess(res, referral, `Referral marked as ${status}`);
    } catch (err) {
        next(err);
    }
};

module.exports = { requestReferral, getMyReferrals, respondReferral };
