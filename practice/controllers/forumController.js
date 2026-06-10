const Forum = require('../models/Forum');

const getThreads = async (req, res) => {
    try {
        const { category } = req.query;
        const filter = category ? { category } : {};
        const threads = await Forum.find(filter)
            .populate('author', 'name profilePicture role company')
            .sort({ isPinned: -1, createdAt: -1 });
        res.json(threads);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

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

const createThread = async (req, res) => {
    try {
        const { title, content, category } = req.body;
        const thread = await Forum.create({ title, content, category, author: req.user._id });
        res.status(201).json(thread);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const addReply = async (req, res) => {
    try {
        const thread = await Forum.findById(req.params.id);
        if (!thread) return res.status(404).json({ message: 'Thread not found' });
        thread.replies.push({ author: req.user._id, content: req.body.content });
        await thread.save();
        await thread.populate('replies.author', 'name profilePicture role');
        res.status(201).json(thread.replies[thread.replies.length - 1]);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

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
