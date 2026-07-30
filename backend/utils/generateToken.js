const jwt = require('jsonwebtoken');

/**
 * Generate a signed JWT for the given userId.
 * Pure function — does NOT set any cookie.
 * Cookie-setting is handled by the controller (setTokenCookie).
 *
 * @param {string|ObjectId} userId - The user's MongoDB _id
 * @returns {string} Signed JWT token
 */
const generateToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

module.exports = generateToken;
