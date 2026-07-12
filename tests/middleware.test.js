/**
 * Unit tests for middleware/authMiddleware.js and middleware/roleMiddleware.js
 *
 * These are TRUE unit tests — they mock all external dependencies (jwt, User model)
 * so no database or network connection is required.
 */

const jwt = require('jsonwebtoken');

// ── Mock external modules BEFORE requiring the middleware ─────────────────────
jest.mock('jsonwebtoken');
jest.mock('../models/User');

const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');
const { restrict } = require('../middleware/roleMiddleware');

// ── Helper: build mock Express req/res/next ───────────────────────────────────
const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

// ═════════════════════════════════════════════════════════════════════════════
// authMiddleware — protect()
// ═════════════════════════════════════════════════════════════════════════════
describe('Middleware: protect (authMiddleware)', () => {
    const next = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        process.env.JWT_SECRET = 'test-secret';
    });

    it('should return 401 if no token is provided', async () => {
        const req = { headers: {}, cookies: {} };
        const res = mockRes();

        await protect(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: 'Not authorized, no token' });
        expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if the token is invalid or expired', async () => {
        const req = { headers: { authorization: 'Bearer bad.token.here' }, cookies: {} };
        const res = mockRes();

        jwt.verify.mockImplementation(() => { throw new Error('invalid token'); });

        await protect(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: 'Token invalid or expired' });
        expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if the user no longer exists in the DB', async () => {
        const req = { headers: { authorization: 'Bearer valid.token.here' }, cookies: {} };
        const res = mockRes();

        jwt.verify.mockReturnValue({ id: 'userId123' });
        User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });

        await protect(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: 'User no longer exists' });
        expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 if the user account is suspended', async () => {
        const req = { headers: { authorization: 'Bearer valid.token.here' }, cookies: {} };
        const res = mockRes();

        jwt.verify.mockReturnValue({ id: 'userId123' });
        User.findById.mockReturnValue({
            select: jest.fn().mockResolvedValue({ _id: 'userId123', isSuspended: true })
        });

        await protect(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ message: 'Account suspended. Contact admin.' });
        expect(next).not.toHaveBeenCalled();
    });

    it('should call next() and attach user to req when token is valid', async () => {
        const mockUser = { _id: 'userId123', name: 'Alice', isSuspended: false };
        const req = { headers: { authorization: 'Bearer valid.token.here' }, cookies: {} };
        const res = mockRes();

        jwt.verify.mockReturnValue({ id: 'userId123' });
        User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(mockUser) });

        await protect(req, res, next);

        expect(req.user).toEqual(mockUser);
        expect(next).toHaveBeenCalledTimes(1);
        expect(res.status).not.toHaveBeenCalled();
    });

    it('should accept token from cookie when no Authorization header is present', async () => {
        const mockUser = { _id: 'userId123', isSuspended: false };
        const req = { headers: {}, cookies: { jwt: 'cookie.token.here' } };
        const res = mockRes();

        jwt.verify.mockReturnValue({ id: 'userId123' });
        User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(mockUser) });

        await protect(req, res, next);

        expect(req.user).toEqual(mockUser);
        expect(next).toHaveBeenCalledTimes(1);
    });
});

// ═════════════════════════════════════════════════════════════════════════════
// roleMiddleware — restrict()
// ═════════════════════════════════════════════════════════════════════════════
describe('Middleware: restrict (roleMiddleware)', () => {
    const next = jest.fn();

    beforeEach(() => jest.clearAllMocks());

    it('should return 401 if req.user is not set', () => {
        const middleware = restrict('alumni');
        const req = {};
        const res = mockRes();

        middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: 'Not authenticated' });
        expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 if user role is not in the allowed list', () => {
        const middleware = restrict('alumni', 'admin');
        const req = { user: { role: 'student' } };
        const res = mockRes();

        middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({
            message: 'Access denied. Requires role: alumni or admin',
        });
        expect(next).not.toHaveBeenCalled();
    });

    it('should call next() when user has an allowed role', () => {
        const middleware = restrict('alumni', 'admin');
        const req = { user: { role: 'alumni' } };
        const res = mockRes();

        middleware(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(res.status).not.toHaveBeenCalled();
    });

    it('should call next() for admin when admin is in the allowed list', () => {
        const middleware = restrict('admin');
        const req = { user: { role: 'admin' } };
        const res = mockRes();

        middleware(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
    });
});
