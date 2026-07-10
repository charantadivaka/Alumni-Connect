const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const jobRoutes = require('../routes/jobRoutes');
const Job = require('../models/Job');
const User = require('../models/User');

const app = express();
app.use(express.json());

// Mock auth middleware for testing
app.use((req, res, next) => {
    if (req.headers.authorization) {
        req.user = { _id: req.headers.authorization }; // simple mock
        next();
    } else {
        res.status(401).json({ message: 'Not authorized' });
    }
});

app.use('/api/jobs', jobRoutes);

describe('Jobs API Integration Tests', () => {
    let alumniId;

    beforeEach(async () => {
        const alumni = await User.create({
            name: 'Job Poster',
            email: 'poster@test.com',
            password: 'pass',
            role: 'alumni',
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
        // Should only return active jobs by default
        expect(res.body.jobs.length).toBe(1);
        expect(res.body.jobs[0].title).toBe('Active Job');
    });
});
