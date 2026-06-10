const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
    job: { type: mongooseSchema.Types.ObjectId, ref: 'Job', required: true },
    applicant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    resume: { type: mongoose.Schema.Types.ObjectId, ref: 'Resume' },
    coverNote: { type: String, default: '' },
    stage: {
        type: String,
        enum: ['Applied', 'Under Review', 'Interview', 'Offer', 'Rejected'],
        default: 'Applied',
    },
    stageHistory: [{
        stage: String,
        updatedAt: { type: Date, default: Date.now },
        note: String,
    }],
    isWithdrawn: { type: Boolean, default: false },
}, { timestamps: true });

applicationSchema.index({ job: 1, applicant: 1 }, { unique: true });

module.exports = mongoose.model('JobApplication', applicationSchema);