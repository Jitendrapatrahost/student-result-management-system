const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { getResults, getSummary } = require('../controllers/studentController');

// All student routes are protected and require student role
router.use(protect, authorize('student'));

router.get('/results', getResults);
router.get('/summary', getSummary);

module.exports = router;