'use strict';

/**
 * Event Service
 * ──────────────
 * Business logic for event creation, RSVP, deletion, and reporting.
 */

const Event = require('../../models/Event');
const { invalidatePattern } = require('../../config/redis');
const { checkAndAwardBadges } = require('../../utils/badgeService');

const EVENT_CACHE_PATTERN = '__express__/api/events*';

/** Build filter scoped to user's college (admins see all). */
const buildEventFilter = (user, category) => {
    const filter = { isActive: true };
    if (category) filter.category = category;

    if (user && user.role !== 'admin' && user.college) {
        filter.$or = [
            { college: user.college },
            { college: { $exists: false } },
            { college: null },
        ];
    }
    return filter;
};

/** Fetch paginated active events. */
const getAllEvents = async (user, query) => {
    const filter = buildEventFilter(user, query.category);
    const page   = parseInt(query.page,  10) || 1;
    const limit  = parseInt(query.limit, 10) || 20;
    const skip   = (page - 1) * limit;

    const [total, events] = await Promise.all([
        Event.countDocuments(filter),
        Event.find(filter)
            .populate('createdBy', 'name profilePicture company')
            .sort({ date: 1 })
            .skip(skip)
            .limit(limit),
    ]);

    return { events, total };
};

/**
 * Create an event.
 * Enforces category restrictions by role.
 */
const createEvent = async (data, user) => {
    if (user.role === 'student' && !['Hackathon', 'Workshop'].includes(data.category)) {
        throw Object.assign(
            new Error("Students can only create 'Hackathon' or 'Workshop' events."),
            { statusCode: 400 }
        );
    }
    if (user.role === 'alumni' && !['Webinar', 'Networking'].includes(data.category)) {
        throw Object.assign(
            new Error("Alumni can only create 'Webinar' or 'Networking' events."),
            { statusCode: 400 }
        );
    }

    const event = await Event.create({
        ...data,
        createdBy: user._id,
        college:   user.college || null,
    });

    await invalidatePattern(EVENT_CACHE_PATTERN);
    checkAndAwardBadges(user._id.toString(), 'event_created').catch(() => {});
    return event;
};

/** Toggle RSVP — returns { rsvped, count }. */
const rsvpEvent = async (eventId, userId) => {
    const event = await Event.findById(eventId);
    if (!event) throw Object.assign(new Error('Event not found'), { statusCode: 404 });

    const alreadyRsvp = event.rsvps.includes(userId);
    if (alreadyRsvp) {
        event.rsvps = event.rsvps.filter(id => id.toString() !== userId.toString());
    } else {
        event.rsvps.push(userId);
    }
    await event.save();
    await invalidatePattern(EVENT_CACHE_PATTERN);
    return { rsvped: !alreadyRsvp, count: event.rsvps.length };
};

/** Delete event (owner or admin). */
const deleteEvent = async (eventId, user) => {
    const event = await Event.findById(eventId);
    if (!event) throw Object.assign(new Error('Event not found'), { statusCode: 404 });

    const isOwner = event.createdBy.toString() === user._id.toString();
    if (!isOwner && user.role !== 'admin') {
        throw Object.assign(new Error('Not authorized'), { statusCode: 403 });
    }

    await event.deleteOne();
    await invalidatePattern(EVENT_CACHE_PATTERN);
};

/** Report an event. */
const reportEvent = async (eventId, userId) => {
    const event = await Event.findById(eventId);
    if (!event) throw Object.assign(new Error('Event not found'), { statusCode: 404 });

    if (event.reports.includes(userId)) {
        throw Object.assign(new Error('You have already reported this event'), { statusCode: 400 });
    }

    event.reports.push(userId);
    await event.save();
    await invalidatePattern(EVENT_CACHE_PATTERN);
};

module.exports = { getAllEvents, createEvent, rsvpEvent, deleteEvent, reportEvent };
