const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');

dotenv.config();

const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorMiddleware');

const applicationController = require('./controllers/applicationController');
const mentorshipController = require('./controllers/mentorshipController');
const interviewController = require('./controllers/interviewController');
const referralController = require('./controllers/referralController');
const eventController = require('./controllers/eventController');

connectDB();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:5173',
        methods: ['GET', 'POST'],
        credentials: true,
    },
});

applicationController.setIo(io);
mentorshipController.setIo(io);
interviewController.setIo(io);
referralController.setIo(io);
eventController.setIo(io);

app.use(helmet({ contentSecurityPolicy: false }));
app.use(mongoSanitize({ replaceWith: '_' }));

const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { message: 'Too many login attempts, try again later.' },
});

app.use('/api/', globalLimiter);

const allowedOrigins = [
    process.env.CLIENT_URL || 'http://localhost:5173',
    'http://127.0.0.1:5173',
];

app.use(cors({
    origin: (origin, cb) => {
        if (!origin || allowedOrigins.includes(origin))
            cb(null, true);
        else cb(new Error('CORS not allowed'));
    },
    credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/api/auth', authLimiter, require('./routes/authRoutes'));
app.use('/api/profile', require('./routes/profileRoutes'));
app.use('/api/match', require('./routes/matchRoutes'));
app.use('/api/jobs', require('./routes/jobRoutes'));
app.use('/api/applications', require('./routes/applicationRoutes'));
app.use('/api/slots', require('./routes/slotRoutes'));
app.use('/api/mentorship', require('./routes/mentorshipRoutes'));
app.use('/api/interviews', require('./routes/interviewRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/events', require('./routes/eventRoutes'));
app.use('/api/forums', require('./routes/forumRoutes'));
app.use('/api/stories', require('./routes/storyRoutes'));
app.use('/api/resumes', require('./routes/resumeRoutes'));
app.use('/api/referrals', require('./routes/referralRoutes'));
app.use('/api/startups', require('./routes/startupRoutes'));
app.use('/api/bookmarks', require('./routes/bookmarkRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));

app.get('/', (req, res) => res.json({ message: 'Alumni Network API running' }));

app.use((req, res) =>
    res.status(404).json({ message: 'Route not found' })
);

app.use(errorHandler);

const onlineUsers = new Map();

io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on('user_online', (userId) => {
        onlineUsers.set(userId, socket.id);
        socket.join(userId);
        io.emit('online_users', [...onlineUsers.keys()]);
        console.log(`${userId} online`);
    });

    socket.on('send_message', ({ senderId, recieverId, text, senderName }) => {
        const payload = { senderId, recieverId, text, senderName, timestamp: new Date().toISOString() };
        const recieverSocketId = onlineUsers.get(recieverId);
        if (recieverSocketId) io.to(recieverSocketId).emit('receive_message', payload);
        socket.emit('message_sent', payload);
    });

    socket.on('typing', ({ senderId, receiverId }) => {
        const s = onlineUsers.get(receiverId);
        if (s) io.to(s).emit('user_typing', { senderId });
    });

    socket.on('stop_typing', ({ senderId, receiverId }) => {
        const s = onlineUsers.get(receiverId);
        if (s) io.to(s).emit('user_stop_typing', { senderid });
    });

    socket.on('disconnect', () => {
        for (const [uid, sid] of onlineUsers.entries()) {
            if (sid === socket.id) {
                onlineUsers.delete(uid);
                io.emit('online_users', [...onlineUsers.keys()]);
                console.log(`${uid} offline`);
                break;
            }
        }
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on: http://localhost:${PORT}`));