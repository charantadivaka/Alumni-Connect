const Event = require('../models/Event');
const sendNotification = require('../utils/sendNotification');

let _io;
const setIo = (io) => { _io = io; };

// @desc  Get all active events
// @route GET /api/events
const getAllEvents = async (req, res) => {
    try {
        const { category } = req.query;
        const filter = { isActive: true };
        if (category) filter.category = category;
        const events = await Event.find(filter)
            .populate('createdBy', 'name profilePicture company')
            .sort({ date: 1 });
        res.json(events);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc  Create event (alumni or admin)
// @route POST /api/events
const createEvent = async (req, res) => {
    try {
        const event = await Event.create({ ...req.body, createdBy: req.user._id });
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
        res.json({ message: 'Event reported successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { getAllEvents, createEvent, rsvpEvent, deleteEvent, reportEvent, setIo };
