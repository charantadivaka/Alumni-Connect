'use strict';

/**
 * Story Service
 * ─────────────
 * Business logic for success stories.
 */

const Story = require('../../models/Story');
const { invalidatePattern } = require('../../config/redis');
const { checkAndAwardBadges } = require('../../utils/badgeService');

const STORY_CACHE_PATTERN = '__express__:*:/api/stories*';

const { escapeRegex } = require('../../shared/utils/escapeRegex');

/** Get all published stories (filtered by college if user is student/alumni). */
const getStories = async (user, query) => {
    const filter = { isPublished: true };

    if (user && user.role !== 'admin' && user.college) {
        filter.$or = [
            { college: user.college },
            { college: { $exists: false } },
            { college: null },
        ];
    }

    if (query.category) {
        filter.category = query.category;
    }

    if (query.search) {
        const regex = new RegExp(escapeRegex(query.search), 'i');
        const searchFilter = { $or: [{ title: regex }, { content: regex }, { tags: regex }] };
        if (filter.$or) {
            filter.$and = [ searchFilter, { $or: filter.$or } ];
            delete filter.$or;
        } else {
            Object.assign(filter, searchFilter);
        }
    }

    const page  = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 20;
    const skip  = (page - 1) * limit;

    let sortObj = { createdAt: -1 };
    if (query.sort === 'trending') {
        sortObj = { likeCount: -1, createdAt: -1 };
    }

    const [total, stories] = await Promise.all([
        Story.countDocuments(filter),
        Story.find(filter)
            .populate('author', 'name profilePicture company designation graduationYear department role')
            .sort(sortObj)
            .skip(skip)
            .limit(limit),
    ]);

    return { stories, total };
};

/** Get stories created by the requester. */
const getMyStories = async (userId) => {
    return Story.find({ author: userId }).sort({ createdAt: -1 });
};

/** Create a new story. */
const createStory = async (data, user) => {
    const story = await Story.create({
        ...data,
        author:  user._id,
        college: user.college || null,
    });

    await invalidatePattern(STORY_CACHE_PATTERN);
    checkAndAwardBadges(user._id.toString(), 'story_created').catch(() => {});
    return story;
};

/** Like or unlike a story. */
const likeStory = async (storyId, userId) => {
    const story = await Story.findById(storyId);
    if (!story) throw Object.assign(new Error('Story not found'), { statusCode: 404 });

    const idx = story.likes.indexOf(userId);
    if (idx === -1) {
        story.likes.push(userId);
    } else {
        story.likes.splice(idx, 1);
    }
    
    story.likeCount = story.likes.length;
    await story.save();
    await invalidatePattern(STORY_CACHE_PATTERN);
    return { likes: story.likes.length, liked: idx === -1 };
};

/** Delete a story (owner or admin). */
const deleteStory = async (storyId, user) => {
    const story = await Story.findById(storyId);
    if (!story) throw Object.assign(new Error('Story not found'), { statusCode: 404 });

    if (story.author.toString() !== user._id.toString() && user.role !== 'admin') {
        throw Object.assign(new Error('Not authorized'), { statusCode: 403 });
    }

    await story.deleteOne();
    await invalidatePattern(STORY_CACHE_PATTERN);
};

module.exports = { getStories, getMyStories, createStory, likeStory, deleteStory };
