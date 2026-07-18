const mongoose = require('mongoose');

const collegeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    // Stored as a regex pattern string, e.g. "^S\\d{4}\\d{7}$"
    rollNumberPattern: {
        type: String,
        required: true,
        trim: true,
    },
    // Human-readable example shown to the user during registration
    exampleFormat: {
        type: String,
        required: true,
        trim: true,
    },
    // Short description / hint about the format
    patternDescription: {
        type: String,
        default: '',
        trim: true,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, { timestamps: true });

module.exports = mongoose.model('College', collegeSchema);
