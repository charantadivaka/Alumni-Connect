'use strict';

const messageService = require('./message.service');
const { sendSuccess } = require('../../shared/utils/response');

const getThreads = async (req, res, next) => {
    try {
        const threads = await messageService.getThreads(req.user._id);
        sendSuccess(res, threads);
    } catch (err) {
        next(err);
    }
};

const getConversation = async (req, res, next) => {
    try {
        const messages = await messageService.getConversation(req.user._id, req.params.userId);
        sendSuccess(res, messages);
    } catch (err) {
        next(err);
    }
};

const saveMessage = async (req, res, next) => {
    try {
        const msg = await messageService.saveMessage(req.user._id, req.body.receiverId, req.body);
        sendSuccess(res, msg, 'Message sent', 201);
    } catch (err) {
        next(err);
    }
};

const markRead = async (req, res, next) => {
    try {
        await messageService.markRead(req.params.userId, req.user._id);
        sendSuccess(res, null, 'Messages marked as read');
    } catch (err) {
        next(err);
    }
};

const editMessage = async (req, res, next) => {
    try {
        const msg = await messageService.editMessage(req.params.id, req.user._id, req.body.text);
        sendSuccess(res, msg, 'Message edited');
    } catch (err) { next(err); }
};

const deleteMessage = async (req, res, next) => {
    try {
        const msg = await messageService.deleteMessage(req.params.id, req.user._id);
        sendSuccess(res, msg, 'Message deleted');
    } catch (err) { next(err); }
};

const deleteConversation = async (req, res, next) => {
    try {
        await messageService.deleteConversation(req.user._id, req.params.userId);
        sendSuccess(res, null, 'Conversation deleted');
    } catch (err) { next(err); }
};

const blockUser = async (req, res, next) => {
    try {
        const result = await messageService.blockUser(req.user._id, req.params.userId);
        sendSuccess(res, result, 'Block status updated');
    } catch (err) { next(err); }
};

const reportUser = async (req, res, next) => {
    try {
        await messageService.reportUser(req.user._id, req.params.userId, req.body.reason);
        sendSuccess(res, null, 'User reported');
    } catch (err) { next(err); }
};

module.exports = { 
    getThreads, 
    getConversation, 
    saveMessage, 
    markRead,
    editMessage,
    deleteMessage,
    deleteConversation,
    blockUser,
    reportUser
};
