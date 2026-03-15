const mongoose = require('mongoose');

const markSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
        required: true
    },
    internalMarks: {
        type: Number,
        min: 0,
        max: 50,
        required: true
    },
    externalMarks: {
        type: Number,
        min: 0,
        max: 50,
        required: true
    },
    totalMarks: {
        type: Number,
        min: 0,
        max: 100
    },
    enteredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    semester: {
        type: Number,
        default: 1
    },
    academicYear: {
        type: String,
        default: new Date().getFullYear().toString()
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Calculate total marks before saving
markSchema.pre('save', function(next) {
    this.totalMarks = this.internalMarks + this.externalMarks;
    this.updatedAt = Date.now();
    next();
});

// Calculate total marks before updating
markSchema.pre('findOneAndUpdate', function(next) {
    const update = this.getUpdate();
    if (update.internalMarks !== undefined || update.externalMarks !== undefined) {
        const internalMarks = update.internalMarks || 0;
        const externalMarks = update.externalMarks || 0;
        update.totalMarks = internalMarks + externalMarks;
        update.updatedAt = Date.now();
    }
    next();
});

// Compound index to ensure one mark entry per student per subject
markSchema.index({ student: 1, subject: 1 }, { unique: true });

module.exports = mongoose.model('Mark', markSchema);