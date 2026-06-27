const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    title:       { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category:    { type: String, enum: ['Webinar', 'Career Fair', 'Networking', 'Workshop', 'Hackathon', 'Other'], default: 'Other' },
    date:        { type: Date, required: true },
    location:    { type: String, default: 'Online' },
    link:        { type: String, default: '' },
    banner:      { type: String, default: '' },
    createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    college:     { type: mongoose.Schema.Types.ObjectId, ref: 'College' },
    rsvps:       [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    reports:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    isActive:    { type: Boolean, default: true },
}, { timestamps: true });

// Indexes for performance
eventSchema.index({ isActive: 1, date: 1 });
eventSchema.index({ 'reports.0': 1 });

module.exports = mongoose.model('Event', eventSchema);
