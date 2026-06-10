const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    try {
        let token;

        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        } else if (req.cookies && req.cookies.jwt) {
            token = req.cookies.jwt;
        }

        if (!token) {
            return res.status(401).json({ message: 'not authorized no token' })
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');

        if (!user) {
            res.status(401).json({ message: 'User no longer exists' });
        }

        if (user.isSuspended) {
            return res.status(403).json({ message: "Account Suspended. Contact admin." })
        }
        req.user = user
        next()

    } catch (err) {
        res.status(401).json({ message: 'Token invalid or expiredd' });

    }
};

module.exports = { protect };