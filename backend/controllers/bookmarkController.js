const Bookmark = require('../models/Bookmark');

// @desc  Toggle bookmark (add or remove)
// @route POST /api/bookmarks
const toggleBookmark = async (req, res) => {
    try {
        const { refId, refModel } = req.body;
        const existing = await Bookmark.findOne({ user: req.user._id, refId, refModel });

        if (existing) {
            await existing.deleteOne();
            return res.json({ bookmarked: false });
        }

        await Bookmark.create({ user: req.user._id, refId, refModel });
        res.status(201).json({ bookmarked: true });
    } catch (err) {
        if (err.code === 11000) return res.json({ bookmarked: true }); // already exists
        res.status(500).json({ message: err.message });
    }
};

// @desc  Get all bookmarks for user (optionally filtered by model)
// @route GET /api/bookmarks
const getBookmarks = async (req, res) => {
    try {
        const { model } = req.query;
        const filter = { user: req.user._id };
        if (model) filter.refModel = model;

        const bookmarks = await Bookmark.find(filter).sort({ createdAt: -1 }).lean();

        // Dynamically populate details
        for (let bm of bookmarks) {
            try {
                const Model = require('mongoose').model(bm.refModel);
                bm.details = await Model.findById(bm.refId).lean();
            } catch (e) {
                // Ignore if model not found or deleted
                bm.details = null;
            }
        }

        res.json(bookmarks);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { toggleBookmark, getBookmarks };
