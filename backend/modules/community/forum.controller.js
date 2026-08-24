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

const editThread = async (req, res, next) => {
    try {
        const thread = await forumService.editThread(req.params.id, req.body, req.user);
        sendSuccess(res, thread, 'Thread updated');
    } catch (err) { next(err); }
};

const editReply = async (req, res, next) => {
    try {
        const reply = await forumService.editReply(req.params.id, req.params.replyId, req.body.content, req.user);
        sendSuccess(res, reply, 'Reply updated');
    } catch (err) { next(err); }
};

const deleteReply = async (req, res, next) => {
    try {
        await forumService.deleteReply(req.params.id, req.params.replyId, req.user);
        sendSuccess(res, null, 'Reply deleted');
    } catch (err) { next(err); }
};

const acceptReply = async (req, res, next) => {
    try {
        const status = await forumService.acceptReply(req.params.id, req.params.replyId, req.user);
        sendSuccess(res, { isAccepted: status }, status ? 'Reply accepted' : 'Reply unaccepted');
    } catch (err) { next(err); }
};

const toggleFollow = async (req, res, next) => {
    try {
        const result = await forumService.toggleFollow(req.params.id, req.user._id);
        sendSuccess(res, result, result.isFollowing ? 'Followed thread' : 'Unfollowed thread');
    } catch (err) { next(err); }
};

const reportContent = async (req, res, next) => {
    try {
        await forumService.reportContent(req.params.id, req.body.replyId, req.user._id);
        sendSuccess(res, null, 'Content reported successfully');
    } catch (err) { next(err); }
};

module.exports = {
    getThreads, getThreadById, createThread,
    addReply, upvoteThread, deleteThread,
    editThread, editReply, deleteReply, acceptReply, toggleFollow, reportContent
};
