const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { validate, marksValidation } = require('../middleware/validation');
const {
    getDashboard,
    enterMarks,
    getStudentMarks
} = require('../controllers/teacherController');

// All teacher routes are protected and require teacher role
router.use(protect, authorize('teacher'));

router.get('/dashboard', getDashboard);
router.post('/marks', validate(marksValidation), enterMarks);
router.get('/student-marks/:studentId', getStudentMarks);

module.exports = router;