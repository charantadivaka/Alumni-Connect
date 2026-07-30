'use strict';

/**
 * Forum Service
 * ─────────────
 * Business logic for forum threads, replies, and spam prevention.
 */

const Forum = require('../../models/Forum');
const { checkAndAwardBadges } = require('../../utils/badgeService');

// In-memory spam prevention map
const userSpamMap = new Map();

/** Build filter scoped to user's college (admins see all). */
const buildThreadFilter = (user, category) => {
    const filter = {};
    if (category) filter.category = category;

    if (user && user.role !== 'admin' && user.college) {
        filter.$or = [
            { college: user.college },
            { college: { $exists: false } },
            { college: null },
        ];
    }
    return filter;
};

/**
 * Basic spam check.
 * Throws if the user posts the exact same content repeatedly.
 */
const checkSpam = (userId, content) => {
    const now = Date.now();
    let record = userSpamMap.get(userId);

    if (record && record.banUntil && record.banUntil > now) {
        const remainingMinutes = Math.ceil((record.banUntil - now) / 60000);
        throw Object.assign(
            new Error(`Spam detected. You are banned from the forum for ${remainingMinutes} more minute(s).`),
            { statusCode: 403 }
        );
    }

    if (!record || record.message !== content) {
        record = { message: content, timestamps: [now], banUntil: null };
    } else {
        record.timestamps = record.timestamps.filter(t => now - t < 30000);
        record.timestamps.push(now);

        if (record.timestamps.length >= 5) {
            record.banUntil = now + 30 * 60 * 1000;
            userSpamMap.set(userId, record);
            throw Object.assign(
                new Error(`Spam detected. You have been banned from the forum for 30 minutes.`),
                { statusCode: 403 }
            );
        }
    }
    userSpamMap.set(userId, record);
};

/** Get paginated threads. */
const getThreads = async (user, query) => {
    const filter = buildThreadFilter(user, query.category);
    const page   = parseInt(query.page, 10) || 1;
    const limit  = parseInt(query.limit, 10) || 50;
    const skip   = (page - 1) * limit;

    const [total, threads] = await Promise.all([
        Forum.countDocuments(filter),
        Forum.find(filter)
            .populate('author', 'name profilePicture role company')
            .sort({ isPinned: -1, createdAt: -1 })
            .skip(skip)
            .limit(limit),
    ]);

    return { threads, total };
};

/** Get thread by ID. */
const getThreadById = async (id) => {
    const thread = await Forum.findById(id)
        .populate('author', 'name profilePicture role company')
        .populate('replies.author', 'name profilePicture role');
    if (!thread) throw Object.assign(new Error('Thread not found'), { statusCode: 404 });
    return thread;
};

/** Create a new thread. */
const createThread = async (data, user) => {
    checkSpam(user._id.toString(), data.content);

    const thread = await Forum.create({
        ...data,
        author:  user._id,
        college: user.college || null,
    });

    checkAndAwardBadges(user._id.toString(), 'thread_created').catch(() => {});
    return thread;
};

/** Add a reply to a thread. */
const addReply = async (threadId, content, user) => {
    checkSpam(user._id.toString(), content);

    const thread = await Forum.findById(threadId);
    if (!thread) throw Object.assign(new Error('Thread not found'), { statusCode: 404 });

    thread.replies.push({ author: user._id, content });
    await thread.save();
    
    // Populate the newly added reply author
    await thread.populate('replies.author', 'name profilePicture role');
    
    return thread.replies[thread.replies.length - 1];
};

/** Upvote or un-upvote a thread. */
const upvoteThread = async (threadId, userId) => {
    const thread = await Forum.findById(threadId);
    if (!thread) throw Object.assign(new Error('Thread not found'), { statusCode: 404 });

    const idx = thread.upvotes.indexOf(userId);
    if (idx === -1) {
        thread.upvotes.push(userId);
    } else {
        thread.upvotes.splice(idx, 1);
    }

    await thread.save();
    return thread.upvotes.length;
};

/** Delete a thread (owner or admin). */
const deleteThread = async (threadId, user) => {
    const thread = await Forum.findById(threadId);
    if (!thread) throw Object.assign(new Error('Thread not found'), { statusCode: 404 });

    if (thread.author.toString() !== user._id.toString() && user.role !== 'admin') {
        throw Object.assign(new Error('Not authorized'), { statusCode: 403 });
    }

    await thread.deleteOne();
};

module.exports = { getThreads, getThreadById, createThread, addReply, upvoteThread, deleteThread };
