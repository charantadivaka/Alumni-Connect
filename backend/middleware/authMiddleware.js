const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    try {
        let token;

        // Check Authorization header first, then cookie
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        } else if (req.cookies && req.cookies.jwt) {
            token = req.cookies.jwt;
        }

        if (!token) {
            return res.status(401).json({ message: 'Not authorized, no token' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');

        if (!user) {
            return res.status(401).json({ message: 'User no longer exists' });
        }

        if (user.isSuspended) {
            return res.status(403).json({ message: 'Account suspended. Contact admin.' });
        }

        // Student Access Control: check college subscription status
        if (user.role === 'student' && user.college) {
            // Populate college to check status
            const college = await require('../models/College').findById(user.college);
            if (college) {
                user.college = college; // Populate it for req.user
                if (college.subscriptionStatus !== 'Active') {
                    // Allow /api/auth/me and /api/auth/logout so the user can still be loaded and log out
                    const path = req.originalUrl || req.url;
                    if (!path.includes('/api/auth/me') && !path.includes('/api/auth/logout')) {
                        return res.status(403).json({ 
                            message: 'College subscription is not active.',
                            code: 'COLLEGE_SUBSCRIPTION_EXPIRED'
                        });
                    }
                }
            }
        }

        req.user = user;
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Token invalid or expired' });
    }
};

const roleCheck = (roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Forbidden: Insufficient privileges' });
        }
        next();
    };
};

module.exports = { protect, roleCheck };
