// Student Dashboard JavaScript
document.addEventListener('DOMContentLoaded', () => {
    const auth = checkAuth();
    if (!auth) return;
    
    if (auth.user.role !== 'student') {
        window.location.href = '/';
        return;
    }
    
    console.log('Student logged in:', auth.user); // Debug log
    
    // Display student info
    document.getElementById('studentName').textContent = auth.user.name;
    document.getElementById('studentId').textContent = auth.user.studentId || 'N/A';
    
    // Load student results
    loadStudentResults();
    
    // Setup event listeners
    document.getElementById('logoutBtn').addEventListener('click', logout);
    
    // Navigation
    document.querySelectorAll('.sidebar-nav a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.dataset.section;
            showSection(section);
            
            document.querySelectorAll('.sidebar-nav a').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            // Load section-specific data
            if (section === 'performance') {
                loadStudentSummary();
            }
        });
    });
});

async function loadStudentResults() {
    try {
        showLoading(true);
        const data = await apiCall('/api/student/results');
        console.log('Student results data:', data); // Debug log
        
        if (data.subjectResults && data.subjectResults.length > 0) {
            displayResults(data);
            displaySummary(data.summary);
        } else {
            showNoData('No results available yet. Please check back later.');
        }
        
        showLoading(false);
    } catch (error) {
        console.error('Error loading results:', error);
        showNotification(error.message, 'error');
        showLoading(false);
    }
}

async function loadStudentSummary() {
    try {
        const performance = await apiCall('/api/student/summary');
        console.log('Performance data:', performance); // Debug log
        
        if (performance && performance.length > 0) {
            loadPerformanceChart(performance);
        } else {
            document.getElementById('performanceChart').innerHTML = 
                '<p class="no-data">No performance data available</p>';
        }
    } catch (error) {
        console.error('Error loading summary:', error);
        showNotification('Failed to load performance data', 'error');
    }
}

function displayResults(data) {
    const tbody = document.querySelector('#resultsTable tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    data.subjectResults.forEach(result => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${result.subjectName}</td>
            <td>${result.subjectCode}</td>
            <td>${result.internalMarks}</td>
            <td>${result.externalMarks}</td>
            <td>${result.totalMarks}</td>
            <td>${result.percentage}%</td>
            <td>${result.grade}</td>
            <td class="${result.status === 'Pass' ? 'status-pass' : 'status-fail'}">${result.status}</td>
        `;
    });
}

function displaySummary(summary) {
    const summaryHtml = `
        <div class="summary-stats">
            <div class="stat-item">
                <label>Total Subjects</label>
                <span class="stat-value">${summary.totalSubjects}</span>
            </div>
            <div class="stat-item">
                <label>Total Marks</label>
                <span class="stat-value">${summary.totalMarksObtained}/${summary.totalMaxMarks}</span>
            </div>
            <div class="stat-item">
                <label>Percentage</label>
                <span class="stat-value">${summary.overallPercentage}%</span>
            </div>
            <div class="stat-item">
                <label>Grade</label>
                <span class="stat-value">${summary.overallGrade}</span>
            </div>
            <div class="stat-item">
                <label>Status</label>
                <span class="stat-value ${summary.overallStatus === 'Pass' ? 'status-pass' : 'status-fail'}">
                    ${summary.overallStatus}
                </span>
            </div>
            <div class="stat-item">
                <label>Failed Subjects</label>
                <span class="stat-value ${summary.failedSubjects > 0 ? 'status-fail' : ''}">
                    ${summary.failedSubjects}
                </span>
            </div>
        </div>
    `;
    
    const summaryStats = document.getElementById('summaryStats');
    if (summaryStats) {
        summaryStats.innerHTML = summaryHtml;
    }
}

function loadPerformanceChart(performance) {
    const canvas = document.getElementById('performanceChart');
    if (!canvas) return;
    
    // Destroy existing chart if it exists
    if (window.performanceChart) {
        window.performanceChart.destroy();
    }
    
    const ctx = canvas.getContext('2d');
    
    window.performanceChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: performance.map(r => r.subject),
            datasets: [
                {
                    label: 'Internal Marks (Max 50)',
                    data: performance.map(r => r.internalMarks),
                    backgroundColor: 'rgba(37, 99, 235, 0.7)',
                    borderColor: 'rgba(37, 99, 235, 1)',
                    borderWidth: 1
                },
                {
                    label: 'External Marks (Max 50)',
                    data: performance.map(r => r.externalMarks),
                    backgroundColor: 'rgba(16, 185, 129, 0.7)',
                    borderColor: 'rgba(16, 185, 129, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Total Marks (Max 100)',
                    data: performance.map(r => r.totalMarks),
                    backgroundColor: 'rgba(245, 158, 11, 0.7)',
                    borderColor: 'rgba(245, 158, 11, 1)',
                    borderWidth: 1,
                    type: 'line',
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 50,
                    title: {
                        display: true,
                        text: 'Marks (Internal/External)'
                    }
                },
                y1: {
                    position: 'right',
                    beginAtZero: true,
                    max: 100,
                    grid: {
                        drawOnChartArea: false
                    },
                    title: {
                        display: true,
                        text: 'Total Marks'
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            }
        }
    });
}

function showNoData(message) {
    const tables = document.querySelectorAll('.table-container');
    tables.forEach(table => {
        table.innerHTML = `<p class="no-data">${message}</p>`;
    });
    
    const summaryStats = document.getElementById('summaryStats');
    if (summaryStats) {
        summaryStats.innerHTML = `<p class="no-data">${message}</p>`;
    }
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

function showLoading(show) {
    const loader = document.getElementById('loadingIndicator');
    if (!loader) {
        // Create loader if it doesn't exist
        const div = document.createElement('div');
        div.id = 'loadingIndicator';
        div.className = 'loading';
        div.innerHTML = 'Loading...';
        document.querySelector('.main-content').appendChild(div);
    }
    
    document.getElementById('loadingIndicator').style.display = show ? 'block' : 'none';
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