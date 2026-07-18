const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
    student:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name:      { type: String, required: true },         // e.g. "Backend Resume v2"
    fileData:  { type: String, required: true },         // base64 PDF
    fileType:  { type: String, default: 'application/pdf' },
    isDefault: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Resume', resumeSchema);
