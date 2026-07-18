/**
 * Integration tests for the Profile API
 * Routes: /api/profile
 *
 * Covers:
 *  - GET /api/profile        → getMyProfile
 *  - GET /api/profile/:id    → getProfileById
 *  - PUT /api/profile        → updateProfile (basic field update)
 */

const request = require('supertest');
const express = require('express');
const profileRoutes = require('../routes/profileRoutes');
const User = require('../models/User');

// ── Mock dependencies ─────────────────────────────────────────────────────────
// Mock authMiddleware so tests don't need real JWTs
jest.mock('../middleware/authMiddleware', () => ({
    protect: (req, res, next) => {
        if (!req.headers.authorization) {
            return res.status(401).json({ message: 'Not authorized' });
        }
        // The Authorization header carries the userId for test purposes
        req.user = { _id: req.headers.authorization };
        next();
    },
}));

// Mock Redis to avoid network dependency
jest.mock('../config/redis', () => ({
    invalidatePattern: jest.fn().mockResolvedValue(null),
    cacheMiddleware: () => (req, res, next) => next(),
}));

// ── App setup ─────────────────────────────────────────────────────────────────
const app = express();
app.use(express.json({ limit: '10mb' }));
app.use('/api/profile', profileRoutes);

// ─────────────────────────────────────────────────────────────────────────────
describe('Profile API Integration Tests', () => {
    let testUser;
    let testUserId;

    beforeEach(async () => {
        testUser = await User.create({
            name: 'Alice Test',
            email: 'alice@test.com',
            password: 'password123',
            role: 'student',
            collegeRollNumber: 'ROLL-P-001',
            bio: 'Original bio',
            skills: ['JavaScript'],
        });
        testUserId = testUser._id.toString();
    });

    // ── GET /api/profile ──────────────────────────────────────────────────────
    it('should return the authenticated user profile', async () => {
        const res = await request(app)
            .get('/api/profile')
            .set('Authorization', testUserId);

        expect(res.status).toBe(200);
        expect(res.body.email).toBe('alice@test.com');
        expect(res.body.name).toBe('Alice Test');
        // Password must never be returned
        expect(res.body.password).toBeUndefined();
    });

    it('should return 401 if no Authorization header is sent', async () => {
        const res = await request(app).get('/api/profile');

        expect(res.status).toBe(401);
    });

    // ── GET /api/profile/:id ──────────────────────────────────────────────────
    it('should return a public profile by user ID', async () => {
        const anotherUser = await User.create({
            name: 'Bob Alumni',
            email: 'bob@test.com',
            password: 'password123',
            role: 'alumni',
            collegeRollNumber: 'ROLL-P-002',
        });

        const res = await request(app)
            .get(`/api/profile/${anotherUser._id}`)
            .set('Authorization', testUserId);

        expect(res.status).toBe(200);
        expect(res.body.name).toBe('Bob Alumni');
        expect(res.body.password).toBeUndefined();
        expect(res.body.idProof).toBeUndefined(); // sensitive field should be hidden
    });

    it('should return 404 for a non-existent user ID', async () => {
        const { Types } = require('mongoose');
        const nonExistentId = new Types.ObjectId();

        const res = await request(app)
            .get(`/api/profile/${nonExistentId}`)
            .set('Authorization', testUserId);

        expect(res.status).toBe(404);
        expect(res.body.message).toBe('User not found');
    });

    // ── PUT /api/profile ──────────────────────────────────────────────────────
    it('should update allowed profile fields', async () => {
        const res = await request(app)
            .put('/api/profile')
            .set('Authorization', testUserId)
            .send({ bio: 'Updated bio', skills: ['JavaScript', 'Node.js'] });

        expect(res.status).toBe(200);
        expect(res.body.bio).toBe('Updated bio');
        expect(res.body.skills).toContain('Node.js');
    });

    it('should NOT allow updating protected fields like role or email', async () => {
        const res = await request(app)
            .put('/api/profile')
            .set('Authorization', testUserId)
            .send({ role: 'admin', email: 'hacked@evil.com', bio: 'Safe update' });

        expect(res.status).toBe(200);
        // Verify that the forbidden fields were not changed
        const updated = await User.findById(testUserId).select('+email');
        expect(updated.role).toBe('student'); // role unchanged
        expect(updated.email).toBe('alice@test.com'); // email unchanged
    });
});
