const mongoose = require('mongoose');

const startupSchema = new mongoose.Schema({
    founder:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name:        { type: String, required: true, trim: true },
    tagline:     { type: String, default: '' },
    description: { type: String, required: true },
    website:     { type: String, default: '' },
    industry:    { type: String, default: '' },
    stage:       { type: String, enum: ['Idea', 'MVP', 'Growth', 'Scale'], default: 'Idea' },
    skillsNeeded: { type: [String], default: [] },
    logo:        { type: String, default: '' },
    collaborationRequests: [{
        student:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        message:  String,
        status:   { type: String, enum: ['Pending', 'Accepted', 'Rejected'], default: 'Pending' },
        requestedAt: { type: Date, default: Date.now },
    }],
    isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Startup', startupSchema);
