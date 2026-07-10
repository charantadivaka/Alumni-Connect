const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const authRoutes = require('../routes/authRoutes');
const User = require('../models/User');

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Auth API Integration Tests', () => {
    it('should successfully send OTP for a new user registration', async () => {
        const res = await request(app)
            .post('/api/auth/send-otp')
            .send({
                name: 'Test Student',
                email: 'teststudent@example.com',
                password: 'password123',
                role: 'student'
            });
        
        expect(res.status).toBe(200);
        expect(res.body.message).toBe('OTP sent successfully');
        expect(res.body.email).toBe('teststudent@example.com');
    });

    it('should return error for invalid email', async () => {
        const res = await request(app)
            .post('/api/auth/send-otp')
            .send({
                name: 'Test Student',
                email: 'invalid-email',
                password: 'password123',
                role: 'student'
            });
        
        expect(res.status).toBe(400);
        expect(res.body.message).toContain('Valid email is required');
    });

    it('should login an existing user', async () => {
        await User.create({
            name: 'Test Alumni',
            email: 'alumni@test.com',
            password: 'password123',
            role: 'alumni',
            isEmailVerified: true
        });

        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'alumni@test.com', password: 'password123' });
        
        expect(res.status).toBe(200);
        expect(res.body.email).toBe('alumni@test.com');
    });

    it('should reject login with wrong password', async () => {
        await User.create({
            name: 'Test Admin',
            email: 'admin@test.com',
            password: 'password123',
            role: 'admin',
            isEmailVerified: true
        });

        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'admin@test.com', password: 'wrongpassword' });
        
        expect(res.status).toBe(401);
        expect(res.body.message).toBe('Invalid credentials');
    });
});
