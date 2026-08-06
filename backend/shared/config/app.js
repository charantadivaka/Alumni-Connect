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
    // CRIT-01: Password is stored as a bcrypt hash, never plaintext.
    // To generate: node -e "require('bcryptjs').hash('YourPassword',12).then(console.log)"
    admin: {
        username:     process.env.ADMIN_USERNAME      || 'Admin',
        passwordHash: process.env.ADMIN_PASSWORD_HASH || null,
        email:        process.env.ADMIN_EMAIL         || 'admin@college.edu',
    },

    // ── Razorpay ─────────────────────────────────────────────────────────────────
    razorpay: {
        keyId:     process.env.RAZORPAY_KEY_ID     || null,
        keySecret: process.env.RAZORPAY_KEY_SECRET || null,
        isConfigured: !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
    },
};

// ── Startup validation ────────────────────────────────────────────────────────
// CRIT-05: Crash hard in production when critical secrets are missing or insecure.
// In development these produce prominent warnings instead of crashes so the server
// can still start with partial configuration during local testing.
const INSECURE_JWT_PLACEHOLDER = 'change_this_to_a_long_random_string_min_32_chars';
const errors   = [];
const warnings = [];

// JWT_SECRET checks
if (!config.jwt.secret) {
    errors.push('JWT_SECRET is not set — authentication will fail.');
} else if (config.jwt.secret === INSECURE_JWT_PLACEHOLDER) {
    errors.push(
        'JWT_SECRET is still the default placeholder value. ' +
        'Set a strong random string (min 32 chars) in your .env file.'
    );
} else if (config.jwt.secret.length < 32) {
    errors.push(`JWT_SECRET is too short (${config.jwt.secret.length} chars). Minimum is 32 characters.`);
}

// Admin credential checks
if (!config.admin.passwordHash) {
    errors.push(
        'ADMIN_PASSWORD_HASH is not set. ' +
        'Generate one with: node -e "require(\'bcryptjs\').hash(\'YourPassword\',12).then(console.log)"'
    );
}

if (errors.length > 0) {
    if (config.server.isProduction) {
        // In production, crash immediately — running with insecure config is unacceptable
        errors.forEach(e => console.error(`❌ [Config] FATAL: ${e}`));
        process.exit(1);
    } else {
        // In development, warn loudly but allow startup so devs can still work
        console.warn('\n⚠️  [Config] Security warnings (would be FATAL in production):');
        errors.forEach(e => console.warn(`   • ${e}`));
        console.warn('⚠️  DO NOT deploy with these warnings active.\n');
    }
}

if (!config.database.uri) {
    console.warn('⚠️  [Config] MONGO_URI is not set — database connection will fail.');
}

module.exports = config;
