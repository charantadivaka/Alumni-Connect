const Story = require('../models/Story');

// @desc  Get all published stories
// @route GET /api/stories
const getStories = async (req, res) => {
    try {
        const filter = { isPublished: true };

        // Only show stories from user's college (allow admins to see all, allow legacy stories)
        if (req.user && req.user.role !== 'admin' && req.user.college) {
            filter.$or = [
                { college: req.user.college },
                { college: { $exists: false } },
                { college: null }
            ];
        }

        const stories = await Story.find(filter)
            .populate('author', 'name profilePicture company designation graduationYear')
            .sort({ createdAt: -1 });
        res.json(stories);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc  Get my stories (alumni)
// @route GET /api/stories/my
const getMyStories = async (req, res) => {
    try {
        const stories = await Story.find({ author: req.user._id }).sort({ createdAt: -1 });
        res.json(stories);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc  Create story (alumni)
// @route POST /api/stories
const createStory = async (req, res) => {
    try {
        const story = await Story.create({ 
            ...req.body, 
            author: req.user._id,
            college: req.user.college || null
        });
        res.status(201).json(story);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc  Like / unlike story
// @route PUT /api/stories/:id/like
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

// @desc  Delete story
// @route DELETE /api/stories/:id
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
