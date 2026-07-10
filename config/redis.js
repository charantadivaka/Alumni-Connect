let redisClient = null;

const createDummyClient = () => {
    return {
        get: async () => null,
        set: async () => null,
        setex: async () => null,
        del: async () => null,
        flushall: async () => null,
        pipeline: () => ({ del: () => {}, exec: async () => {} }),
        scanStream: () => {
            const EventEmitter = require('events');
            const e = new EventEmitter();
            process.nextTick(() => { e.emit('data', []); e.emit('end'); });
            return e;
        },
        isDummy: true
    };
};

try {
    const Redis = require('ioredis');
    const isProduction = process.env.NODE_ENV === 'production';
    
    // If no REDIS_URL is provided in development, silently bypass to avoid ECONNREFUSED spam
    if (!process.env.REDIS_URL && !isProduction) {
        console.log('📦 Redis not configured. Caching is disabled for development.');
        redisClient = createDummyClient();
    } else {
        let connectionAttempts = 0;
        const maxAttempts = isProduction ? 10 : 3;
        let fallbackTriggered = false;

        const fallbackToDummy = () => {
            if (fallbackTriggered) return;
            fallbackTriggered = true;
            console.warn('⚠️ Redis connection failed. Caching will be bypassed.');
            if (redisClient && typeof redisClient.disconnect === 'function') {
                try { redisClient.disconnect(); } catch (_) {}
            }
            redisClient = createDummyClient();
        };

        redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
            maxRetriesPerRequest: null,
            enableReadyCheck: false,
            retryStrategy: (times) => {
                connectionAttempts = times;
                if (times > maxAttempts) {
                    fallbackToDummy();
                    return null;
                }
                return Math.min(times * 100, 2000);
            }
        });

        redisClient.on('error', (err) => {
            if (!fallbackTriggered) {
                // Comment out or suppress the repeating error spam
                // console.error(`Redis error (attempt ${connectionAttempts}/${maxAttempts}):`, err.message);
            }
        });
        
        redisClient.on('connect', () => console.log('📦 Redis connected successfully'));
    }
} catch (e) {
    console.warn('⚠️ ioredis package not available. Caching bypassed.');
    redisClient = createDummyClient();
}

// ── Cache invalidation: delete all keys matching a glob pattern ───────────────
// Call this after any write operation that affects a cached endpoint.
// e.g. invalidatePattern('__express__/api/jobs*') after job create/update/delete
const invalidatePattern = async (pattern) => {
    if (redisClient.isDummy) return;
    try {
        const pipeline = redisClient.pipeline();
        let count = 0;
        const stream = redisClient.scanStream({ match: pattern, count: 100 });
        stream.on('data', (keys) => {
            keys.forEach(key => { pipeline.del(key); count++; });
        });
        await new Promise((resolve, reject) => {
            stream.on('end', resolve);
            stream.on('error', reject);
        });
        if (count > 0) {
            await pipeline.exec();
            console.log(`📦 Redis: invalidated ${count} key(s) matching "${pattern}"`);
        }
    } catch (err) {
        console.error('Redis invalidation error:', err.message);
    }
};

// ── Cache middleware for GET responses ────────────────────────────────────────
// Caches the JSON body AND any pagination headers (X-Total-Count, X-Total-Pages)
// together so that cache hits return the same response as a fresh DB query.
const cacheMiddleware = (durationInSeconds) => {
    return async (req, res, next) => {
        if (req.method !== 'GET') return next();
        if (redisClient.isDummy) return next(); // bypass when no Redis

        const key = `__express__${req.originalUrl || req.url}`;
        try {
            const cached = await redisClient.get(key);
            if (cached) {
                const { body, headers } = JSON.parse(cached);
                // Restore pagination headers that controllers may have set
                if (headers) {
                    Object.entries(headers).forEach(([h, v]) => res.set(h, v));
                }
                return res.json(body);
            }

            const originalJson = res.json.bind(res);
            res.json = (body) => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    // Capture pagination headers before they are flushed
                    const headers = {};
                    const totalCount = res.getHeader('X-Total-Count');
                    const totalPages = res.getHeader('X-Total-Pages');
                    if (totalCount !== undefined) headers['X-Total-Count'] = totalCount;
                    if (totalPages !== undefined) headers['X-Total-Pages'] = totalPages;

                    redisClient
                        .setex(key, durationInSeconds, JSON.stringify({ body, headers }))
                        .catch(() => {});
                }
                return originalJson(body);
            };
            next();
        } catch (_) {
            next();
        }
    };
};

module.exports = { redisClient, cacheMiddleware, invalidatePattern };
