const mongoose = require('mongoose');

/**
 * PasswordReset — stores a hashed reset token for the forgot-password flow.
 * A TTL index on `expiresAt` makes MongoDB automatically delete expired documents.
 */
const passwordResetSchema = new mongoose.Schema({
    userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    tokenHash: { type: String, required: true },          // SHA-256 hash of the raw token
    expiresAt: { type: Date, required: true, index: { expires: 0 } }, // TTL index
});

passwordResetSchema.index({ userId: 1 });

module.exports = mongoose.model('PasswordReset', passwordResetSchema);
