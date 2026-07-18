const Forum = require('../models/Forum');
const { checkAndAwardBadges } = require('../utils/badgeService');

// @desc  Get all threads (with optional category filter)
// @route GET /api/forums
const getThreads = async (req, res) => {
    try {
        const { category } = req.query;
        const filter = category ? { category } : {};

        // Only show threads from user's college (allow admins to see all, allow legacy threads)
        if (req.user && req.user.role !== 'admin' && req.user.college) {
            filter.$or = [
                { college: req.user.college },
                { college: { $exists: false } },
                { college: null }
            ];
        }

        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 50;
        const skip = (page - 1) * limit;

        const total = await Forum.countDocuments(filter);
        const threads = await Forum.find(filter)
            .populate('author', 'name profilePicture role company')
            .sort({ isPinned: -1, createdAt: -1 })
            .skip(skip)
            .limit(limit);
            
        res.set('X-Total-Count', total);
        res.json(threads);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc  Get single thread
// @route GET /api/forums/:id
const getThreadById = async (req, res) => {
    try {
        const thread = await Forum.findById(req.params.id)
            .populate('author', 'name profilePicture role company')
            .populate('replies.author', 'name profilePicture role');
        if (!thread) return res.status(404).json({ message: 'Thread not found' });
        res.json(thread);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const userSpamMap = new Map();

const checkSpam = (userId, content) => {
    const now = Date.now();
    let record = userSpamMap.get(userId);

    // Check if user is currently banned
    if (record && record.banUntil && record.banUntil > now) {
        const remainingMinutes = Math.ceil((record.banUntil - now) / 60000);
        throw new Error(`Spam detected. You are banned from the forum for ${remainingMinutes} more minute(s).`);
    }

    // Check if the user is posting the exact same message
    if (!record || record.message !== content) {
        record = { message: content, timestamps: [now], banUntil: null };
    } else {
        // Filter out timestamps older than 30 seconds
        record.timestamps = record.timestamps.filter(t => now - t < 30000);
        record.timestamps.push(now);

        // If 5 identical messages within 30 seconds
        if (record.timestamps.length >= 5) {
            record.banUntil = now + 30 * 60 * 1000; // 30 minutes
            userSpamMap.set(userId, record);
            throw new Error(`Spam detected. You have been banned from the forum for 30 minutes.`);
        }
    }
    userSpamMap.set(userId, record);
};

// @desc  Create a forum thread
// @route POST /api/forums
const createThread = async (req, res) => {
    try {
        const { title, content, category } = req.body;
        
        try {
            checkSpam(req.user._id.toString(), content);
        } catch (spamErr) {
            return res.status(403).json({ message: spamErr.message });
        }

        const thread = await Forum.create({ 
            title, 
            content, 
            category, 
            author: req.user._id,
            college: req.user.college || null
        });
        // Check active_contributor badge (non-blocking)
        checkAndAwardBadges(req.user._id.toString(), 'thread_created').catch(() => {});
        res.status(201).json(thread);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc  Add reply to thread
// @route POST /api/forums/:id/reply
const addReply = async (req, res) => {
    try {
        const thread = await Forum.findById(req.params.id);
        if (!thread) return res.status(404).json({ message: 'Thread not found' });

        try {
            checkSpam(req.user._id.toString(), req.body.content);
        } catch (spamErr) {
            return res.status(403).json({ message: spamErr.message });
        }

        thread.replies.push({ author: req.user._id, content: req.body.content });
        await thread.save();
        await thread.populate('replies.author', 'name profilePicture role');
        res.status(201).json(thread.replies[thread.replies.length - 1]);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc  Upvote / un-upvote a thread
// @route PUT /api/forums/:id/upvote
const upvoteThread = async (req, res) => {
    try {
        const thread = await Forum.findById(req.params.id);
        if (!thread) return res.status(404).json({ message: 'Not found' });
        const idx = thread.upvotes.indexOf(req.user._id);
        if (idx === -1) thread.upvotes.push(req.user._id);
        else thread.upvotes.splice(idx, 1);
        await thread.save();
        res.json({ upvotes: thread.upvotes.length });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc  Delete thread (owner or admin)
// @route DELETE /api/forums/:id
const deleteThread = async (req, res) => {
    try {
        const thread = await Forum.findById(req.params.id);
        if (!thread) return res.status(404).json({ message: 'Not found' });
        if (thread.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }
        await thread.deleteOne();
        res.json({ message: 'Thread deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { getThreads, getThreadById, createThread, addReply, upvoteThread, deleteThread };
