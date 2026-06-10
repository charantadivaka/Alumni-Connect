const Bookmark = require('../models/Bookmark');

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

const getBookmarks = async (req, res) => {
    try {
        const { model } = req.query;
        const filter = { user: req.user._id };
        if (model) filter.refModel = model;

        const bookmarks = await Bookmark.find(filter).sort({ createdAt: -1 });
        res.json(bookmarks);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { toggleBookmark, getBookmarks };
