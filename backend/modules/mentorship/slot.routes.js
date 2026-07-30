'use strict';

const express = require('express');
const router = express.Router();
const slotController = require('./slot.controller');
const { protect, roleCheck } = require('../../middleware/authMiddleware');

router.use(protect);

router.post('/', roleCheck(['alumni']), slotController.createSlot);
router.get('/my', roleCheck(['alumni']), slotController.getMySlots);
router.get('/alumni/:alumniId', slotController.getAlumniSlots);
router.delete('/:id', roleCheck(['alumni']), slotController.deleteSlot);

module.exports = router;
