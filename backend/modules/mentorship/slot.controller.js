'use strict';

const MentorSlot = require('../../models/MentorSlot');
const { sendSuccess } = require('../../shared/utils/response');

const createSlot = async (req, res, next) => {
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
                    success: false,
                    message: `Time slot conflicts with an existing slot: ${slot.startTime} (${slot.duration} min).` 
                });
            }
        }

        const slot = await MentorSlot.create({
            alumni: alumniId, date, startTime,
            duration: dur, type: type || 'Both',
        });
        
        sendSuccess(res, slot, 'Slot created', 201);
    } catch (err) {
        next(err);
    }
};

const getMySlots = async (req, res, next) => {
    try {
        const slots = await MentorSlot.find({ alumni: req.user._id }).sort({ date: 1, startTime: 1 });
        sendSuccess(res, slots);
    } catch (err) {
        next(err);
    }
};

const getAlumniSlots = async (req, res, next) => {
    try {
        const slots = await MentorSlot.find({
            alumni: req.params.alumniId,
            isBooked: false,
        }).sort({ date: 1, startTime: 1 });
        sendSuccess(res, slots);
    } catch (err) {
        next(err);
    }
};

const deleteSlot = async (req, res, next) => {
    try {
        const slot = await MentorSlot.findById(req.params.id);
        if (!slot) return res.status(404).json({ success: false, message: 'Slot not found' });
        
        if (slot.alumni.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }
        if (slot.isBooked) {
            return res.status(400).json({ success: false, message: 'Cannot delete a booked slot' });
        }
        
        await slot.deleteOne();
        sendSuccess(res, null, 'Slot deleted');
    } catch (err) {
        next(err);
    }
};

module.exports = { createSlot, getMySlots, getAlumniSlots, deleteSlot };
