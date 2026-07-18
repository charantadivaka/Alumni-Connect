const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema({
    alumni:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date:      { type: String, required: true },   
    startTime: { type: String, required: true },   
    duration:  { type: Number, default: 45 },      
    type:      { type: String, enum: ['Mentorship', 'MockInterview', 'Both'], default: 'Both' },
    isBooked:  { type: Boolean, default: false },
}, { timestamps: true });

// Index for "get available slots for alumni" query
slotSchema.index({ alumni: 1, isBooked: 1 });

module.exports = mongoose.model('MentorSlot', slotSchema);
