'use strict';

/**
 * Central Application Configuration
 * ─────────────────────────────────
 * ALL process.env access happens here and ONLY here.
 * Every other module should import from this file instead of
 * reading process.env directly.
 *
 * dotenv must be called before this module is required.
 * It is called at the very top of server.js.
 */

const config = {
    // ── Server ──────────────────────────────────────────────────────────────────
    server: {
        port:      parseInt(process.env.PORT, 10) || 5000,
        nodeEnv:   process.env.NODE_ENV || 'development',
        clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
        isProduction: process.env.NODE_ENV === 'production',
        isDevelopment: process.env.NODE_ENV !== 'production',
    },

    // ── Database ─────────────────────────────────────────────────────────────────
    database: {
        uri: process.env.MONGO_URI || 'mongodb://localhost:27017/alumni-network',
    },

    // ── JWT ───────────────────────────────────────────────────────────────────────
    jwt: {
        secret:    process.env.JWT_SECRET,
        expiresIn: '30d',
        cookieMaxAge: 30 * 24 * 60 * 60 * 1000, // 30 days in ms
    },

    // ── Redis ─────────────────────────────────────────────────────────────────────
    redis: {
        url:  process.env.REDIS_URL || null,
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    },

    // ── Cloudinary ───────────────────────────────────────────────────────────────
    cloudinary: {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME || null,
        apiKey:    process.env.CLOUDINARY_API_KEY || null,
        apiSecret: process.env.CLOUDINARY_API_SECRET || null,
        isConfigured: !!process.env.CLOUDINARY_CLOUD_NAME,
    },

    // ── Email / SMTP ─────────────────────────────────────────────────────────────
    email: {
        host:    process.env.SMTP_HOST   || 'smtp.gmail.com',
        port:    parseInt(process.env.SMTP_PORT, 10) || 587,
        secure:  process.env.SMTP_SECURE === 'true',
        user:    process.env.SMTP_USER   || null,
        pass:    process.env.SMTP_PASS   || null,
        from:    process.env.SMTP_USER
                     ? `"AlumniConnect" <${process.env.SMTP_USER}>`
                     : '"AlumniConnect" <noreply@alumniconnect.dev>',
        isConfigured: !!process.env.SMTP_USER && !!process.env.SMTP_PASS,
    },

    // ── Admin Credentials ────────────────────────────────────────────────────────
    admin: {
        username: process.env.ADMIN_USERNAME || 'Admin',
        password: process.env.ADMIN_PASSWORD || 'Admin@123',
        email:    process.env.ADMIN_EMAIL    || 'admin@college.edu',
    },

    // ── Razorpay ─────────────────────────────────────────────────────────────────
    razorpay: {
        keyId:     process.env.RAZORPAY_KEY_ID     || null,
        keySecret: process.env.RAZORPAY_KEY_SECRET || null,
        isConfigured: !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
    },
};

// ── Startup validation ────────────────────────────────────────────────────────
// Warn about critical missing configs without crashing in development.
const warnings = [];

if (!config.jwt.secret) {
    warnings.push('JWT_SECRET is not set — authentication will fail.');
}
if (!config.database.uri) {
    warnings.push('MONGO_URI is not set — database connection will fail.');
}

if (warnings.length > 0) {
    warnings.forEach(w => console.warn(`⚠️  [Config] ${w}`));
}

module.exports = config;
