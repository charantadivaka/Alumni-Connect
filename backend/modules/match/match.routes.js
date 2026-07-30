'use strict';

const express = require('express');
const router = express.Router();
const matchController = require('./match.controller');
const { protect, roleCheck } = require('../../middleware/authMiddleware');
const { cacheMiddleware } = require('../../config/redis');

router.use(protect);

router.get('/', roleCheck(['student']), cacheMiddleware(300), matchController.getMatches);
router.get('/directory', cacheMiddleware(300), matchController.getDirectory);
router.get('/:id', matchController.getAlumniById);

module.exports = router;
