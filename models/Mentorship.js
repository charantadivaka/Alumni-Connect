const mongoose = require('mongoose');

const mentorshipSchema = new mongoose.Schema({
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    alumni:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    slot:    { type: mongoose.Schema.Types.ObjectId, ref: 'MentorSlot' },
    topic:   { type: String, required: true },
    goals:   { type: String, default: '' },
    status:  {
        type: String,
        enum: ['Pending', 'Accepted', 'Rejected', 'Completed', 'Cancelled'],
        default: 'Pending',
    },
    sessionNotes:  { type: String, default: '' },
    studentFeedback: {
        rating:  { type: Number, min: 1, max: 5 },
        comment: { type: String, default: '' },
    },
}, { timestamps: true });

module.exports = mongoose.model('Mentorship', mentorshipSchema);
