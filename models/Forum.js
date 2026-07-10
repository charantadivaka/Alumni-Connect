const mongoose = require('mongoose');

const replySchema = new mongoose.Schema({
    author:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

const forumSchema = new mongoose.Schema({
    title:    { type: String, required: true, trim: true },
    content:  { type: String, required: true },
    category: { type: String, enum: ['Career', 'Technical', 'Campus', 'General', 'Interview Tips', 'Campus Life', 'Opportunities', 'Other'], default: 'General' },
    author:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    college:  { type: mongoose.Schema.Types.ObjectId, ref: 'College' },
    upvotes:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    replies:  [replySchema],
    isPinned: { type: Boolean, default: false },
}, { timestamps: true });

// Indexes for performance
forumSchema.index({ college: 1, category: 1, createdAt: -1 });
forumSchema.index({ author: 1 });
forumSchema.index({ isPinned: -1, createdAt: -1 });

module.exports = mongoose.model('Forum', forumSchema);
