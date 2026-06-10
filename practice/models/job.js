const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    company: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    location: { type: String, default: 'Remote' },
    jobType: { type: String, enum: ['Full-time', 'Part-time', 'Internship', 'Contract'], default: 'Full-time' },
    skills: { type: [String], default: [] },
    salary: { type: String, default: '' },
    applicationLink: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    deadline: { type: Date },
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    companyInsights: {
        culture: { type: String, default: '' },
        interviewTips: { type: String, default: '' },
        salary: { type: String, default: '' },
    },
}, { timestamps: true });

module.exports = mongoose.model('Job', jobSchema);