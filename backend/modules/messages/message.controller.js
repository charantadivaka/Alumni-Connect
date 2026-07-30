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
        const msg = await messageService.saveMessage(req.user._id, req.body.receiverId, req.body.text);
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

module.exports = { getThreads, getConversation, saveMessage, markRead };
