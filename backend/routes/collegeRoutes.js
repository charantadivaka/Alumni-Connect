const router = require('express').Router();
const {
    getColleges,
    validateRollNumber,
    getCollegeFeeStatus,
} = require('../controllers/collegeController');

// Public routes (no auth required — used on registration page)
router.get('/', getColleges);
router.post('/validate', validateRollNumber);
// GET /api/colleges/fee-status?name=College+Name → returns fee validity info
router.get('/fee-status', getCollegeFeeStatus);

module.exports = router;
