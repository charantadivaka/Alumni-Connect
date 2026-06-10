const Message = require('../models/Message');
const mongoose = require('mongoose');

const getThreads = async (req, res) => {
    try {
        const userId = req.user._id;

        const threads = await Message.aggregate([
            {
                $match: {
                    $or: [
                        { sender: new mongoose.Types.ObjectId(userId) },
                        { receiver: new mongoose.Types.ObjectId(userId) }
                    ],
                },
            },
            {
                $sort: { createdAt: -1 },
            },
            {
                $group: {
                    _id: {
                        $cond: [
                            { $eq: ["$sender", new mongoose.Types.ObjectId(userId)] },
                            "$receiver",
                            "$sender"
                        ]
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
            {
                $sort: { 'lastMessage.createdAt': -1 }
            }
        ]);
        res.json(threads);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const getConversation = async (req, res) => {
    try {
        const { userId } = req.params;
        const myId = req.user._id;

        const messages = await Message.find({
            $or: [
                { sender: myId, receiver: userId },
                { sender: userId, receiver: myId }
            ]
        }).sort({ createdAt: 1 });

        res.json(messages);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const saveMessage = async (req, res) => {
    try {
        const { receiverId, text } = req.body;
        const message = await Message.create({
            sender: req.user._id,
            receiver: receiverId,
            text,
        });
        res.status(201).json(message);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const markRead = async (req, res) => {
    try {
        await Message.updateMany(
            { sender: req.params.userId, receiver: req.user._id, isRead: false },
            { $set: { isRead: true } },
        );
        res.status(200).json({ message: "Marked as Read" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { getThreads, getConversation, saveMessage, markRead };
