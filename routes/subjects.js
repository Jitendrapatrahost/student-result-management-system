const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { getAllSubjects, getSubjectById } = require('../controllers/subjectController');

// Protect all routes
router.use(protect);

// Get all subjects - accessible by admin and teachers
router.get('/', authorize('admin', 'teacher'), getAllSubjects);

// Get subject by ID
router.get('/:id', authorize('admin', 'teacher'), getSubjectById);

module.exports = router;