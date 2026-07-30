'use strict';

const interviewService = require('./interview.service');
const { sendSuccess } = require('../../shared/utils/response');

const bookInterview = async (req, res, next) => {
    try {
        const { interview, alumniId } = await interviewService.bookInterview(req.body, req.user);
        
        const { sendNotification } = require('../../shared/services/notificationService');
        await sendNotification(alumniId, 'interview_request',
            `${req.user.name} booked a ${req.body.interviewType} mock interview with you`,
            '/alumni/interviews'
        );
        
        sendSuccess(res, interview, 'Interview booked successfully', 201);
    } catch (err) {
        next(err);
    }
};

const getMyInterviews = async (req, res, next) => {
    try {
        const interviews = await interviewService.getMyInterviews(req.user);
        sendSuccess(res, interviews);
    } catch (err) {
        next(err);
    }
};

const respondInterview = async (req, res, next) => {
    try {
        const { status } = req.body;
        const { interview, studentId } = await interviewService.respondInterview(req.params.id, status, req.user);
        
        const { sendNotification } = require('../../shared/services/notificationService');
        await sendNotification(studentId, 'interview_response',
            `Your mock interview request was ${status.toLowerCase()}`,
            '/student/interviews'
        );
        
        sendSuccess(res, interview, `Interview request ${status.toLowerCase()}`);
    } catch (err) {
        next(err);
    }
};

const submitFeedback = async (req, res, next) => {
    try {
        const { interview, studentId } = await interviewService.submitFeedback(req.params.id, req.body, req.user);
        
        const { sendNotification } = require('../../shared/services/notificationService');
        await sendNotification(studentId, 'interview_feedback',
            'Your mock interview feedback is ready!',
            '/student/interviews'
        );
        
        sendSuccess(res, interview, 'Feedback submitted successfully');
    } catch (err) {
        next(err);
    }
};

module.exports = { bookInterview, getMyInterviews, respondInterview, submitFeedback };
