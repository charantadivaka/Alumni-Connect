const AuditLog = require('../models/AuditLog');

// @desc  Get audit logs
// @route GET /api/admin/audit
const getAuditLogs = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 50;
        const skip = (page - 1) * limit;

        const total = await AuditLog.countDocuments();
        const logs = await AuditLog.find()
            .populate('adminId', 'name email role')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.set('X-Total-Count', total);
        res.json(logs);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { getAuditLogs };
