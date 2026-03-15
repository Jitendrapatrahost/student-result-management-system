const { body, validationResult } = require('express-validator');

// Validation rules
const validate = (validations) => {
    return async (req, res, next) => {
        await Promise.all(validations.map(validation => validation.run(req)));

        const errors = validationResult(req);
        if (errors.isEmpty()) {
            return next();
        }

        res.status(400).json({ 
            message: 'Validation failed', 
            errors: errors.array() 
        });
    };
};

// Login validation
const loginValidation = [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required')
];

// User creation validation - Make password optional for updates
const userValidation = [
    body('name').optional().notEmpty().trim().withMessage('Name cannot be empty'),
    body('email').optional().isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').optional().isIn(['admin', 'teacher', 'student']).withMessage('Invalid role')
];

// Teacher creation validation - More specific for teacher creation
const teacherValidation = [
    body('name').notEmpty().trim().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('subjectId').isMongoId().withMessage('Valid subject ID is required')
];

// Student creation validation
const studentValidation = [
    body('name').notEmpty().trim().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

// Marks entry validation
const marksValidation = [
    body('internalMarks').isFloat({ min: 0, max: 50 }).withMessage('Internal marks must be between 0 and 50'),
    body('externalMarks').isFloat({ min: 0, max: 50 }).withMessage('External marks must be between 0 and 50'),
    body('subjectId').optional().isMongoId().withMessage('Valid subject ID is required'),
    body('studentId').isMongoId().withMessage('Valid student ID is required')
];

module.exports = {
    validate,
    loginValidation,
    userValidation,
    teacherValidation,
    studentValidation,
    marksValidation
};