const mongoose = require('mongoose');

const bookmarkSchema = new mongoose.Schema({
    user:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    refId:    { type: mongoose.Schema.Types.ObjectId, required: true },
    refModel: { type: String, enum: ['Job', 'User', 'Event', 'Story', 'Forum'], required: true },
}, { timestamps: true });

bookmarkSchema.index({ user: 1, refId: 1, refModel: 1 }, { unique: true });

module.exports = mongoose.model('Bookmark', bookmarkSchema);
