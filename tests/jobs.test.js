const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const Job = require('../models/Job');
const User = require('../models/User');

// ── Mock the auth middleware so protect() doesn't need a real JWT ─────────────
jest.mock('../middleware/authMiddleware', () => ({
    protect: (req, res, next) => {
        if (!req.headers.authorization) {
            return res.status(401).json({ message: 'Not authorized' });
        }
        req.user = {
            _id: req.headers.authorization,
            role: 'alumni',
            company: 'Tech Corp',   // required by createJob validation
        };
        next();
    },
}));

// Mock Redis to avoid network dependency
jest.mock('../config/redis', () => ({
    invalidatePattern: jest.fn().mockResolvedValue(null),
    cacheMiddleware: () => (req, res, next) => next(),
}));

// Mock badge service
jest.mock('../utils/badgeService', () => ({
    checkAndAwardBadges: jest.fn().mockResolvedValue(null),
}));

// Routes must be required AFTER mocks are set up
const jobRoutes = require('../routes/jobRoutes');

const app = express();
app.use(express.json());
app.use('/api/jobs', jobRoutes);

describe('Jobs API Integration Tests', () => {
    let alumniId;

    beforeEach(async () => {
        const alumni = await User.create({
            name: 'Job Poster',
            email: 'poster@test.com',
            password: 'pass123',
            role: 'alumni',
            collegeRollNumber: 'ROLL-JOB-001',
            company: 'Tech Corp'
        });
        alumniId = alumni._id.toString();
    });

    it('should create a job posting', async () => {
        const res = await request(app)
            .post('/api/jobs')
            .set('Authorization', alumniId)
            .send({
                title: 'Software Engineer',
                company: 'Tech Corp',
                description: 'Great job opportunity for freshers.',
                jobType: 'Full-time',
                location: 'Remote'
            });
        
        expect(res.status).toBe(201);
        expect(res.body.title).toBe('Software Engineer');
        expect(res.body.company).toBe('Tech Corp');
    });

    it('should fetch all active jobs', async () => {
        await Job.create({
            title: 'Active Job',
            company: 'Comp A',
            description: 'Desc',
            postedBy: alumniId,
            isActive: true
        });

        await Job.create({
            title: 'Inactive Job',
            company: 'Comp A',
            description: 'Desc',
            postedBy: alumniId,
            isActive: false
        });

        const res = await request(app)
            .get('/api/jobs')
            .set('Authorization', alumniId);
        
        expect(res.status).toBe(200);
        // getAllJobs returns a plain array (not { jobs: [...] })
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBe(1);
        expect(res.body[0].title).toBe('Active Job');
    });
});
