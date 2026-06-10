const mongoose = require('mongoose');

const referralSchema = new mongoose.Schema({
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    alumni: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    jobTitle: { type: String, required: true },
    company: { type: String, required: true },
    message: { type: String, default: '' },
    resume: { type: mongoose.Schema.Types.ObjectId, ref: 'Resume' },
    status: { type: String, enum: ['Pending', 'Submitted', 'Rejected', 'Not Available'], default: 'Pending' },
    alumniNote: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Referral', referralSchema);

