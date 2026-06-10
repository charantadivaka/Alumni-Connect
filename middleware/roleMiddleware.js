/**
 * Role-based access control factory.
 * Usage: restrict('alumni', 'admin')
 */
const restrict = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Not authenticated' });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                message: `Access denied. Requires role: ${roles.join(' or ')}`,
            });
        }
        next();
    };
};

module.exports = { restrict };
