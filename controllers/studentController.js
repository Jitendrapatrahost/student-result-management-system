const Mark = require('../models/Mark');
const User = require('../models/User');

// Calculate grade based on percentage
const calculateGrade = (percentage) => {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B';
    if (percentage >= 60) return 'C';
    if (percentage >= 50) return 'D';
    return 'F';
};

// @desc    Get student's results
// @route   GET /api/student/results
// @access  Private/Student
const getResults = async (req, res) => {
    try {
        console.log('Fetching results for student:', req.user._id); // Debug log

        // Get all marks for the student
        const marks = await Mark.find({ student: req.user._id })
            .populate('subject', 'name code')
            .populate('enteredBy', 'name')
            .sort('subject.name');

        console.log(`Found ${marks.length} marks for student`); // Debug log

        if (marks.length === 0) {
            return res.json({
                message: 'No marks found',
                results: [],
                summary: {
                    totalSubjects: 0,
                    totalMarksObtained: 0,
                    totalMaxMarks: 0,
                    overallPercentage: 0,
                    overallGrade: 'N/A',
                    overallStatus: 'N/A',
                    failedSubjects: 0
                }
            });
        }

        // Calculate overall statistics
        let totalMarksObtained = 0;
        let totalMaxMarks = marks.length * 100; // Each subject max 100 marks
        let failedSubjects = 0;
        let subjectResults = [];

        marks.forEach(mark => {
            totalMarksObtained += mark.totalMarks;
            
            const percentage = (mark.totalMarks / 100) * 100;
            const status = mark.totalMarks >= 40 ? 'Pass' : 'Fail';
            
            if (mark.totalMarks < 40) {
                failedSubjects++;
            }

            subjectResults.push({
                subjectId: mark.subject._id,
                subjectName: mark.subject.name,
                subjectCode: mark.subject.code,
                internalMarks: mark.internalMarks,
                externalMarks: mark.externalMarks,
                totalMarks: mark.totalMarks,
                status: status,
                percentage: percentage.toFixed(2),
                grade: calculateGrade(percentage)
            });
        });

        const overallPercentage = (totalMarksObtained / totalMaxMarks) * 100;
        const overallGrade = calculateGrade(overallPercentage);
        const overallStatus = failedSubjects === 0 ? 'Pass' : 'Fail';

        const result = {
            student: {
                id: req.user._id,
                name: req.user.name,
                studentId: req.user.studentId,
                email: req.user.email
            },
            summary: {
                totalSubjects: marks.length,
                totalMarksObtained: totalMarksObtained,
                totalMaxMarks: totalMaxMarks,
                overallPercentage: overallPercentage.toFixed(2),
                overallGrade,
                overallStatus,
                failedSubjects
            },
            subjectResults
        };

        console.log('Sending results:', result); // Debug log
        res.json(result);

    } catch (error) {
        console.error('Get results error:', error);
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
};

// @desc    Get student's performance summary
// @route   GET /api/student/summary
// @access  Private/Student
const getSummary = async (req, res) => {
    try {
        const marks = await Mark.find({ student: req.user._id })
            .populate('subject', 'name code');

        if (marks.length === 0) {
            return res.json({
                message: 'No results available',
                performance: []
            });
        }

        // Prepare performance data for charts
        const performance = marks.map(mark => ({
            subject: mark.subject.name,
            subjectCode: mark.subject.code,
            marks: mark.totalMarks,
            internalMarks: mark.internalMarks,
            externalMarks: mark.externalMarks,
            totalMarks: mark.totalMarks,
            percentage: (mark.totalMarks / 100) * 100,
            passed: mark.totalMarks >= 40,
            grade: calculateGrade((mark.totalMarks / 100) * 100)
        }));

        res.json(performance);
    } catch (error) {
        console.error('Get summary error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { getResults, getSummary };