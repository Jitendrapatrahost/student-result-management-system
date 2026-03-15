// Admin Dashboard JavaScript
document.addEventListener('DOMContentLoaded', () => {
    const auth = checkAuth();
    if (!auth) return;
    
    if (auth.user.role !== 'admin') {
        window.location.href = '/';
        return;
    }
    
    // Display admin info
    document.getElementById('adminInfo').innerHTML = `
        <strong>${auth.user.name}</strong><br>
        <small>${auth.user.email}</small>
    `;
    
    // Load initial data
    loadDashboard();
    loadSubjects(); // Load subjects for dropdown
    
    // Setup event listeners
    document.getElementById('logoutBtn').addEventListener('click', logout);
    document.getElementById('teacherForm').addEventListener('submit', createTeacher);
    document.getElementById('studentForm').addEventListener('submit', createStudent);
    
    // Navigation
    document.querySelectorAll('.sidebar-nav a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.dataset.section;
            showSection(section);
            
            // Update active state
            document.querySelectorAll('.sidebar-nav a').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            // Update page title
            const titles = {
                'dashboard': 'Dashboard',
                'teachers': 'Manage Teachers',
                'students': 'Manage Students',
                'marks': 'View All Marks',
                'improvement': 'Improvement List'
            };
            document.getElementById('pageTitle').textContent = titles[section] || 'Dashboard';
            
            // Load section-specific data
            if (section === 'marks') {
                loadAllMarks();
            } else if (section === 'improvement') {
                loadImprovementList();
            } else if (section === 'dashboard') {
                loadDashboard();
            }
        });
    });
});

async function loadDashboard() {
    try {
        // Load teachers
        const teachers = await apiCall('/api/admin/teachers');
        displayTeachers(teachers);
        document.getElementById('totalTeachers').textContent = teachers.length;
        
        // Load students
        const students = await apiCall('/api/admin/students');
        displayStudents(students);
        document.getElementById('totalStudents').textContent = students.length;
        
        // Subjects count is static (6 default subjects)
        document.getElementById('totalSubjects').textContent = '6';
        
    } catch (error) {
        console.error('Error loading dashboard:', error);
        showNotification(error.message, 'error');
    }
}

async function loadSubjects() {
    try {
        console.log('Loading subjects...');
        const subjects = await apiCall('/api/subjects');
        console.log('Subjects loaded:', subjects);
        
        const subjectSelect = document.getElementById('teacherSubject');
        
        // Clear existing options
        subjectSelect.innerHTML = '';
        
        if (subjects && subjects.length > 0) {
            // Add default option
            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = 'Select Subject';
            defaultOption.disabled = true;
            defaultOption.selected = true;
            subjectSelect.appendChild(defaultOption);
            
            // Add subject options
            subjects.forEach(subject => {
                const option = document.createElement('option');
                option.value = subject._id;
                option.textContent = `${subject.name} (${subject.code})`;
                subjectSelect.appendChild(option);
            });
            console.log(`Added ${subjects.length} subjects to dropdown`);
        } else {
            console.warn('No subjects found in database');
            const option = document.createElement('option');
            option.value = '';
            option.disabled = true;
            option.selected = true;
            option.textContent = 'No subjects available - Check server logs';
            subjectSelect.appendChild(option);
        }
    } catch (error) {
        console.error('Error loading subjects:', error);
        showNotification('Failed to load subjects: ' + error.message, 'error');
        
        const subjectSelect = document.getElementById('teacherSubject');
        subjectSelect.innerHTML = '<option value="">Error loading subjects</option>';
    }
}

async function createTeacher(e) {
    e.preventDefault();
    
    // Get form values
    const name = document.getElementById('teacherName').value.trim();
    const email = document.getElementById('teacherEmail').value.trim();
    const password = document.getElementById('teacherPassword').value;
    const subjectId = document.getElementById('teacherSubject').value;
    
    console.log('Creating teacher with:', { name, email, subjectId }); // Debug log
    
    // Validate form
    if (!name) {
        showNotification('Please enter teacher name', 'error');
        return;
    }
    
    if (!email) {
        showNotification('Please enter email address', 'error');
        return;
    }
    
    if (!password) {
        showNotification('Please enter password', 'error');
        return;
    }
    
    if (password.length < 6) {
        showNotification('Password must be at least 6 characters', 'error');
        return;
    }
    
    if (!subjectId) {
        showNotification('Please select a subject', 'error');
        return;
    }
    
    const formData = {
        name: name,
        email: email,
        password: password,
        subjectId: subjectId
    };
    
    try {
        const result = await apiCall('/api/admin/teachers', {
            method: 'POST',
            body: JSON.stringify(formData)
        });
        
        console.log('Teacher created:', result);
        showNotification('Teacher created successfully', 'success');
        
        // Reset form
        e.target.reset();
        
        // Reset subject select to default
        const subjectSelect = document.getElementById('teacherSubject');
        subjectSelect.value = '';
        
        // Reload teachers list
        loadDashboard();
        
    } catch (error) {
        console.error('Error creating teacher:', error);
        showNotification(error.message, 'error');
    }
}

