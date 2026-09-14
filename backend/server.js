const express = require('express');
const http = require('http');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');

dotenv.config();

const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorMiddleware');
const requestId = require('./shared/middleware/requestId');
const initSocketManager = require('./shared/events/socketManager');

// Initialize Background Workers
require('./shared/jobs/email.worker');

// Try to load optional performance/monitoring dependencies
let compression, morgan, logger;
try {
    compression = require('compression');
    morgan = require('morgan');
    logger = require('./config/logger');
} catch (e) {
    console.warn('⚠️ Performance/Logging modules not found. Run npm install.');
}

// ── Controllers that need the io instance ────────────────────────────────────
// Removed controllers as they no longer need io injection

// ── Connect DB ───────────────────────────────────────────────────────────────
connectDB();

// ── Connect Elasticsearch ──────────────────────────────────────────────────
const { initElasticsearch } = require('./config/elasticsearch');
initElasticsearch();

const app = express();
// Required for express-rate-limit when hosted on a platform like Render (which uses reverse proxies)
app.set('trust proxy', 1);
const server = http.createServer(app);

// ── Socket.io ────────────────────────────────────────────────────────────────
initSocketManager(server);

// ── Security & Performance ──────────────────────────────────────────────────
app.use(requestId);                                // attach X-Request-ID to every request
app.use(helmet({ contentSecurityPolicy: false }));
app.use(mongoSanitize({ replaceWith: '_' }));

if (compression) {
    app.use(compression());
}
if (morgan && logger) {
    app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
}

// ── Rate limiting ─────────────────────────────────────────────────────────────
const globalLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 300 });
// Auth limiter: 10 requests per minute (prevents brute-force attacks)
const authLimiter   = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 10,
    message: { message: 'Too many login attempts. Please wait a minute and try again.' },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/', globalLimiter);

// ── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = [
    process.env.CLIENT_URL || 'http://localhost:5173',
    'http://127.0.0.1:5173',
];
app.use(cors({
    origin: (origin, cb) => {
        if (!origin || allowedOrigins.includes(origin)) cb(null, true);
        else cb(new Error('CORS not allowed'));
    },
    credentials: true,
}));

// ── Body & Cookie parsers ─────────────────────────────────────────────────────
app.use(express.json({ limit: '5mb' }));    // 5mb for base64 resumes / images
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',          authLimiter, require('./modules/auth/auth.routes'));
app.use('/api/profile',       require('./modules/profile/profile.routes'));
app.use('/api/match',         require('./modules/match/match.routes'));
app.use('/api/jobs',          require('./modules/jobs/job.routes'));
app.use('/api/applications',  require('./modules/jobs/application.routes'));
app.use('/api/slots',         require('./modules/mentorship/slot.routes'));
app.use('/api/mentorship',    require('./modules/mentorship/mentorship.routes'));
app.use('/api/interviews',    require('./modules/interviews/interview.routes'));
app.use('/api/messages',      require('./modules/messages/message.routes'));
app.use('/api/notifications', require('./modules/notifications/notification.routes'));
app.use('/api/events',        require('./modules/events/event.routes'));
app.use('/api/forums',        require('./modules/community/forum.routes'));
app.use('/api/stories',       require('./modules/community/story.routes'));
app.use('/api/resumes',       require('./modules/resumes/resume.routes'));
app.use('/api/referrals',     require('./modules/referrals/referral.routes'));
app.use('/api/bookmarks',     require('./modules/bookmarks/bookmark.routes'));
app.use('/api/connections',   require('./modules/connections/connection.routes'));
app.use('/api/admin',         require('./modules/admin/admin.routes'));
app.use('/api/colleges',      require('./modules/colleges/college.routes'));
app.use('/api/payments',      require('./modules/payments/payment.routes'));

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/', (req, res) => res.json({ message: '🎓 Alumni Network API running' }));

// ── Swagger API Documentation ────────────────────────────────────────────────
try {
    const { swaggerUi, specs } = require('./config/swagger');
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
    console.log('📄 Swagger docs available at /api-docs');
} catch (e) {
    console.warn('⚠️ Swagger modules not found. Run npm install.');
}

// ── 404 ────────────────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ message: 'Route not found' }));

// ── Global error handler ──────────────────────────────────────────────────────
app.use(errorHandler);

// ── Socket.io logic moved to shared/events/socketManager.js ─────────────────

// ── Startup Warnings ─────────────────────────────────────────────────────────
if (!process.env.CLOUDINARY_CLOUD_NAME) {
    console.warn('⚠️  [WARNING] CLOUDINARY_CLOUD_NAME is not set.');
    console.warn('   Files (profile pics, resumes) will be stored as base64 in MongoDB.');
    console.warn('   This is NOT suitable for production. Set Cloudinary credentials in .env.');
}

if (!process.env.REDIS_URL && !process.env.REDIS_HOST) {
    console.warn('⚠️  [WARNING] Redis is not configured. OTP store is in-memory (not scalable).');
}

if (process.env.NODE_ENV !== 'production') {
    console.warn('⚠️  [WARNING] Running in development mode.');
}

// ── Start server ───────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server: http://localhost:${PORT}`));
