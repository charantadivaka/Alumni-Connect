const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    type: { type: String, enum: ['Webinar', 'Career Fair', 'Networking', 'Workshop', 'Other'], default: 'Other' },
    date: { type: Date, required: true },
    location: { type: String, default: 'Online' },
    link: { type: String, default: '' },
    banner: { type: String, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rsvps: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);