async function createStudent(e) {
    e.preventDefault();
    
    // Get form values
    const name = document.getElementById('studentName').value.trim();
    const email = document.getElementById('studentEmail').value.trim();
    const password = document.getElementById('studentPassword').value;
    
    console.log('Creating student with:', { name, email }); // Debug log
    
    // Validate form
    if (!name) {
        showNotification('Please enter student name', 'error');
        return;
    }
    
    if (!email) {
        showNotification('Please enter email address', 'error');
        return;
    }
    
    if (!password) {
        showNotification('Please enter password', 'error');
        return;
    }
    
    if (password.length < 6) {
        showNotification('Password must be at least 6 characters', 'error');
        return;
    }
    
    const formData = {
        name: name,
        email: email,
        password: password
    };
    
    try {
        const result = await apiCall('/api/admin/students', {
            method: 'POST',
            body: JSON.stringify(formData)
        });
        
        console.log('Student created:', result);
        showNotification('Student created successfully', 'success');
        
        // Reset form
        e.target.reset();
        
        // Reload students list
        loadDashboard();
        
    } catch (error) {
        console.error('Error creating student:', error);
        showNotification(error.message, 'error');
    }
}

function displayTeachers(teachers) {
    const tbody = document.querySelector('#teachersTable tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (teachers.length === 0) {
        const row = tbody.insertRow();
        row.innerHTML = '<td colspan="5" style="text-align: center;">No teachers found</td>';
        return;
    }
    
    teachers.forEach(teacher => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${teacher.name}</td>
            <td>${teacher.email}</td>
            <td>${teacher.teacherId || 'N/A'}</td>
            <td>${teacher.assignedSubject?.name || 'Not Assigned'}</td>
            <td>
                <button onclick="viewTeacherDetails('${teacher._id}')" class="btn-small">View</button>
            </td>
        `;
    });
}

function displayStudents(students) {
    const tbody = document.querySelector('#studentsTable tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (students.length === 0) {
        const row = tbody.insertRow();
        row.innerHTML = '<td colspan="4" style="text-align: center;">No students found</td>';
        return;
    }
    
    students.forEach(student => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${student.name}</td>
            <td>${student.email}</td>
            <td>${student.studentId || 'N/A'}</td>
            <td>
                <button onclick="viewStudentMarks('${student._id}')" class="btn-small">View Marks</button>
            </td>
        `;
    });
}

async function loadAllMarks() {
    try {
        const marks = await apiCall('/api/admin/marks');
        displayAllMarks(marks);
    } catch (error) {
        console.error('Error loading marks:', error);
        showNotification('Failed to load marks', 'error');
    }
}

function displayAllMarks(marks) {
    const tbody = document.querySelector('#marksTable tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (marks.length === 0) {
        const row = tbody.insertRow();
        row.innerHTML = '<td colspan="6" style="text-align: center;">No marks found</td>';
        return;
    }
    
    marks.forEach(mark => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${mark.student?.name || 'N/A'}</td>
            <td>${mark.subject?.name || 'N/A'}</td>
            <td>${mark.internalMarks}</td>
            <td>${mark.externalMarks}</td>
            <td>${mark.totalMarks}</td>
            <td>${mark.enteredBy?.name || 'N/A'}</td>
        `;
    });
}

function showSection(sectionId) {
    document.querySelectorAll('.content-section').forEach(section => {
        section.style.display = 'none';
    });
    
    const section = document.getElementById(sectionId);
    if (section) {
        section.style.display = 'block';
    }
}

async function loadImprovementList() {
    try {
        const improvementList = await apiCall('/api/admin/improvement-list');
        displayImprovementList(improvementList);
    } catch (error) {
        console.error('Error loading improvement list:', error);
        showNotification('Failed to load improvement list', 'error');
    }
}

function displayImprovementList(students) {
    const container = document.getElementById('improvementList');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (!students || students.length === 0) {
        container.innerHTML = '<p class="no-data">No students need improvement</p>';
        return;
    }
    
    students.forEach(item => {
        const card = document.createElement('div');
        card.className = 'improvement-card';
        card.innerHTML = `
            <h3>${item.student.name} (${item.student.studentId})</h3>
            <p><strong>Email:</strong> ${item.student.email}</p>
            <p><strong>Failed Subjects:</strong></p>
            <ul>
                ${item.failedSubjects.map(subject => `
                    <li>
                        <strong>${subject.subject.name}:</strong> ${subject.marks} marks 
                        (Internal: ${subject.internalMarks}, External: ${subject.externalMarks})
                    </li>
                `).join('')}
            </ul>
        `;
        container.appendChild(card);
    });
}

// Placeholder functions for button actions
function viewTeacherDetails(teacherId) {
    console.log('View teacher details:', teacherId);
    showNotification('Teacher details feature coming soon', 'info');
}

function viewStudentMarks(studentId) {
    console.log('View student marks:', studentId);
    showNotification('Student marks feature coming soon', 'info');
}

function showNotification(message, type) {
    // Remove any existing notification
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}