'use strict';

const storyService = require('./story.service');
const { sendSuccess } = require('../../shared/utils/response');

const getStories = async (req, res, next) => {
    try {
        const result = await storyService.getStories(req.user, req.query);
        sendSuccess(res, result);
    } catch (err) {
        next(err);
    }
};

const getMyStories = async (req, res, next) => {
    try {
        const stories = await storyService.getMyStories(req.user._id);
        sendSuccess(res, stories);
    } catch (err) {
        next(err);
    }
};

const createStory = async (req, res, next) => {
    try {
        const story = await storyService.createStory(req.body, req.user);
        sendSuccess(res, story, 'Story created successfully', 201);
    } catch (err) {
        next(err);
    }
};

const likeStory = async (req, res, next) => {
    try {
        const result = await storyService.likeStory(req.params.id, req.user._id);
        sendSuccess(res, result, `Story ${result.liked ? 'liked' : 'unliked'}`);
    } catch (err) {
        next(err);
    }
};

const deleteStory = async (req, res, next) => {
    try {
        await storyService.deleteStory(req.params.id, req.user);
        sendSuccess(res, null, 'Story deleted successfully');
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getStories, getMyStories, createStory, likeStory, deleteStory
};
