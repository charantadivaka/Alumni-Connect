const express      = require('express');
const http         = require('http');
const { Server }   = require('socket.io');
const dotenv       = require('dotenv');
const cors         = require('cors');
const helmet       = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit    = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');

dotenv.config();

const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorMiddleware');

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
const applicationController = require('./controllers/applicationController');
const mentorshipController  = require('./controllers/mentorshipController');
const interviewController   = require('./controllers/interviewController');
const referralController    = require('./controllers/referralController');
const eventController       = require('./controllers/eventController');

// ── Connect DB ───────────────────────────────────────────────────────────────
connectDB();

const app    = express();
const server = http.createServer(app);

// ── Socket.io ────────────────────────────────────────────────────────────────
const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:5173',
        methods: ['GET', 'POST'],
        credentials: true,
    },
});

// Inject io into controllers that need it
applicationController.setIo(io);
mentorshipController.setIo(io);
interviewController.setIo(io);
referralController.setIo(io);
eventController.setIo(io);

// ── Security & Performance ──────────────────────────────────────────────────
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
const authLimiter   = rateLimit({ windowMs: 1 * 60 * 1000, max: 1000000,
    message: { message: 'Too many login attempts, try again later.' },
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
app.use(express.json({ limit: '10mb' }));   // 10mb for base64 resumes / images
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',          authLimiter, require('./routes/authRoutes'));
app.use('/api/profile',       require('./routes/profileRoutes'));
app.use('/api/match',         require('./routes/matchRoutes'));
app.use('/api/jobs',          require('./routes/jobRoutes'));
app.use('/api/applications',  require('./routes/applicationRoutes'));
app.use('/api/slots',         require('./routes/slotRoutes'));
app.use('/api/mentorship',    require('./routes/mentorshipRoutes'));
app.use('/api/interviews',    require('./routes/interviewRoutes'));
app.use('/api/messages',      require('./routes/messageRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/events',        require('./routes/eventRoutes'));
app.use('/api/forums',        require('./routes/forumRoutes'));
app.use('/api/stories',       require('./routes/storyRoutes'));
app.use('/api/resumes',       require('./routes/resumeRoutes'));
app.use('/api/referrals',     require('./routes/referralRoutes'));
app.use('/api/startups',      require('./routes/startupRoutes'));
app.use('/api/bookmarks',     require('./routes/bookmarkRoutes'));
app.use('/api/connections',   require('./routes/connectionRoutes'));
app.use('/api/admin',         require('./routes/adminRoutes'));
app.use('/api/colleges',      require('./routes/collegeRoutes'));

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

// ── Socket.io Real-time Events ────────────────────────────────────────────────
const onlineUsers = new Map(); // userId → socketId

io.on('connection', (socket) => {
    console.log(`⚡ Socket connected: ${socket.id}`);

    // User comes online — join their personal room for notifications
    socket.on('user_online', (userId) => {
        onlineUsers.set(userId, socket.id);
        socket.join(userId);                                  // join personal room
        io.emit('online_users', [...onlineUsers.keys()]);
        console.log(`👤 ${userId} online`);
    });

    // Private message (real-time delivery)
    socket.on('send_message', ({ senderId, receiverId, text, senderName }) => {
        const payload = { senderId, receiverId, text, senderName, timestamp: new Date().toISOString() };
        const receiverSocketId = onlineUsers.get(receiverId);
        if (receiverSocketId) io.to(receiverSocketId).emit('receive_message', payload);
        socket.emit('message_sent', payload);
    });

    // Typing indicators
    socket.on('typing',      ({ senderId, receiverId }) => {
        const s = onlineUsers.get(receiverId);
        if (s) io.to(s).emit('user_typing', { senderId });
    });
    socket.on('stop_typing', ({ senderId, receiverId }) => {
        const s = onlineUsers.get(receiverId);
        if (s) io.to(s).emit('user_stop_typing', { senderId });
    });

    // Disconnect
    socket.on('disconnect', () => {
        for (const [uid, sid] of onlineUsers.entries()) {
            if (sid === socket.id) {
                onlineUsers.delete(uid);
                io.emit('online_users', [...onlineUsers.keys()]);
                console.log(`❌ ${uid} offline`);
                break;
            }
        }
    });
});

// ── Start server ───────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server: http://localhost:${PORT}`));
