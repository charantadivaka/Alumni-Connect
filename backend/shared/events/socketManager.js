'use strict';

const { Server } = require('socket.io');
const eventBus = require('./eventBus');

const initSocketManager = (server) => {
    const io = new Server(server, {
        cors: {
            origin: process.env.CLIENT_URL || 'http://localhost:5173',
            methods: ['GET', 'POST'],
            credentials: true,
        },
    });

    const onlineUsers = new Map(); // userId → socketId

    // Listen to internal events from other modules
    eventBus.on('send_notification', ({ userId, notification }) => {
        io.to(userId.toString()).emit('new_notification', notification);
    });

    io.on('connection', (socket) => {
        console.log(`⚡ Socket connected: ${socket.id}`);

        socket.on('user_online', (userId) => {
            socket.userId = userId; // Store verified ID on socket
            onlineUsers.set(userId, socket.id);
            socket.join(userId);
            io.emit('online_users', [...onlineUsers.keys()]);
            console.log(`👤 ${userId} online`);
        });

        socket.on('send_message', async ({ receiverId, text, senderName }) => {
            try {
                const senderId = socket.userId;
                if (!senderId) return;

                const Connection = require('../../models/Connection');
                const connection = await Connection.findOne({
                    $or: [
                        { sender: senderId, receiver: receiverId },
                        { sender: receiverId, receiver: senderId }
                    ],
                    status: 'Accepted'
                });

                if (!connection) {
                    console.log(`[Socket] Blocked send_message from ${senderId} to ${receiverId} - not connected.`);
                    return;
                }

                const payload = { senderId, receiverId, text, senderName, timestamp: new Date().toISOString() };
                const receiverSocketId = onlineUsers.get(receiverId);
                if (receiverSocketId) io.to(receiverSocketId).emit('receive_message', payload);
                socket.emit('message_sent', payload);
            } catch (error) {
                console.error('[Socket Error] send_message:', error);
            }
        });

        socket.on('typing', ({ receiverId }) => {
            const senderId = socket.userId;
            if (!senderId) return;
            const s = onlineUsers.get(receiverId);
            if (s) io.to(s).emit('user_typing', { senderId });
        });

        socket.on('stop_typing', ({ receiverId }) => {
            const senderId = socket.userId;
            if (!senderId) return;
            const s = onlineUsers.get(receiverId);
            if (s) io.to(s).emit('user_stop_typing', { senderId });
        });

        socket.on('call_user', ({ userToCall, signal, from, callerName, sessionId, sessionType }) => {
            io.to(userToCall).emit('incoming_call', { signal, from, callerName, sessionId, sessionType });
        });

        socket.on('answer_call', ({ to, signal }) => {
            io.to(to).emit('call_accepted', { signal });
        });

        socket.on('ice_candidate', ({ to, candidate }) => {
            io.to(to).emit('ice_candidate', { candidate });
        });

        socket.on('end_call', ({ to }) => {
            io.to(to).emit('call_ended');
        });

        socket.on('recording_started', ({ to }) => {
            io.to(to).emit('recording_started');
        });

        socket.on('recording_stopped', ({ to }) => {
            io.to(to).emit('recording_stopped');
        });

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

    return io;
};

module.exports = initSocketManager;
