const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { validate, teacherValidation, studentValidation } = require('../middleware/validation');
const {
    createTeacher,
    createStudent,
    getAllTeachers,
    getAllStudents,
    getAllMarks,
    getImprovementList
} = require('../controllers/adminController');

// All admin routes are protected and require admin role
router.use(protect, authorize('admin'));

// Teacher management - use teacherValidation
router.post('/teachers', validate(teacherValidation), createTeacher);
router.get('/teachers', getAllTeachers);

// Student management - use studentValidation
router.post('/students', validate(studentValidation), createStudent);
router.get('/students', getAllStudents);

// Marks and reports
router.get('/marks', getAllMarks);
router.get('/improvement-list', getImprovementList);

module.exports = router;