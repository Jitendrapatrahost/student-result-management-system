const Subject = require('../models/Subject');

// @desc    Get all subjects
// @route   GET /api/subjects
// @access  Private/Admin/Teacher
const getAllSubjects = async (req, res) => {
    try {
        const subjects = await Subject.find().sort('name');
        console.log('Fetched subjects:', subjects); // Debug log
        res.json(subjects);
    } catch (error) {
        console.error('Error fetching subjects:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get subject by ID
// @route   GET /api/subjects/:id
// @access  Private/Admin/Teacher
const getSubjectById = async (req, res) => {
    try {
        const subject = await Subject.findById(req.params.id);
        if (!subject) {
            return res.status(404).json({ message: 'Subject not found' });
        }
        res.json(subject);
    } catch (error) {
        console.error('Error fetching subject:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getAllSubjects,
    getSubjectById
};