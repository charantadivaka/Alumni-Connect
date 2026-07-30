'use strict';

const mentorshipService = require('./mentorship.service');
const { sendSuccess } = require('../../shared/utils/response');

const requestSession = async (req, res, next) => {
    try {
        const { session, alumniId } = await mentorshipService.requestSession(req.body, req.user);
        
        const { sendNotification } = require('../../shared/services/notificationService');
        await sendNotification(alumniId, 'mentorship_request',
            `${req.user.name} requested a mentorship session`,
            '/alumni/mentorships'
        );
        
        sendSuccess(res, session, 'Mentorship session requested', 201);
    } catch (err) {
        next(err);
    }
};

const getMySessions = async (req, res, next) => {
    try {
        const sessions = await mentorshipService.getMySessions(req.user);
        sendSuccess(res, sessions);
    } catch (err) {
        next(err);
    }
};

const respondToSession = async (req, res, next) => {
    try {
        const { status } = req.body;
        const session = await mentorshipService.respondToSession(req.params.id, status, req.user);
        
        const { sendNotification } = require('../../shared/services/notificationService');
        await sendNotification(session.student._id, 'mentorship_response',
            `Your mentorship request was ${status.toLowerCase()} by ${req.user.name}`,
            '/student/mentorships'
        );
        
        sendSuccess(res, session, `Mentorship request ${status.toLowerCase()}`);
    } catch (err) {
        next(err);
    }
};

const completeSession = async (req, res, next) => {
    try {
        const { sessionNotes } = req.body;
        const session = await mentorshipService.completeSession(req.params.id, sessionNotes, req.user);
        
        const { sendNotification } = require('../../shared/services/notificationService');
        await sendNotification(session.student, 'mentorship_completed',
            `Your mentorship session with ${req.user.name} is complete. Please leave feedback!`,
            `/student/mentorships/${session._id}/feedback`
        );
        
        sendSuccess(res, session, 'Session marked as completed');
    } catch (err) {
        next(err);
    }
};

const submitFeedback = async (req, res, next) => {
    try {
        const { rating, comment } = req.body;
        const session = await mentorshipService.submitFeedback(req.params.id, rating, comment, req.user);
        sendSuccess(res, session, 'Feedback submitted successfully');
    } catch (err) {
        next(err);
    }
};

module.exports = {
    requestSession, getMySessions, respondToSession,
    completeSession, submitFeedback
};
