// Teacher Dashboard JavaScript
document.addEventListener('DOMContentLoaded', () => {
    const auth = checkAuth();
    if (!auth) return;
    
    if (auth.user.role !== 'teacher') {
        window.location.href = '/';
        return;
    }
    
    // Display teacher info
    document.getElementById('teacherName').textContent = auth.user.name;
    
    // Load dashboard data
    loadTeacherDashboard();
    
    // Setup event listeners
    document.getElementById('logoutBtn').addEventListener('click', logout);
    document.getElementById('marksForm').addEventListener('submit', submitMarks);
    
    // Close modal when clicking on X
    document.querySelector('.close').addEventListener('click', () => {
        document.getElementById('marksModal').style.display = 'none';
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
        const modal = document.getElementById('marksModal');
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
});

let currentTeacherSubject = null; // Store the teacher's assigned subject

async function loadTeacherDashboard() {
    try {
        const data = await apiCall('/api/teacher/dashboard');
        console.log('Teacher dashboard data:', data); // Debug log
        
        // Store the subject ID
        currentTeacherSubject = data.subject._id;
        
        // Display assigned subject
        document.getElementById('assignedSubject').textContent = 
            `${data.subject.name} (${data.subject.code})`;
        
        // Display students
        displayStudents(data.students, data.existingMarks);
    } catch (error) {
        console.error('Error loading dashboard:', error);
        showNotification(error.message, 'error');
    }
}

function displayStudents(students, existingMarks) {
    const container = document.getElementById('studentsList');
    container.innerHTML = '';
    
    if (!students || students.length === 0) {
        container.innerHTML = '<p class="no-data">No students available</p>';
        return;
    }
    
    students.forEach(student => {
        const existingMark = existingMarks.find(m => m.student._id === student._id);
        
        const card = document.createElement('div');
        card.className = 'student-card';
        card.innerHTML = `
            <h3>${student.name}</h3>
            <p><strong>ID:</strong> ${student.studentId || 'N/A'}</p>
            <p><strong>Email:</strong> ${student.email}</p>
            ${existingMark ? `
                <div class="marks-exist">
                    <p><strong>Current Marks:</strong></p>
                    <p>Internal: ${existingMark.internalMarks}</p>
                    <p>External: ${existingMark.externalMarks}</p>
                    <p>Total: ${existingMark.totalMarks}</p>
                </div>
            ` : '<p class="no-marks">No marks entered yet</p>'}
            <button onclick="openMarksModal('${student._id}', '${student.name}')" class="btn-enter-marks">
                ${existingMark ? 'Update Marks' : 'Enter Marks'}
            </button>
        `;
        container.appendChild(card);
    });
}

function openMarksModal(studentId, studentName) {
    const modal = document.getElementById('marksModal');
    document.getElementById('modalStudentId').value = studentId;
    document.getElementById('modalStudentName').textContent = studentName;
    
    // Reset form
    document.getElementById('internalMarks').value = '';
    document.getElementById('externalMarks').value = '';
    
    // Load existing marks if any
    loadStudentMarks(studentId);
    
    modal.style.display = 'block';
}

async function loadStudentMarks(studentId) {
    try {
        const marks = await apiCall(`/api/teacher/student-marks/${studentId}`);
        console.log('Existing marks:', marks); // Debug log
        
        if (marks && marks._id) {
            document.getElementById('internalMarks').value = marks.internalMarks || '';
            document.getElementById('externalMarks').value = marks.externalMarks || '';
        }
    } catch (error) {
        console.error('Error loading student marks:', error);
        // Don't show error for 404 - it just means no marks exist
        if (!error.message.includes('404')) {
            showNotification('Error loading existing marks', 'error');
        }
    }
}

async function submitMarks(e) {
    e.preventDefault();
    
    // Get form values
    const studentId = document.getElementById('modalStudentId').value;
    const internalMarks = parseFloat(document.getElementById('internalMarks').value);
    const externalMarks = parseFloat(document.getElementById('externalMarks').value);
    
    console.log('Submitting marks:', { studentId, internalMarks, externalMarks, subjectId: currentTeacherSubject }); // Debug log
    
    // Validate marks
    if (isNaN(internalMarks) || internalMarks < 0 || internalMarks > 50) {
        showNotification('Internal marks must be between 0 and 50', 'error');
        return;
    }
    
    if (isNaN(externalMarks) || externalMarks < 0 || externalMarks > 50) {
        showNotification('External marks must be between 0 and 50', 'error');
        return;
    }
    
    if (!currentTeacherSubject) {
        showNotification('Teacher subject not found. Please refresh the page.', 'error');
        return;
    }
    
    const formData = {
        studentId: studentId,
        internalMarks: internalMarks,
        externalMarks: externalMarks,
        subjectId: currentTeacherSubject // Include the subject ID
    };
    
    try {
        const result = await apiCall('/api/teacher/marks', {
            method: 'POST',
            body: JSON.stringify(formData)
        });
        
        console.log('Marks saved:', result);
        showNotification('Marks saved successfully', 'success');
        
        // Close modal and reload
        document.getElementById('marksModal').style.display = 'none';
        document.getElementById('marksForm').reset();
        
        // Reload the dashboard to show updated marks
        loadTeacherDashboard();
        
    } catch (error) {
        console.error('Error saving marks:', error);
        showNotification(error.message, 'error');
    }
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

// Add live total preview
const internalInput = document.getElementById('internalMarks');
const externalInput = document.getElementById('externalMarks');
const totalPreview = document.getElementById('totalPreview');

function updateTotalPreview() {
    const internal = parseFloat(internalInput.value) || 0;
    const external = parseFloat(externalInput.value) || 0;
    const total = internal + external;
    totalPreview.textContent = total;
    
    // Change color based on pass/fail
    if (total >= 40) {
        totalPreview.style.color = '#10b981'; // success color
    } else {
        totalPreview.style.color = '#ef4444'; // danger color
    }
}

if (internalInput && externalInput) {
    internalInput.addEventListener('input', updateTotalPreview);
    externalInput.addEventListener('input', updateTotalPreview);
}