let redisClient = null;

try {
    const Redis = require('ioredis');
    redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
        retryStrategy: (times) => {
            // Reconnect after 2 seconds
            return Math.min(times * 50, 2000);
        }
    });

    redisClient.on('error', (err) => {
        console.error('Redis connection error:', err.message);
    });

    redisClient.on('connect', () => {
        console.log('📦 Redis connected successfully');
    });

} catch (e) {
    console.warn('⚠️ ioredis is not installed or Redis failed to start. Caching will be bypassed.');
    // Dummy client if redis isn't available
    redisClient = {
        get: async () => null,
        set: async () => null,
        setex: async () => null,
        del: async () => null,
        flushall: async () => null
    };
}

// Middleware to cache API responses
const cacheMiddleware = (durationInSeconds) => {
    return async (req, res, next) => {
        if (req.method !== 'GET') return next();
        
        const key = `__express__${req.originalUrl || req.url}`;
        try {
            const cachedBody = await redisClient.get(key);
            if (cachedBody) {
                return res.json(JSON.parse(cachedBody));
            } else {
                res.sendResponse = res.json;
                res.json = (body) => {
                    redisClient.setex(key, durationInSeconds, JSON.stringify(body)).catch(() => {});
                    res.sendResponse(body);
                };
                next();
            }
        } catch (err) {
            next();
        }
    };
};

module.exports = { redisClient, cacheMiddleware };
