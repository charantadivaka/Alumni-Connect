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

// Cleanup stale spam records every 15 minutes to prevent memory leaks
setInterval(() => {
    const now = Date.now();
    for (const [key, val] of userSpamMap.entries()) {
        const maxTs = Math.max(0, ...(val.timestamps || []));
        if (now - maxTs > 60 * 60 * 1000) { // Purge after 1 hour of inactivity
            userSpamMap.delete(key);
        }
    }
}, 15 * 60 * 1000);

const { escapeRegex } = require('../../shared/utils/escapeRegex');

/** Build filter scoped to user's college (admins see all). */
const buildThreadFilter = (user, query) => {
    const filter = {};
    if (query.category) filter.category = query.category;

    if (query.search) {
        const regex = new RegExp(escapeRegex(query.search), 'i');
        filter.$or = [
            { title: regex },
            { content: regex }
        ];
    }

    if (user && user.role !== 'admin' && user.college) {
        if (filter.$or) {
            filter.$and = [
                { $or: filter.$or },
                { $or: [{ college: user.college }, { college: { $exists: false } }, { college: null }] }
            ];
            delete filter.$or;
        } else {
            filter.$or = [
                { college: user.college },
                { college: { $exists: false } },
                { college: null },
            ];
        }
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
    const filter = buildThreadFilter(user, query);
    const page   = parseInt(query.page, 10) || 1;
    const limit  = parseInt(query.limit, 10) || 50;
    const skip   = (page - 1) * limit;

    let sortObj = { isPinned: -1, createdAt: -1 };
    if (query.sort === 'upvoted') {
        sortObj = { isPinned: -1, upvoteCount: -1, createdAt: -1 };
    } else if (query.sort === 'discussed') {
        sortObj = { isPinned: -1, replyCount: -1, createdAt: -1 };
    } else if (query.sort === 'unanswered') {
        filter.replyCount = { $eq: 0 };
    }

    const [total, threads] = await Promise.all([
        Forum.countDocuments(filter),
        Forum.find(filter)
            .populate('author', 'name profilePicture role company')
            .sort(sortObj)
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
    thread.replyCount = thread.replies.length;
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
    thread.upvoteCount = thread.upvotes.length;
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

const editThread = async (threadId, data, user) => {
    const thread = await Forum.findById(threadId);
    if (!thread) throw Object.assign(new Error('Thread not found'), { statusCode: 404 });
    if (thread.author.toString() !== user._id.toString() && user.role !== 'admin') {
        throw Object.assign(new Error('Not authorized'), { statusCode: 403 });
    }
    if (data.title) thread.title = data.title;
    if (data.content) thread.content = data.content;
    if (data.category) thread.category = data.category;
    await thread.save();
    return thread;
};

const editReply = async (threadId, replyId, content, user) => {
    const thread = await Forum.findById(threadId);
    if (!thread) throw Object.assign(new Error('Thread not found'), { statusCode: 404 });
    
    const reply = thread.replies.id(replyId);
    if (!reply) throw Object.assign(new Error('Reply not found'), { statusCode: 404 });
    if (reply.author.toString() !== user._id.toString() && user.role !== 'admin') {
        throw Object.assign(new Error('Not authorized'), { statusCode: 403 });
    }
    
    reply.content = content;
    await thread.save();
    await thread.populate('replies.author', 'name profilePicture role');
    return thread.replies.id(replyId);
};

const deleteReply = async (threadId, replyId, user) => {
    const thread = await Forum.findById(threadId);
    if (!thread) throw Object.assign(new Error('Thread not found'), { statusCode: 404 });
    
    const reply = thread.replies.id(replyId);
    if (!reply) throw Object.assign(new Error('Reply not found'), { statusCode: 404 });
    if (reply.author.toString() !== user._id.toString() && thread.author.toString() !== user._id.toString() && user.role !== 'admin') {
        throw Object.assign(new Error('Not authorized'), { statusCode: 403 });
    }
    
    reply.deleteOne();
    thread.replyCount = thread.replies.length;
    await thread.save();
};

const acceptReply = async (threadId, replyId, user) => {
    const thread = await Forum.findById(threadId);
    if (!thread) throw Object.assign(new Error('Thread not found'), { statusCode: 404 });
    if (thread.author.toString() !== user._id.toString()) {
        throw Object.assign(new Error('Only the author can accept an answer'), { statusCode: 403 });
    }
    
    const reply = thread.replies.id(replyId);
    if (!reply) throw Object.assign(new Error('Reply not found'), { statusCode: 404 });
    
    // Toggle accept status
    const newStatus = !reply.isAccepted;
    
    // Un-accept all others
    if (newStatus) {
        thread.replies.forEach(r => r.isAccepted = false);
    }
    
    reply.isAccepted = newStatus;
    await thread.save();
    return newStatus;
};

const toggleFollow = async (threadId, userId) => {
    const thread = await Forum.findById(threadId);
    if (!thread) throw Object.assign(new Error('Thread not found'), { statusCode: 404 });
    
    const idx = thread.followers.indexOf(userId);
    let isFollowing = false;
    if (idx === -1) {
        thread.followers.push(userId);
        isFollowing = true;
    } else {
        thread.followers.splice(idx, 1);
    }
    await thread.save();
    return { isFollowing, count: thread.followers.length };
};

const reportContent = async (threadId, replyId, userId) => {
    const thread = await Forum.findById(threadId);
    if (!thread) throw Object.assign(new Error('Thread not found'), { statusCode: 404 });
    
    if (replyId) {
        const reply = thread.replies.id(replyId);
        if (!reply) throw Object.assign(new Error('Reply not found'), { statusCode: 404 });
        if (!reply.reports.includes(userId)) reply.reports.push(userId);
    } else {
        if (!thread.reports.includes(userId)) thread.reports.push(userId);
    }
    await thread.save();
};

module.exports = { 
    getThreads, getThreadById, createThread, addReply, upvoteThread, deleteThread,
    editThread, editReply, deleteReply, acceptReply, toggleFollow, reportContent
};
