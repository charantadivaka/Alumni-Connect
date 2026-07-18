const mongoose = require('mongoose');

/**
 * AuditLog — records admin actions for accountability.
 * Auto-deletes after 90 days via TTL index.
 */
const auditLogSchema = new mongoose.Schema({
    adminId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    action:      { type: String, required: true },  // e.g. 'verify_alumni', 'suspend_user', 'delete_job'
    targetId:    { type: mongoose.Schema.Types.ObjectId },
    targetModel: { type: String },                  // e.g. 'User', 'Job', 'Forum'
    details:     { type: String, default: '' },
    ip:          { type: String, default: '' },
    expiresAt:   { type: Date, default: () => new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), index: { expires: 0 } },
}, { timestamps: true });

auditLogSchema.index({ adminId: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
