const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const mentorshipRoutes = require('../routes/mentorshipRoutes');
const Mentorship = require('../models/Mentorship');
const User = require('../models/User');

const app = express();
app.use(express.json());

// Mock auth middleware and role restriction
app.use((req, res, next) => {
    if (req.headers.authorization) {
        req.user = { _id: req.headers.authorization, role: req.headers.role };
        next();
    } else {
        res.status(401).json({ message: 'Not authorized' });
    }
});
app.use('/api/mentorship', mentorshipRoutes);

describe('Mentorship API Integration Tests', () => {
    let studentId;
    let alumniId;

    beforeEach(async () => {
        const student = await User.create({ name: 'Student', email: 's@test.com', password: 'pass', role: 'student' });
        const alumni = await User.create({ name: 'Alumni', email: 'a@test.com', password: 'pass', role: 'alumni' });
        studentId = student._id.toString();
        alumniId = alumni._id.toString();
    });

    it('should allow student to request a mentorship session', async () => {
        const res = await request(app)
            .post('/api/mentorship')
            .set('Authorization', studentId)
            .set('role', 'student')
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
            .set('role', 'alumni')
            .send({ status: 'Accepted' });
        
        expect(res.status).toBe(200);
        expect(res.body.status).toBe('Accepted');
    });
});
