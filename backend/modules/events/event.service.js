'use strict';

/**
 * Event Service
 * ──────────────
 * Business logic for event creation, RSVP, deletion, and reporting.
 */

const Event = require('../../models/Event');
const { invalidatePattern } = require('../../config/redis');
const { checkAndAwardBadges } = require('../../utils/badgeService');

const EVENT_CACHE_PATTERN = '__express__:*:/api/events*';

const { escapeRegex } = require('../../shared/utils/escapeRegex');

/** Build filter scoped to user's college (admins see all). */
const buildEventFilter = (user, query) => {
    const filter = { isActive: true };
    if (query.category) filter.category = query.category;
    if (query.status) filter.status = query.status;

    if (query.search) {
        filter.title = { $regex: escapeRegex(query.search), $options: 'i' };
    }

    if (query.timeframe) {
        const now = new Date();
        const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
        if (query.timeframe === 'Upcoming') {
            filter.date = { $gte: twoHoursAgo };
        } else if (query.timeframe === 'Past') {
            filter.date = { $lt: twoHoursAgo };
        }
    } else if (query.date) {
        // Match exact date (day boundary)
        const startOfDay = new Date(query.date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(query.date);
        endOfDay.setHours(23, 59, 59, 999);
        filter.date = { $gte: startOfDay, $lte: endOfDay };
    }

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
    const filter = buildEventFilter(user, query);
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
 */
const createEvent = async (data, user) => {
    const studentAllowed = ['Hackathon', 'Coding Contest', 'Workshop', 'Other'];
    const alumniAllowed = ['Webinar', 'Career Fair', 'Networking', 'Seminar', 'Tech Talk', 'Workshop', 'Other'];

    if (user.role === 'student' && !studentAllowed.includes(data.category)) {
        throw Object.assign(
            new Error(`Students can only create: ${studentAllowed.join(', ')}`),
            { statusCode: 400 }
        );
    }
    
    if (user.role === 'alumni' && !alumniAllowed.includes(data.category)) {
        throw Object.assign(
            new Error(`Alumni can only create: ${alumniAllowed.join(', ')}`),
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

/**
 * Update or Cancel an event.
 */
const updateEvent = async (eventId, data, user) => {
    const event = await Event.findById(eventId);
    if (!event) throw Object.assign(new Error('Event not found'), { statusCode: 404 });

    const isOwner = event.createdBy.toString() === user._id.toString();
    if (!isOwner && user.role !== 'admin') {
        throw Object.assign(new Error('Not authorized to edit this event'), { statusCode: 403 });
    }

    Object.assign(event, data);
    await event.save();
    
    await invalidatePattern(EVENT_CACHE_PATTERN);
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

module.exports = { getAllEvents, createEvent, updateEvent, rsvpEvent, deleteEvent, reportEvent };
