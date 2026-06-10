const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const connectionController = require('../controllers/connectionController');

router.use(protect);

router.post('/request/:userId', connectionController.sendRequest);
router.get('/my', connectionController.getMyConnections);
router.put('/:id/respond', connectionController.respondRequest);
router.delete('/:id', connectionController.removeConnection);

module.exports = router;
