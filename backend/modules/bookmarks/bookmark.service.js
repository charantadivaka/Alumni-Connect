'use strict';

/**
 * Bookmark Service
 * ────────────────
 * Business logic for generic bookmarks (jobs, stories, etc.).
 */

const Bookmark = require('../../models/Bookmark');
const mongoose = require('mongoose');

/**
 * Toggle a bookmark for a given reference ID and model.
 * Returns { bookmarked: boolean }.
 */
const toggleBookmark = async (refId, refModel, userId) => {
    const existing = await Bookmark.findOne({ user: userId, refId, refModel });

    if (existing) {
        await existing.deleteOne();
        return { bookmarked: false };
    }

    try {
        await Bookmark.create({ user: userId, refId, refModel });
        return { bookmarked: true };
    } catch (err) {
        if (err.code === 11000) return { bookmarked: true }; // already exists
        throw err;
    }
};

/**
 * Get all bookmarks for a user, optionally filtered by model.
 * Dynamically populates the referenced entity.
 */
const getBookmarks = async (userId, modelType) => {
    const filter = { user: userId };
    if (modelType) filter.refModel = modelType;

    const bookmarks = await Bookmark.find(filter).sort({ createdAt: -1 }).lean();

    for (let bm of bookmarks) {
        try {
            const Model = mongoose.model(bm.refModel);
            bm.details = await Model.findById(bm.refId).lean();
        } catch (e) {
            bm.details = null; // Model missing or item deleted
        }
    }

    return bookmarks;
};

module.exports = { toggleBookmark, getBookmarks };
