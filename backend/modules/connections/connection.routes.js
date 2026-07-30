'use strict';

const express = require('express');
const router = express.Router();
const connectionController = require('./connection.controller');
const { protect } = require('../../middleware/authMiddleware');

router.use(protect);

router.post('/request/:id', connectionController.sendRequest);
router.get('/my', connectionController.getMyConnections);
router.put('/respond/:id', connectionController.respondToRequest);
router.delete('/:id', connectionController.removeConnection);
router.get('/students', connectionController.getStudentsDirectory);

module.exports = router;
