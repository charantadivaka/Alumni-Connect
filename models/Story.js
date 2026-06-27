const mongoose = require('mongoose');

const storySchema = new mongoose.Schema({
    author:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    college: { type: mongoose.Schema.Types.ObjectId, ref: 'College' },
    title:   { type: String, required: true, trim: true },
    content: { type: String, required: true },
    company: { type: String, default: '' },
    role:    { type: String, default: '' },
    coverImage: { type: String, default: '' },
    tags:    { type: [String], default: [] },
    likes:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    isPublished: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Story', storySchema);
