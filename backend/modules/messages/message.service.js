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
                deletedBy: { $ne: new mongoose.Types.ObjectId(userId) }
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
                'lastMessage.fileUrl': 1,
                'lastMessage.fileType': 1,
                'lastMessage.isDeleted': 1,
                'lastMessage.createdAt': 1,
                'lastMessage.isRead': 1,
                unreadCount: 1,
            },
        },
        { $sort: { 'lastMessage.createdAt': -1 } },
    ]);

    // Fetch the current user to get their blockedUsers list
    const currentUser = await User.findById(userId).select('blockedUsers');
    const blockedIds = (currentUser.blockedUsers || []).map(id => id.toString());

    // Flag threads that are blocked
    threads.forEach(t => {
        t.partner.isBlocked = blockedIds.includes(t.partner._id.toString());
    });

    return threads;
};

/** Get full conversation between two users. */
const getConversation = async (userId1, userId2) => {
    return Message.find({
        $or: [
            { sender: userId1, receiver: userId2 },
            { sender: userId2, receiver: userId1 },
        ],
        deletedBy: { $ne: userId1 }
    })
    .populate('replyTo', 'text sender fileUrl fileType isDeleted')
    .sort({ createdAt: 1 });
};

/**
 * Save a message.
 * Enforces that sender and receiver must have an 'Accepted' connection.
 */
const saveMessage = async (senderId, receiverId, data) => {
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

    // Check if blocked
    const sender = await User.findById(senderId);
    if (sender.blockedUsers?.includes(receiverId) || receiver.blockedUsers?.includes(senderId)) {
        throw Object.assign(new Error('Messaging restricted due to block.'), { statusCode: 403 });
    }

    const { text, replyTo, fileUrl, fileType, fileName } = data;

    const msg = await Message.create({ 
        sender: senderId, 
        receiver: receiverId, 
        text,
        replyTo: replyTo || null,
        fileUrl: fileUrl || '',
        fileType: fileType || '',
        fileName: fileName || ''
    });

    return Message.findById(msg._id).populate('replyTo', 'text sender fileUrl fileType isDeleted');
};

/** Mark conversation as read. */
const markRead = async (senderId, receiverId) => {
    await Message.updateMany(
        { sender: senderId, receiver: receiverId, isRead: false },
        { isRead: true }
    );
};

const editMessage = async (msgId, userId, newText) => {
    const msg = await Message.findOne({ _id: msgId, sender: userId, isDeleted: false });
    if (!msg) throw Object.assign(new Error('Message not found or unauthorized'), { statusCode: 404 });
    
    msg.text = newText;
    msg.isEdited = true;
    await msg.save();
    return msg;
};

const deleteMessage = async (msgId, userId) => {
    const msg = await Message.findOne({ _id: msgId, sender: userId });
    if (!msg) throw Object.assign(new Error('Message not found or unauthorized'), { statusCode: 404 });
    
    msg.isDeleted = true;
    msg.text = 'This message was deleted';
    msg.fileUrl = '';
    msg.fileName = '';
    msg.fileType = '';
    await msg.save();
    return msg;
};

const deleteConversation = async (userId, partnerId) => {
    await Message.updateMany(
        {
            $or: [
                { sender: userId, receiver: partnerId },
                { sender: partnerId, receiver: userId },
            ]
        },
        { $addToSet: { deletedBy: userId } }
    );
};

const blockUser = async (userId, targetId) => {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');
    
    const idx = user.blockedUsers.indexOf(targetId);
    if (idx > -1) {
        user.blockedUsers.splice(idx, 1);
    } else {
        user.blockedUsers.push(targetId);
    }
    
    await user.save();
    return { blocked: idx === -1 };
};

const reportUser = async (userId, targetId, reason) => {
    const user = await User.findById(targetId);
    if (!user) throw new Error('User not found');
    
    user.reports.push({ reportedBy: userId, reason });
    await user.save();
};

module.exports = { 
    getThreads, 
    getConversation, 
    saveMessage, 
    markRead,
    editMessage,
    deleteMessage,
    deleteConversation,
    blockUser,
    reportUser
};
