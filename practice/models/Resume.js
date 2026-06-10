const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    fileData: { type: String, required: true },
    fileType: { type: String, default: 'application/pdf' },
    isDefault: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Resume', resumeSchema);

