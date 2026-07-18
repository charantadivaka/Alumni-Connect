const router = require('express').Router();
const {
    getColleges,
    validateRollNumber,
} = require('../controllers/collegeController');

// Public routes (no auth required — used on registration page)
router.get('/', getColleges);
router.post('/validate', validateRollNumber);

module.exports = router;
