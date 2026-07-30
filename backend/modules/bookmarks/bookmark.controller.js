'use strict';

const bookmarkService = require('./bookmark.service');
const { sendSuccess } = require('../../shared/utils/response');

const toggleBookmark = async (req, res, next) => {
    try {
        const { refId, refModel } = req.body;
        const result = await bookmarkService.toggleBookmark(refId, refModel, req.user._id);
        sendSuccess(res, result, `Bookmark ${result.bookmarked ? 'added' : 'removed'}`, result.bookmarked ? 201 : 200);
    } catch (err) {
        next(err);
    }
};

const getBookmarks = async (req, res, next) => {
    try {
        const bookmarks = await bookmarkService.getBookmarks(req.user._id, req.query.model);
        sendSuccess(res, bookmarks);
    } catch (err) {
        next(err);
    }
};

module.exports = { toggleBookmark, getBookmarks };
