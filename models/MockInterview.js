const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema({
    student:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    alumni:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    slot:          { type: mongoose.Schema.Types.ObjectId, ref: 'MentorSlot' },
    interviewType: { type: String, enum: ['Technical', 'HR', 'Case Study'], required: true },
    targetRole:    { type: String, default: '' },
    status:        {
        type: String,
        enum: ['Pending', 'Accepted', 'Rejected', 'Completed'],
        default: 'Pending',
    },
    feedback: {
        strengths:  { type: String, default: '' },
        improvements: { type: String, default: '' },
        rating:     { type: Number, min: 1, max: 5 },
    },
}, { timestamps: true });

module.exports = mongoose.model('MockInterview', interviewSchema);
