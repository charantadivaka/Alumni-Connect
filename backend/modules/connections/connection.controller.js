'use strict';

const connectionService = require('./connection.service');
const { sendSuccess } = require('../../shared/utils/response');

const sendRequest = async (req, res, next) => {
    try {
        const connection = await connectionService.sendRequest(req.user._id, req.params.id);
        
        const { sendNotification } = require('../../shared/services/notificationService');
        await sendNotification(req.params.id, 'connection_request',
            `${req.user.name} sent you a connection request`,
            '/network'
        );
        
        sendSuccess(res, connection, 'Connection request sent', 201);
    } catch (err) {
        next(err);
    }
};

const getMyConnections = async (req, res, next) => {
    try {
        const connections = await connectionService.getMyConnections(req.user._id);
        sendSuccess(res, connections);
    } catch (err) {
        next(err);
    }
};

const respondToRequest = async (req, res, next) => {
    try {
        const { status } = req.body;
        const connection = await connectionService.respondToRequest(req.params.id, status, req.user._id);
        
        if (status === 'Accepted') {
            const { sendNotification } = require('../../shared/services/notificationService');
            await sendNotification(connection.sender, 'connection_accepted',
                `${req.user.name} accepted your connection request`,
                '/network'
            );
        }
        
        sendSuccess(res, connection, `Request ${status.toLowerCase()}`);
    } catch (err) {
        next(err);
    }
};

const removeConnection = async (req, res, next) => {
    try {
        await connectionService.removeConnection(req.params.id, req.user._id);
        sendSuccess(res, null, 'Connection removed');
    } catch (err) {
        next(err);
    }
};

const getStudentsDirectory = async (req, res, next) => {
    try {
        const result = await connectionService.getStudentsDirectory(req.user);
        sendSuccess(res, result);
    } catch (err) {
        next(err);
    }
};

module.exports = {
    sendRequest, getMyConnections, respondToRequest,
    removeConnection, getStudentsDirectory
};
