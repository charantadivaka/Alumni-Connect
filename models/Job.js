const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
    title:              { type: String, required: true, trim: true }, // job designation
    company:            { type: String, required: true, trim: true }, // Company name
    companyWebsite:     { type: String, default: '' },
    companyLinkedin:    { type: String, default: '' },
    companyAddress:     { type: String, default: '' },
    location:           { type: String, default: 'Remote' }, // Work Location
    jobType:            { type: String, enum: ['Full-time', 'Part-time', 'Internship', 'Contract'], default: 'Full-time' }, // Type of Employment
    eligibilityCriteria: { type: String, default: '' },
    applicableBranch:   { type: String, default: '' },
    stipend:            { type: String, default: '' },
    ctc:                { type: String, default: '' },
    otherBenefits:      { type: String, default: '' },
    description:        { type: String, required: true }, // job description text or placeholder
    descriptionFile:    { type: String, default: '' },    // base64 file data
    descriptionFileName:{ type: String, default: '' },    // file name
    aboutCompany:       { type: String, default: '' },
    selectionProcess:   { type: String, default: '' },
    skills:             { type: [String], default: [] },
    salary:             { type: String, default: '' },
    applicationLink:    { type: String, default: '' },
    isActive:           { type: Boolean, default: true },
    deadline:           { type: Date },
    postedBy:           { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reports:            [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    companyInsights: {
        culture:     { type: String, default: '' },
        interviewTips: { type: String, default: '' },
        salaryRange:   { type: String, default: '' },
    },
}, { timestamps: true });

// Indexes for performance
jobSchema.index({ isActive: 1, createdAt: -1 });
jobSchema.index({ 'reports.0': 1 }); // Index for finding reported jobs

module.exports = mongoose.model('Job', jobSchema);
