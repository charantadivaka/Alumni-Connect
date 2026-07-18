const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const Mentorship = require('../models/Mentorship');
const User = require('../models/User');

// ── Mock the auth middleware so protect() doesn't need a real JWT ─────────────
jest.mock('../middleware/authMiddleware', () => ({
    protect: (req, res, next) => {
        if (!req.headers.authorization) {
            return res.status(401).json({ message: 'Not authorized' });
        }
        req.user = {
            _id: req.headers.authorization,
            role: req.headers['x-role'] || 'student',
        };
        next();
    },
}));

// Mock sendNotification to avoid real socket/DB calls
jest.mock('../utils/sendNotification', () => jest.fn().mockResolvedValue(null));

// Routes must be required AFTER mocks are set up
const mentorshipRoutes = require('../routes/mentorshipRoutes');

const app = express();
app.use(express.json());
app.use('/api/mentorship', mentorshipRoutes);

describe('Mentorship API Integration Tests', () => {
    let studentId;
    let alumniId;

    beforeEach(async () => {
        const student = await User.create({ name: 'Student', email: 's@test.com', password: 'pass123', role: 'student', collegeRollNumber: 'ROLL-M-001' });
        const alumni = await User.create({ name: 'Alumni', email: 'a@test.com', password: 'pass123', role: 'alumni', collegeRollNumber: 'ROLL-M-002' });
        studentId = student._id.toString();
        alumniId = alumni._id.toString();
    });

    it('should allow student to request a mentorship session', async () => {
        const res = await request(app)
            .post('/api/mentorship')
            .set('Authorization', studentId)
            .set('x-role', 'student')
            .send({
                alumniId,
                topic: 'Career Advice',
                goals: 'To become a senior dev'
            });
        
        expect(res.status).toBe(201);
        expect(res.body.topic).toBe('Career Advice');
        expect(res.body.status).toBe('Pending');
    });

    it('should allow alumni to accept a mentorship session', async () => {
        const session = await Mentorship.create({
            student: studentId,
            alumni: alumniId,
            topic: 'Resume Review'
        });

        const res = await request(app)
            .put(`/api/mentorship/${session._id}/respond`)
            .set('Authorization', alumniId)
            .set('x-role', 'alumni')
            .send({ status: 'Accepted' });
        
        expect(res.status).toBe(200);
        expect(res.body.status).toBe('Accepted');
    });
});
