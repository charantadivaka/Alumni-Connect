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
    category: { type: String, enum: ['Interview Experience', 'Career Journey', 'Placement Story', 'Internship', 'Career Advice', 'Higher Studies', 'Other'], default: 'Other' },
    likes:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    likeCount: { type: Number, default: 0 },
    isPublished: { type: Boolean, default: true },
}, { timestamps: true });

// Indexes for performance
storySchema.index({ college: 1, isPublished: 1, createdAt: -1 });
storySchema.index({ author: 1 });

module.exports = mongoose.model('Story', storySchema);
