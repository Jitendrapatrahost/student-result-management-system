const User = require('../models/User');
const Subject = require('../models/Subject');
const Mark = require('../models/Mark');

// @desc    Create teacher
// @route   POST /api/admin/teachers
// @access  Private/Admin
const createTeacher = async (req, res) => {
    try {
        const { name, email, password, subjectId } = req.body;
        
        console.log('Creating teacher with data:', { name, email, subjectId }); // Debug log

        // Validate required fields
        if (!name || !email || !password || !subjectId) {
            return res.status(400).json({ 
                message: 'All fields are required',
                details: {
                    name: !name ? 'Name is required' : null,
                    email: !email ? 'Email is required' : null,
                    password: !password ? 'Password is required' : null,
                    subjectId: !subjectId ? 'Subject is required' : null
                }
            });
        }

        // Check if email already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        // Verify subject exists
        const subject = await Subject.findById(subjectId);
        if (!subject) {
            return res.status(400).json({ message: 'Subject not found' });
        }

        // Generate unique teacher ID
        const teacherId = `TCH${Date.now()}${Math.floor(Math.random() * 1000)}`;

        // Create teacher
        const teacher = await User.create({
            name,
            email,
            password,
            role: 'teacher',
            assignedSubject: subjectId,
            teacherId: teacherId
        });

        console.log('Teacher created successfully:', teacher._id);

        res.status(201).json({
            message: 'Teacher created successfully',
            teacher: {
                id: teacher._id,
                name: teacher.name,
                email: teacher.email,
                teacherId: teacher.teacherId,
                assignedSubject: {
                    id: subject._id,
                    name: subject.name,
                    code: subject.code
                }
            }
        });
    } catch (error) {
        console.error('Create teacher error:', error);
        
        // Handle validation errors
        if (error.name === 'ValidationError') {
            return res.status(400).json({ 
                message: 'Validation error', 
                errors: Object.values(error.errors).map(e => e.message)
            });
        }
        
        // Handle duplicate key error
        if (error.code === 11000) {
            return res.status(400).json({ 
                message: 'Duplicate entry. Email or Teacher ID already exists.' 
            });
        }
        
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
};

// @desc    Create student
// @route   POST /api/admin/students
// @access  Private/Admin
const createStudent = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        console.log('Creating student with data:', { name, email }); // Debug log

        // Validate required fields
        if (!name || !email || !password) {
            return res.status(400).json({ 
                message: 'All fields are required',
                details: {
                    name: !name ? 'Name is required' : null,
                    email: !email ? 'Email is required' : null,
                    password: !password ? 'Password is required' : null
                }
            });
        }

        // Check if email already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        // Generate unique student ID
        const studentId = `STU${Date.now()}${Math.floor(Math.random() * 1000)}`;

        // Create student
        const student = await User.create({
            name,
            email,
            password,
            role: 'student',
            studentId: studentId
        });

        console.log('Student created successfully:', student._id);

        res.status(201).json({
            message: 'Student created successfully',
            student: {
                id: student._id,
                name: student.name,
                email: student.email,
                studentId: student.studentId
            }
        });
    } catch (error) {
        console.error('Create student error:', error);
        
        if (error.name === 'ValidationError') {
            return res.status(400).json({ 
                message: 'Validation error', 
                errors: Object.values(error.errors).map(e => e.message)
            });
        }
        
        if (error.code === 11000) {
            return res.status(400).json({ 
                message: 'Duplicate entry. Email or Student ID already exists.' 
            });
        }
        
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
};

// @desc    Get all teachers
// @route   GET /api/admin/teachers
// @access  Private/Admin
const getAllTeachers = async (req, res) => {
    try {
        const teachers = await User.find({ role: 'teacher' })
            .populate('assignedSubject', 'name code')
            .select('-password')
            .sort('name');
        
        res.json(teachers);
    } catch (error) {
        console.error('Get teachers error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get all students
// @route   GET /api/admin/students
// @access  Private/Admin
const getAllStudents = async (req, res) => {
    try {
        const students = await User.find({ role: 'student' })
            .select('-password')
            .sort('name');
        
        res.json(students);
    } catch (error) {
        console.error('Get students error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get all marks with student details
// @route   GET /api/admin/marks
// @access  Private/Admin
const getAllMarks = async (req, res) => {
    try {
        const marks = await Mark.find()
            .populate('student', 'name studentId')
            .populate('subject', 'name code')
            .populate('enteredBy', 'name')
            .sort('-createdAt');
        
        res.json(marks);
    } catch (error) {
        console.error('Get marks error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get improvement list
// @route   GET /api/admin/improvement-list
// @access  Private/Admin
const getImprovementList = async (req, res) => {
    try {
        // Find students who failed any subject (total < 40)
        const failedMarks = await Mark.find({ totalMarks: { $lt: 40 } })
            .populate('student', 'name studentId email')
            .populate('subject', 'name code')
            .populate('enteredBy', 'name');

        // Group by student
        const improvementList = {};
        failedMarks.forEach(mark => {
            const studentId = mark.student._id.toString();
            if (!improvementList[studentId]) {
                improvementList[studentId] = {
                    student: mark.student,
                    failedSubjects: []
                };
            }
            improvementList[studentId].failedSubjects.push({
                subject: mark.subject,
                marks: mark.totalMarks,
                internalMarks: mark.internalMarks,
                externalMarks: mark.externalMarks
            });
        });

        res.json(Object.values(improvementList));
    } catch (error) {
        console.error('Get improvement list error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    createTeacher,
    createStudent,
    getAllTeachers,
    getAllStudents,
    getAllMarks,
    getImprovementList
};