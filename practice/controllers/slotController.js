const MentorSlot = require('../models/MentorSlot');

const createSlot = async (req, res) => {
    try {
        const { date, startTime, duration, type } = req.body;
        const slot = await MentorSlot.create({
            alumni: req.user._id, date, startTime,
            duration: duration || 45, type: type || 'Both',
        });
        res.status(201).json(slot);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const getMySlots = async (req, res) => {
    try {
        const slots = await MentorSlot.find({ alumni: req.user._id }).sort({ date: 1, startTime: 1 });
        res.json(slots);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const getAlumniSlots = async (req, res) => {
    try {
        const slots = await MentorSlot.find({
            alumni: req.params.alumniId,
            isBooked: false,
        }).sort({ date: 1, startTime: 1 });
        res.json(slots);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const deleteSlot = async (req, res) => {
    try {
        const slot = await MentorSlot.findById(req.params.id);
        if (!slot) return res.status(404).json({ message: 'Slot not found' });
        if (slot.alumni.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        if (slot.isBooked) return res.status(400).json({ message: 'Cannot delete a booked slot' });
        await slot.deleteOne();
        res.json({ message: 'Slot deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { createSlot, getMySlots, getAlumniSlots, deleteSlot };
