'use strict';

/**
 * Connection Service
 * ───────────────────
 * Business logic for connection requests and the student directory.
 * Extracted from connectionController.js.
 */

const Connection = require('../../models/Connection');
const User = require('../../models/User');
const College = require('../../models/College');

/**
 * Send a connection request.
 * Returns the created connection document.
 * Throws if the user tries to connect with themselves or a request already exists.
 */
const sendRequest = async (senderId, receiverId) => {
    if (receiverId === senderId.toString()) {
        throw Object.assign(new Error('Cannot connect with yourself.'), { statusCode: 400 });
    }

    const existing = await Connection.findOne({
        $or: [
            { sender: senderId, receiver: receiverId },
            { sender: receiverId, receiver: senderId }
        ]
    });
    if (existing) {
        throw Object.assign(
            new Error(`Connection already ${existing.status.toLowerCase()}.`),
            { statusCode: 400 }
        );
    }

    return Connection.create({ sender: senderId, receiver: receiverId });
};

/** Get all connections (sent and received) for a user. */
const getMyConnections = async (userId) => {
    return Connection.find({
        $or: [{ sender: userId }, { receiver: userId }],
    })
        .populate('sender',   'name role company designation profilePicture bio skills department currentYear collegeRollNumber graduationYear')
        .populate('receiver', 'name role company designation profilePicture bio skills department currentYear collegeRollNumber graduationYear');
};

/**
 * Accept or reject a connection request.
 * Only the receiver can respond.
 * Returns the updated connection document.
 */
const respondToRequest = async (connectionId, status, respondingUserId) => {
    if (!['Accepted', 'Rejected'].includes(status)) {
        throw Object.assign(new Error('Invalid status.'), { statusCode: 400 });
    }

    const connection = await Connection.findById(connectionId);
    if (!connection) throw Object.assign(new Error('Connection request not found.'), { statusCode: 404 });

    if (connection.receiver.toString() !== respondingUserId.toString()) {
        throw Object.assign(new Error('Not authorized to respond to this request.'), { statusCode: 403 });
    }

    connection.status = status;
    await connection.save();
    return connection;
};

/** Remove a connection — either party can remove. */
const removeConnection = async (connectionId, userId) => {
    const connection = await Connection.findById(connectionId);
    if (!connection) throw Object.assign(new Error('Connection not found.'), { statusCode: 404 });

    const isMember =
        connection.sender.toString()   === userId.toString() ||
        connection.receiver.toString() === userId.toString();

    if (!isMember) {
        throw Object.assign(new Error('Not authorized.'), { statusCode: 403 });
    }

    await connection.deleteOne();
};

/**
 * Get students from the same college (for Network → Students tab).
 * Returns { students, collegeName, noCollege }.
 */
const getStudentsDirectory = async (requestingUser) => {
    const me = await User.findById(requestingUser._id).select('college');

    if (!me || !me.college) {
        return { noCollege: true, students: [], collegeName: '' };
    }

    const [students, col] = await Promise.all([
        User.find({
            role:    'student',
            college: me.college,
            _id:     { $ne: requestingUser._id },
        }).select('name email department currentYear collegeRollNumber bio skills profilePicture college'),
        College.findById(me.college).select('name'),
    ]);

    return { students, collegeName: col?.name || '', noCollege: false };
};

module.exports = {
    sendRequest,
    getMyConnections,
    respondToRequest,
    removeConnection,
    getStudentsDirectory,
};
