const Event = require('../models/Event');
const sendNotification = require('../utils/sendNotification');
const { invalidatePattern } = require('../config/redis');
const { checkAndAwardBadges } = require('../utils/badgeService');

const EVENT_CACHE_PATTERN = '__express__/api/events*';

let _io;
const setIo = (io) => { _io = io; };

// @desc  Get all active events
// @route GET /api/events
const getAllEvents = async (req, res) => {
    try {
        const { category } = req.query;
        const filter = { isActive: true };
        if (category) filter.category = category;

        // Only show events from user's college (allow admins to see all, allow legacy events)
        if (req.user && req.user.role !== 'admin' && req.user.college) {
            filter.$or = [
                { college: req.user.college },
                { college: { $exists: false } },
                { college: null }
            ];
        }

        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 20;
        const skip = (page - 1) * limit;

        const total = await Event.countDocuments(filter);
        const events = await Event.find(filter)
            .populate('createdBy', 'name profilePicture company')
            .sort({ date: 1 })
            .skip(skip)
            .limit(limit);
            
        res.set('X-Total-Count', total);
        res.json(events);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc  Create event (student, alumni, or admin)
// @route POST /api/events
const createEvent = async (req, res) => {
    try {
        // Category validation by role
        if (req.user.role === 'student') {
            if (!['Hackathon', 'Workshop'].includes(req.body.category)) {
                return res.status(400).json({ 
                    message: "Students can only create 'Hackathon' or 'Workshop' events." 
                });
            }
        } else if (req.user.role === 'alumni') {
            if (!['Webinar', 'Networking'].includes(req.body.category)) {
                return res.status(400).json({ 
                    message: "Alumni can only create 'Webinar' or 'Networking' events." 
                });
            }
        }

        const event = await Event.create({ 
            ...req.body, 
            createdBy: req.user._id,
            college: req.user.college || null 
        });
        await invalidatePattern(EVENT_CACHE_PATTERN);
        // Award event_organizer badge (non-blocking)
        checkAndAwardBadges(req.user._id.toString(), 'event_created').catch(() => {});
        res.status(201).json(event);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc  RSVP to event (student)
// @route PUT /api/events/:id/rsvp
const rsvpEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ message: 'Event not found' });
        const alreadyRsvp = event.rsvps.includes(req.user._id);
        if (alreadyRsvp) {
            event.rsvps = event.rsvps.filter(id => id.toString() !== req.user._id.toString());
        } else {
            event.rsvps.push(req.user._id);
        }
        await event.save();
        await invalidatePattern(EVENT_CACHE_PATTERN); // rsvp count changed
        res.json({ rsvped: !alreadyRsvp, count: event.rsvps.length });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc  Delete event
// @route DELETE /api/events/:id
const deleteEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ message: 'Not found' });
        const isOwner = event.createdBy.toString() === req.user._id.toString();
        if (!isOwner && req.user.role !== 'admin') return res.status(403).json({ message: 'Not authorized' });
        await event.deleteOne();
        await invalidatePattern(EVENT_CACHE_PATTERN); // event removed
        res.json({ message: 'Event deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc  Report an event
// @route PUT /api/events/:id/report
const reportEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ message: 'Event not found' });
        
        const alreadyReported = event.reports.includes(req.user._id);
        if (alreadyReported) {
            return res.status(400).json({ message: 'You have already reported this event' });
        }
        
        event.reports.push(req.user._id);
        await event.save();
        await invalidatePattern(EVENT_CACHE_PATTERN); // event reported
        res.json({ message: 'Event reported successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { getAllEvents, createEvent, rsvpEvent, deleteEvent, reportEvent, setIo };
