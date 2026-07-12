/**
 * Integration tests for the Connections API
 * Routes: /api/connections
 *
 * Covers:
 *  - Sending a connection request
 *  - Preventing self-connection
 *  - Preventing duplicate connection requests
 *  - Fetching own connections
 *  - Responding (accepting/rejecting) to a request
 *  - Removing a connection
 */

const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const connectionRoutes = require('../routes/connectionRoutes');
const User = require('../models/User');
const Connection = require('../models/Connection');

const app = express();
app.use(express.json());

// Mock the auth middleware: inject req.user from the Authorization header value (a user ID)
jest.mock('../middleware/authMiddleware', () => ({
    protect: (req, res, next) => {
        if (!req.headers.authorization) {
            return res.status(401).json({ message: 'Not authorized' });
        }
        req.user = { _id: req.headers.authorization, name: 'Test User' };
        next();
    },
}));

// Mock sendNotification to avoid real socket/DB calls
jest.mock('../utils/sendNotification', () => jest.fn().mockResolvedValue(null));

app.use('/api/connections', connectionRoutes);

// ─────────────────────────────────────────────────────────────────────────────
describe('Connections API Integration Tests', () => {
    let userAId, userBId;

    beforeEach(async () => {
        const userA = await User.create({
            name: 'User A',
            email: 'usera@test.com',
            password: 'pass123',
            role: 'student',
            collegeRollNumber: 'ROLL-C-001',
        });
        const userB = await User.create({
            name: 'User B',
            email: 'userb@test.com',
            password: 'pass123',
            role: 'alumni',
            collegeRollNumber: 'ROLL-C-002',
        });
        userAId = userA._id.toString();
        userBId = userB._id.toString();
    });

    it('should send a connection request successfully', async () => {
        const res = await request(app)
            .post(`/api/connections/request/${userBId}`)
            .set('Authorization', userAId);

        expect(res.status).toBe(201);
        expect(res.body.message).toBe('Connection request sent.');
        expect(res.body.connection).toBeDefined();
    });

    it('should prevent a user from connecting with themselves', async () => {
        const res = await request(app)
            .post(`/api/connections/request/${userAId}`)
            .set('Authorization', userAId);

        expect(res.status).toBe(400);
        expect(res.body.message).toBe('Cannot connect with yourself.');
    });

    it('should not allow a duplicate connection request', async () => {
        // Create the first request directly in DB
        await Connection.create({ sender: userAId, receiver: userBId });

        const res = await request(app)
            .post(`/api/connections/request/${userBId}`)
            .set('Authorization', userAId);

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/already/i);
    });

    it('should return all connections for the current user', async () => {
        await Connection.create({ sender: userAId, receiver: userBId, status: 'Accepted' });

        const res = await request(app)
            .get('/api/connections/my')
            .set('Authorization', userAId);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBe(1);
    });

    it('should allow the receiver to accept a connection request', async () => {
        const conn = await Connection.create({ sender: userAId, receiver: userBId });

        const res = await request(app)
            .put(`/api/connections/${conn._id}/respond`)
            .set('Authorization', userBId)
            .send({ status: 'Accepted' });

        expect(res.status).toBe(200);
        expect(res.body.connection.status).toBe('Accepted');
    });

    it('should return 400 for invalid status when responding', async () => {
        const conn = await Connection.create({ sender: userAId, receiver: userBId });

        const res = await request(app)
            .put(`/api/connections/${conn._id}/respond`)
            .set('Authorization', userBId)
            .send({ status: 'Maybe' });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe('Invalid status.');
    });

    it('should return 403 if a non-receiver tries to respond', async () => {
        const conn = await Connection.create({ sender: userAId, receiver: userBId });

        // userA is the SENDER, not the receiver — should be forbidden
        const res = await request(app)
            .put(`/api/connections/${conn._id}/respond`)
            .set('Authorization', userAId)
            .send({ status: 'Accepted' });

        expect(res.status).toBe(403);
    });

    it('should remove a connection successfully', async () => {
        const conn = await Connection.create({ sender: userAId, receiver: userBId, status: 'Accepted' });

        const res = await request(app)
            .delete(`/api/connections/${conn._id}`)
            .set('Authorization', userAId);

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Connection removed.');
    });

    it('should return 404 when trying to remove a non-existent connection', async () => {
        const fakeId = new mongoose.Types.ObjectId();

        const res = await request(app)
            .delete(`/api/connections/${fakeId}`)
            .set('Authorization', userAId);

        expect(res.status).toBe(404);
    });
});
