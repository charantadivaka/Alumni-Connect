const Message = require('../models/Message');
const mongoose = require('mongoose');

// @desc  Get all conversation threads for current user
// @route GET /api/messages/threads
const getThreads = async (req, res) => {
    try {
        const userId = req.user._id;

        // Aggregate: get latest message per conversation partner
        const threads = await Message.aggregate([
            {
                $match: {
                    $or: [
                        { sender: new mongoose.Types.ObjectId(userId) },
                        { receiver: new mongoose.Types.ObjectId(userId) },
                    ],
                },
            },
            { $sort: { createdAt: -1 } },
            {
                $group: {
                    _id: {
                        $cond: [
                            { $eq: ['$sender', new mongoose.Types.ObjectId(userId)] },
                            '$receiver',
                            '$sender',
                        ],
                    },
                    lastMessage: { $first: '$$ROOT' },
                    unreadCount: {
                        $sum: {
                            $cond: [
                                { $and: [{ $eq: ['$receiver', new mongoose.Types.ObjectId(userId)] }, { $eq: ['$isRead', false] }] },
                                1, 0,
                            ],
                        },
                    },
                    totalReceived: {
                        $sum: {
                            $cond: [
                                { $eq: ['$receiver', new mongoose.Types.ObjectId(userId)] },
                                1, 0,
                            ],
                        },
                    },
                },
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'partner',
                },
            },
            { $unwind: '$partner' },
            {
                $project: {
                    'partner._id': 1,
                    'partner.name': 1,
                    'partner.profilePicture': 1,
                    'partner.role': 1,
                    'partner.company': 1,
                    'lastMessage.text': 1,
                    'lastMessage.createdAt': 1,
                    'lastMessage.isRead': 1,
                    unreadCount: 1,
                },
            },
            { $sort: { 'lastMessage.createdAt': -1 } },
        ]);

        res.json(threads);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc  Get full conversation with a user
// @route GET /api/messages/:userId
const getConversation = async (req, res) => {
    try {
        const { userId } = req.params;
        const myId = req.user._id;

        const messages = await Message.find({
            $or: [
                { sender: myId, receiver: userId },
                { sender: userId, receiver: myId },
            ],
        }).sort({ createdAt: 1 });

        res.json(messages);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc  Save a message to DB
// @route POST /api/messages
const saveMessage = async (req, res) => {
    try {
        const { receiverId, text } = req.body;
        const senderId = req.user._id;

        // Verify connection requirement
        const Connection = require('../models/Connection');
        const User = require('../models/User');
        
        const [sender, receiver] = await Promise.all([
            User.findById(senderId),
            User.findById(receiverId)
        ]);

        if (!receiver) return res.status(404).json({ message: "Receiver not found" });

        // If student is messaging an alumni, they must have an accepted connection
        if (sender.role === 'student' && receiver.role === 'alumni') {
            const connection = await Connection.findOne({
                $or: [
                    { sender: senderId, receiver: receiverId },
                    { sender: receiverId, receiver: senderId }
                ]
            });

            if (!connection || connection.status !== 'Accepted') {
                return res.status(403).json({ message: "You must be connected to message this alumni." });
            }
        }

        const msg = await Message.create({
            sender: senderId,
            receiver: receiverId,
            text,
        });
        res.status(201).json(msg);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc  Mark conversation as read
// @route PUT /api/messages/:userId/read
const markRead = async (req, res) => {
    try {
        await Message.updateMany(
            { sender: req.params.userId, receiver: req.user._id, isRead: false },
            { isRead: true }
        );
        res.json({ message: 'Marked as read' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { getThreads, getConversation, saveMessage, markRead };
