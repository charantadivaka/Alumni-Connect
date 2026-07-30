'use strict';

const { Worker } = require('bullmq');
const { redisClient } = require('../../config/redis');
const emailService = require('../../utils/emailService');

let emailWorker = null;

if (redisClient && !redisClient.isDummy) {
    emailWorker = new Worker('EmailQueue', async (job) => {
        const { type, payload } = job.data;
        
        switch (type) {
            case 'OTP':
                await emailService._sendOtpEmail(payload.toEmail, payload.otp, payload.name);
                break;
            case 'RESET_PASSWORD':
                await emailService._sendPasswordResetEmail(payload.toEmail, payload.resetLink, payload.name);
                break;
            case 'MENTORSHIP_ACCEPTED':
                await emailService._sendMentorshipAcceptedEmail(payload.studentEmail, payload.studentName, payload.alumniName, payload.topic);
                break;
            case 'JOB_APPLICATION':
                await emailService._sendJobApplicationEmail(payload.alumniEmail, payload.alumniName, payload.studentName, payload.jobTitle);
                break;
            default:
                console.warn('[BullMQ] Unknown email job type:', type);
        }
    }, { connection: redisClient });

    emailWorker.on('completed', job => {
        // console.log(`[BullMQ] Email job ${job.id} completed successfully`);
    });

    emailWorker.on('failed', (job, err) => {
        console.error(`[BullMQ] Email job ${job.id} failed:`, err.message);
    });
}

module.exports = { emailWorker };
