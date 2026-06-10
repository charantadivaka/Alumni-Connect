const Story = require('../models/Story');

const getStories = async (req, res) => {
    try {
        const stories = await Story.find({ isPublished: true })
            .populate('author', 'name profilePicture company designation graduationYear')
            .sort({ createdAt: -1 });
        res.json(stories);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const getMyStories = async (req, res) => {
    try {
        const stories = await Story.find({ author: req.user._id }).sort({ createdAt: -1 });
        res.json(stories);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const createStory = async (req, res) => {
    try {
        const story = await Story.create({ ...req.body, author: req.user._id });
        res.status(201).json(story);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const likeStory = async (req, res) => {
    try {
        const story = await Story.findById(req.params.id);
        if (!story) return res.status(404).json({ message: 'Not found' });
        const idx = story.likes.indexOf(req.user._id);
        if (idx === -1) story.likes.push(req.user._id);
        else story.likes.splice(idx, 1);
        await story.save();
        res.json({ likes: story.likes.length, liked: idx === -1 });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const deleteStory = async (req, res) => {
    try {
        const story = await Story.findById(req.params.id);
        if (!story) return res.status(404).json({ message: 'Not found' });
        if (story.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }
        await story.deleteOne();
        res.json({ message: 'Story deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { getStories, getMyStories, createStory, likeStory, deleteStory };