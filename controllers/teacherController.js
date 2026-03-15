const Mark = require('../models/Mark');
const User = require('../models/User');
const Subject = require('../models/Subject');

// @desc    Get teacher's assigned subject and students
// @route   GET /api/teacher/dashboard
// @access  Private/Teacher
const getDashboard = async (req, res) => {
    try {
        const teacher = await User.findById(req.user._id).populate('assignedSubject');
        
        if (!teacher) {
            return res.status(404).json({ message: 'Teacher not found' });
        }
        
        if (!teacher.assignedSubject) {
            return res.status(400).json({ message: 'No subject assigned to you' });
        }

        // Get all students
        const students = await User.find({ role: 'student' })
            .select('name studentId email')
            .sort('name');

        // Get existing marks for this subject
        const existingMarks = await Mark.find({
            subject: teacher.assignedSubject._id
        }).populate('student', 'name studentId');

        console.log(`Found ${existingMarks.length} existing marks for subject ${teacher.assignedSubject.name}`);

        res.json({
            subject: teacher.assignedSubject,
            students,
            existingMarks
        });
    } catch (error) {
        console.error('Get dashboard error:', error);
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
};

// @desc    Enter or update marks
// @route   POST /api/teacher/marks
// @access  Private/Teacher
const enterMarks = async (req, res) => {
    try {
        const { studentId, internalMarks, externalMarks, subjectId } = req.body;
        
        console.log('Enter marks request:', { studentId, internalMarks, externalMarks, subjectId });

        // Validate required fields
        if (!studentId || internalMarks === undefined || externalMarks === undefined) {
            return res.status(400).json({ 
                message: 'Missing required fields',
                required: ['studentId', 'internalMarks', 'externalMarks']
            });
        }

        // Get teacher with assigned subject
        const teacher = await User.findById(req.user._id).populate('assignedSubject');
        
        if (!teacher) {
            return res.status(404).json({ message: 'Teacher not found' });
        }

        if (!teacher.assignedSubject) {
            return res.status(400).json({ message: 'No subject assigned to you' });
        }

        // Use either provided subjectId or teacher's assigned subject
        const finalSubjectId = subjectId || teacher.assignedSubject._id;

        // Check if student exists
        const student = await User.findOne({ _id: studentId, role: 'student' });
        if (!student) {
            return res.status(400).json({ message: 'Student not found' });
        }

        // Validate marks range
        if (internalMarks < 0 || internalMarks > 50 || externalMarks < 0 || externalMarks > 50) {
            return res.status(400).json({ 
                message: 'Marks must be between 0 and 50',
                internalMarks: '0-50',
                externalMarks: '0-50'
            });
        }

        // Check if marks already exist for this student and subject
        let mark = await Mark.findOne({
            student: studentId,
            subject: finalSubjectId
        });

        if (mark) {
            // Update existing marks
            mark.internalMarks = internalMarks;
            mark.externalMarks = externalMarks;
            mark.enteredBy = req.user._id;
            await mark.save();
            console.log('Updated existing marks:', mark._id);
        } else {
            // Create new marks
            mark = await Mark.create({
                student: studentId,
                subject: finalSubjectId,
                internalMarks,
                externalMarks,
                enteredBy: req.user._id
            });
            console.log('Created new marks:', mark._id);
        }

        // Calculate total
        const totalMarks = mark.internalMarks + mark.externalMarks;

        res.json({
            message: 'Marks saved successfully',
            marks: {
                id: mark._id,
                studentId: mark.student,
                subjectId: mark.subject,
                internalMarks: mark.internalMarks,
                externalMarks: mark.externalMarks,
                totalMarks: totalMarks,
                status: totalMarks >= 40 ? 'Pass' : 'Fail'
            }
        });
    } catch (error) {
        console.error('Enter marks error:', error);
        
        // Handle duplicate key error
        if (error.code === 11000) {
            return res.status(400).json({ 
                message: 'Marks already exist for this student and subject. Please update instead.'
            });
        }
        
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
};

// @desc    Get marks for a specific student
// @route   GET /api/teacher/student-marks/:studentId
// @access  Private/Teacher
const getStudentMarks = async (req, res) => {
    try {
        const teacher = await User.findById(req.user._id).populate('assignedSubject');
        
        if (!teacher.assignedSubject) {
            return res.status(400).json({ message: 'No subject assigned' });
        }
        
        const marks = await Mark.findOne({
            student: req.params.studentId,
            subject: teacher.assignedSubject._id
        }).populate('student', 'name studentId');

        if (!marks) {
            return res.status(404).json({ message: 'No marks found for this student' });
        }

        res.json(marks);
    } catch (error) {
        console.error('Get student marks error:', error);
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
};

module.exports = {
    getDashboard,
    enterMarks,
    getStudentMarks
};