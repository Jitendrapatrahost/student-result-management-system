const User = require('../models/User');
const Subject = require('../models/Subject');

// Default subjects
const defaultSubjects = [
    { name: 'Python', code: 'CS101', description: 'Python Programming' },
    { name: 'COA', code: 'CS102', description: 'Computer Organization and Architecture' },
    { name: 'DAA', code: 'CS103', description: 'Design and Analysis of Algorithms' },
    { name: 'Economics', code: 'EC101', description: 'Engineering Economics' },
    { name: 'EIKT', code: 'EC102', description: 'Electronic Instrumentation and Knowledge Transfer' },
    { name: 'DSP', code: 'EC103', description: 'Digital Signal Processing' }
];

// Initialize default admin
const initAdmin = async () => {
    try {
        const adminExists = await User.findOne({ role: 'admin' });
        
        if (!adminExists) {
            await User.create({
                name: 'System Admin',
                email: 'admin@rms.com',
                password: 'admin123',
                role: 'admin'
            });
            console.log('✅ Default admin created successfully');
            console.log('   Email: admin@rms.com');
            console.log('   Password: admin123');
        } else {
            console.log('✅ Admin already exists');
        }
    } catch (error) {
        console.error('❌ Error creating admin:', error);
    }
};

// Initialize default subjects
const initSubjects = async () => {
    try {
        console.log('📚 Checking default subjects...');
        
        let createdCount = 0;
        let existingCount = 0;
        
        for (const subject of defaultSubjects) {
            const exists = await Subject.findOne({ code: subject.code });
            if (!exists) {
                await Subject.create(subject);
                console.log(`   ✅ Created: ${subject.name} (${subject.code})`);
                createdCount++;
            } else {
                console.log(`   ⏺️ Exists: ${subject.name} (${subject.code})`);
                existingCount++;
            }
        }
        
        // Verify total subjects count
        const totalSubjects = await Subject.countDocuments();
        console.log(`📊 Summary: ${createdCount} created, ${existingCount} existing, ${totalSubjects} total in database`);
        
        // Log all subjects in database
        const allSubjects = await Subject.find();
        console.log('📋 All subjects in database:');
        allSubjects.forEach(sub => {
            console.log(`   - ${sub.name} (${sub.code}): ${sub._id}`);
        });
        
    } catch (error) {
        console.error('❌ Error creating subjects:', error);
    }
};

// Initialize all data
const initData = async () => {
    console.log('🚀 Initializing system data...');
    console.log('===============================');
    await initAdmin();
    console.log('-------------------------------');
    await initSubjects();
    console.log('===============================');
    console.log('✅ System initialization complete');
};

module.exports = initData;