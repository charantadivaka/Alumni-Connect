'use strict';

const forumService = require('./forum.service');
const { sendSuccess } = require('../../shared/utils/response');

const getThreads = async (req, res, next) => {
    try {
        const result = await forumService.getThreads(req.user, req.query);
        sendSuccess(res, result);
    } catch (err) {
        next(err);
    }
};

const getThreadById = async (req, res, next) => {
    try {
        const thread = await forumService.getThreadById(req.params.id);
        sendSuccess(res, thread);
    } catch (err) {
        next(err);
    }
};

const createThread = async (req, res, next) => {
    try {
        const thread = await forumService.createThread(req.body, req.user);
        sendSuccess(res, thread, 'Thread created successfully', 201);
    } catch (err) {
        next(err);
    }
};

const addReply = async (req, res, next) => {
    try {
        const reply = await forumService.addReply(req.params.id, req.body.content, req.user);
        sendSuccess(res, reply, 'Reply added successfully', 201);
    } catch (err) {
        next(err);
    }
};

const upvoteThread = async (req, res, next) => {
    try {
        const upvotes = await forumService.upvoteThread(req.params.id, req.user._id);
        sendSuccess(res, { upvotes }, 'Vote registered');
    } catch (err) {
        next(err);
    }
};

const deleteThread = async (req, res, next) => {
    try {
        await forumService.deleteThread(req.params.id, req.user);
        sendSuccess(res, null, 'Thread deleted successfully');
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getThreads, getThreadById, createThread,
    addReply, upvoteThread, deleteThread
};
