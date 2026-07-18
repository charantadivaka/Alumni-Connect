const MentorSlot = require('../models/MentorSlot');

// @desc  Create availability slot
// @route POST /api/slots
const createSlot = async (req, res) => {
    try {
        const { date, startTime, duration, type } = req.body;
        const alumniId = req.user._id;

        const dur = Number(duration) || 45;

        // Convert new slot time to minutes from midnight
        const [newH, newM] = startTime.split(':').map(Number);
        const newStart = newH * 60 + newM;
        const newEnd = newStart + dur;

        // Get all existing slots for this alumni on the same date
        const existingSlots = await MentorSlot.find({ alumni: alumniId, date });

        for (const slot of existingSlots) {
            const [exH, exM] = slot.startTime.split(':').map(Number);
            const exStart = exH * 60 + exM;
            const exEnd = exStart + slot.duration;

            // Check for overlap
            if (newStart < exEnd && newEnd > exStart) {
                return res.status(400).json({ 
                    message: `Time slot conflicts with an existing slot: ${slot.startTime} (${slot.duration} min).` 
                });
            }
        }

        const slot = await MentorSlot.create({
            alumni: alumniId, date, startTime,
            duration: dur, type: type || 'Both',
        });
        res.status(201).json(slot);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc  Get my slots (alumni)
// @route GET /api/slots/my
const getMySlots = async (req, res) => {
    try {
        const slots = await MentorSlot.find({ alumni: req.user._id }).sort({ date: 1, startTime: 1 });
        res.json(slots);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc  Get alumni's available slots (for students)
// @route GET /api/slots/alumni/:alumniId
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

// @desc  Delete a slot
// @route DELETE /api/slots/:id
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
