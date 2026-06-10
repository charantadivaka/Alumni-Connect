const mongoose = require('mongoose');

const replySchema = new mongoose.Schema({
    author:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

const forumSchema = new mongoose.Schema({
    title:    { type: String, required: true, trim: true },
    content:  { type: String, required: true },
    category: { type: String, enum: ['Career', 'Technical', 'Campus', 'General', 'Interview Tips'], default: 'General' },
    author:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    upvotes:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    replies:  [replySchema],
    isPinned: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Forum', forumSchema);
