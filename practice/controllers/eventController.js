const Event = require('../models/Event');
const sendNotification = require('../utils/sendNotification');

let _io;
const setIo = (io) => { _io = io; };

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

const createEvent = async (req, res) => {
    try {
        const event = await Event.create({ ...req.body, createdBy: req.user._id });
        res.status(201).json(event);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

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

module.exports = { getAllEvents, createEvent, rsvpEvent, deleteEvent, setIo };
