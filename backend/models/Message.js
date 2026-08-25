const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    sender:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text:     { type: String, default: '', trim: true },
    isRead:   { type: Boolean, default: false },
    replyTo:  { type: mongoose.Schema.Types.ObjectId, ref: 'Message', default: null },
    fileUrl:  { type: String, default: '' },
    fileName: { type: String, default: '' },
    fileType: { type: String, enum: ['image', 'document', ''], default: '' },
    isEdited: { type: Boolean, default: false },
    isDeleted:{ type: Boolean, default: false },
    deletedBy:[{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

messageSchema.index({ sender: 1, receiver: 1 });

module.exports = mongoose.model('Message', messageSchema);
