'use strict';

/**
 * Message Service
 * ───────────────
 * Business logic for direct messaging.
 */

const Message = require('../../models/Message');
const Connection = require('../../models/Connection');
const User = require('../../models/User');
const mongoose = require('mongoose');

/** Get all conversation threads for current user (aggregated). */
const getThreads = async (userId) => {
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

    return threads;
};

/** Get full conversation between two users. */
const getConversation = async (userId1, userId2) => {
    return Message.find({
        $or: [
            { sender: userId1, receiver: userId2 },
            { sender: userId2, receiver: userId1 },
        ],
    }).sort({ createdAt: 1 });
};

/**
 * Save a message.
 * Enforces that sender and receiver must have an 'Accepted' connection.
 */
const saveMessage = async (senderId, receiverId, text) => {
    const receiver = await User.findById(receiverId);
    if (!receiver) throw Object.assign(new Error('Receiver not found'), { statusCode: 404 });

    const connection = await Connection.findOne({
        $or: [
            { sender: senderId, receiver: receiverId },
            { sender: receiverId, receiver: senderId }
        ],
        status: 'Accepted'
    });

    if (!connection) {
        throw Object.assign(new Error('You must be connected to message this person.'), { statusCode: 403 });
    }

    const msg = await Message.create({ sender: senderId, receiver: receiverId, text });
    return msg;
};

/** Mark conversation as read. */
const markRead = async (senderId, receiverId) => {
    await Message.updateMany(
        { sender: senderId, receiver: receiverId, isRead: false },
        { isRead: true }
    );
};

module.exports = { getThreads, getConversation, saveMessage, markRead };
