const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
    job:       { type: mongoose.Schema.Types.ObjectId, ref: 'Job',  required: true },
    applicant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    resume:    { type: mongoose.Schema.Types.ObjectId, ref: 'Resume' },
    rollNo:    { type: String, default: '' },
    name:      { type: String, default: '' },
    branch:    { type: String, default: '' },
    email:     { type: String, default: '' },
    mobileNo:  { type: String, default: '' },
    cgpa:      { type: String, default: '' },
    majorProjects: { type: String, default: '' },
    cvFile:    { type: String, default: '' }, // base64 string
    cvFileName:{ type: String, default: '' },
    coverNote: { type: String, default: '' },
    stage:     {
        type: String,
        enum: ['Applied', 'Under Review', 'Interview', 'Offer', 'Rejected'],
        default: 'Applied',
    },
    stageHistory: [{
        stage:     String,
        updatedAt: { type: Date, default: Date.now },
        note:      String,
    }],
    isWithdrawn: { type: Boolean, default: false },
}, { timestamps: true });

// One application per student per job
applicationSchema.index({ job: 1, applicant: 1 }, { unique: true });

module.exports = mongoose.model('JobApplication', applicationSchema);
