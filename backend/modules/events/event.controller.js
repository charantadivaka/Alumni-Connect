'use strict';

const eventService = require('./event.service');
const { sendSuccess } = require('../../shared/utils/response');

const getEvents = async (req, res, next) => {
    try {
        const result = await eventService.getAllEvents(req.user, req.query);
        sendSuccess(res, result);
    } catch (err) {
        next(err);
    }
};

const createEvent = async (req, res, next) => {
    try {
        const event = await eventService.createEvent(req.body, req.user);
        sendSuccess(res, event, 'Event created successfully', 201);
    } catch (err) {
        next(err);
    }
};

const rsvpEvent = async (req, res, next) => {
    try {
        const { rsvped, count } = await eventService.rsvpEvent(req.params.id, req.user._id);
        sendSuccess(res, { rsvped, count }, `RSVP ${rsvped ? 'added' : 'removed'}`);
    } catch (err) {
        next(err);
    }
};

const deleteEvent = async (req, res, next) => {
    try {
        await eventService.deleteEvent(req.params.id, req.user);
        sendSuccess(res, null, 'Event deleted successfully');
    } catch (err) {
        next(err);
    }
};

const reportEvent = async (req, res, next) => {
    try {
        await eventService.reportEvent(req.params.id, req.user._id);
        sendSuccess(res, null, 'Event reported to admins');
    } catch (err) {
        next(err);
    }
};

module.exports = { getEvents, createEvent, rsvpEvent, deleteEvent, reportEvent };
