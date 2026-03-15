const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const connectDB = require('./config/db');
const initData = require('./utils/initData');

// Import routes
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const teacherRoutes = require('./routes/teacher');
const studentRoutes = require('./routes/student');
const subjectRoutes = require('./routes/subjects'); // NEW: Add this line

const app = express();

// Connect to MongoDB
connectDB();

// Initialize default data
initData();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/subjects', subjectRoutes); // NEW: Add this line

// TEMPORARY: Test endpoint to verify subjects (REMOVE AFTER TESTING)
app.get('/api/test/subjects', async (req, res) => {
    try {
        const Subject = require('./models/Subject');
        const subjects = await Subject.find();
        res.json({
            success: true,
            count: subjects.length,
            subjects: subjects
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Serve HTML pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'about.html'));
});

app.get('/dashboard/:role', (req, res) => {
    const { role } = req.params;
    if (['admin', 'teacher', 'student'].includes(role)) {
        res.sendFile(path.join(__dirname, 'public', 'dashboard', `${role}.html`));
    } else {
        res.status(404).send('Dashboard not found');
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 3000;

// Function to start server with port fallback
const startServer = (port) => {
    const server = app.listen(port)
        .on('listening', () => {
            console.log(`Server running on port ${port}`);
            console.log(`Access the application at http://localhost:${port}`);
            console.log(`Test subjects endpoint: http://localhost:${port}/api/test/subjects`);
        })
        .on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                console.log(`Port ${port} is busy, trying port ${port + 1}...`);
                startServer(port + 1);
            } else {
                console.error('Server error:', err);
            }
        });
};

// Start the server
startServer(PORT);