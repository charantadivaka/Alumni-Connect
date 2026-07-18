/**
 * Integration tests for the Events API
 * Routes: /api/events
 *
 * Covers:
 *  - GET /api/events           → getAllEvents
 *  - POST /api/events          → createEvent (role-based category restrictions)
 *  - PUT  /api/events/:id/rsvp → rsvpEvent (toggle RSVP)
 *  - DELETE /api/events/:id    → deleteEvent (owner or admin only)
 */

const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const eventRoutes = require('../routes/eventRoutes');
const User = require('../models/User');
const Event = require('../models/Event');

// ── Mocks ─────────────────────────────────────────────────────────────────────
// Mock auth: inject req.user based on Authorization header
jest.mock('../middleware/authMiddleware', () => ({
    protect: (req, res, next) => {
        if (!req.headers.authorization) {
            return res.status(401).json({ message: 'Not authorized' });
        }
        req.user = JSON.parse(req.headers.authorization);
        next();
    },
}));

// Role middleware is the real one (we want to test it works end-to-end)
// Redis: bypass caching and invalidation
jest.mock('../config/redis', () => ({
    invalidatePattern: jest.fn().mockResolvedValue(null),
    cacheMiddleware: () => (req, res, next) => next(),
}));

// Badge service: no-op in tests
jest.mock('../utils/badgeService', () => ({
    checkAndAwardBadges: jest.fn().mockResolvedValue(null),
}));

// ── App setup ─────────────────────────────────────────────────────────────────
const app = express();
app.use(express.json());
app.use('/api/events', eventRoutes);

// ─────────────────────────────────────────────────────────────────────────────
describe('Events API Integration Tests', () => {
    let student, alumni, adminUser;

    const authHeader = (user) =>
        JSON.stringify({ _id: user._id.toString(), role: user.role, college: user.college });

    beforeEach(async () => {
        student = await User.create({
            name: 'Eve Student',
            email: 'eve@test.com',
            password: 'pass123',
            role: 'student',
            collegeRollNumber: 'ROLL-E-001',
        });
        alumni = await User.create({
            name: 'Al Umni',
            email: 'al@test.com',
            password: 'pass123',
            role: 'alumni',
            collegeRollNumber: 'ROLL-E-002',
        });
        adminUser = await User.create({
            name: 'Admin User',
            email: 'admin@test.com',
            password: 'pass123',
            role: 'admin',
            collegeRollNumber: 'ROLL-E-003',
        });
    });

    // ── GET /api/events ───────────────────────────────────────────────────────
    it('should return only active events', async () => {
        await Event.create({
            title: 'Active Hackathon',
            description: 'Desc',
            date: new Date(Date.now() + 86400000),
            createdBy: student._id,
            category: 'Hackathon',
            isActive: true,
        });
        await Event.create({
            title: 'Inactive Event',
            description: 'Desc',
            date: new Date(Date.now() + 86400000),
            createdBy: student._id,
            category: 'Workshop',
            isActive: false,
        });

        const res = await request(app)
            .get('/api/events')
            .set('Authorization', authHeader(adminUser)); // admin sees all colleges

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBe(1);
        expect(res.body[0].title).toBe('Active Hackathon');
    });

    // ── POST /api/events ──────────────────────────────────────────────────────
    it('should allow a student to create a Hackathon event', async () => {
        const res = await request(app)
            .post('/api/events')
            .set('Authorization', authHeader(student))
            .send({
                title: 'Code Sprint',
                description: 'A fun hackathon',
                date: new Date(Date.now() + 86400000),
                category: 'Hackathon',
            });

        expect(res.status).toBe(201);
        expect(res.body.title).toBe('Code Sprint');
        expect(res.body.category).toBe('Hackathon');
    });

    it('should prevent a student from creating a Webinar event', async () => {
        const res = await request(app)
            .post('/api/events')
            .set('Authorization', authHeader(student))
            .send({
                title: 'My Webinar',
                description: 'Student trying to post webinar',
                date: new Date(Date.now() + 86400000),
                category: 'Webinar',
            });

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/students can only/i);
    });

    it('should allow alumni to create a Webinar event', async () => {
        const res = await request(app)
            .post('/api/events')
            .set('Authorization', authHeader(alumni))
            .send({
                title: 'Tech Webinar 2026',
                description: 'Industry insights',
                date: new Date(Date.now() + 86400000),
                category: 'Webinar',
            });

        expect(res.status).toBe(201);
        expect(res.body.category).toBe('Webinar');
    });

    it('should prevent alumni from creating a Hackathon event', async () => {
        const res = await request(app)
            .post('/api/events')
            .set('Authorization', authHeader(alumni))
            .send({
                title: 'Alumni Hackathon',
                description: 'Alumni trying hackathon',
                date: new Date(Date.now() + 86400000),
                category: 'Hackathon',
            });

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/alumni can only/i);
    });

    // ── PUT /api/events/:id/rsvp ──────────────────────────────────────────────
    it('should toggle RSVP on an event', async () => {
        const event = await Event.create({
            title: 'RSVP Event',
            description: 'Desc',
            date: new Date(Date.now() + 86400000),
            createdBy: alumni._id,
            category: 'Webinar',
            isActive: true,
        });

        // First RSVP — should register
        const res1 = await request(app)
            .put(`/api/events/${event._id}/rsvp`)
            .set('Authorization', authHeader(student));

        expect(res1.status).toBe(200);
        expect(res1.body.rsvped).toBe(true);
        expect(res1.body.count).toBe(1);

        // Second RSVP — should un-register (toggle)
        const res2 = await request(app)
            .put(`/api/events/${event._id}/rsvp`)
            .set('Authorization', authHeader(student));

        expect(res2.status).toBe(200);
        expect(res2.body.rsvped).toBe(false);
        expect(res2.body.count).toBe(0);
    });

    // ── DELETE /api/events/:id ────────────────────────────────────────────────
    it('should allow the event creator to delete their event', async () => {
        const event = await Event.create({
            title: 'Deletable Event',
            description: 'Desc',
            date: new Date(Date.now() + 86400000),
            createdBy: student._id,
            category: 'Hackathon',
            isActive: true,
        });

        const res = await request(app)
            .delete(`/api/events/${event._id}`)
            .set('Authorization', authHeader(student));

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Event deleted');
    });

    it('should prevent a non-owner from deleting an event', async () => {
        const event = await Event.create({
            title: 'Protected Event',
            description: 'Desc',
            date: new Date(Date.now() + 86400000),
            createdBy: alumni._id,
            category: 'Webinar',
            isActive: true,
        });

        const res = await request(app)
            .delete(`/api/events/${event._id}`)
            .set('Authorization', authHeader(student)); // student is NOT the creator

        expect(res.status).toBe(403);
    });

    it('should allow an admin to delete any event', async () => {
        const event = await Event.create({
            title: "Admin's Delete Test",
            description: 'Desc',
            date: new Date(Date.now() + 86400000),
            createdBy: student._id,
            category: 'Hackathon',
            isActive: true,
        });

        const res = await request(app)
            .delete(`/api/events/${event._id}`)
            .set('Authorization', authHeader(adminUser));

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Event deleted');
    });
});
