'use strict';

const { Queue } = require('bullmq');
const { redisClient } = require('../../config/redis');

let emailQueue = null;

if (redisClient && !redisClient.isDummy) {
    emailQueue = new Queue('EmailQueue', { connection: redisClient });
}

module.exports = { emailQueue };
