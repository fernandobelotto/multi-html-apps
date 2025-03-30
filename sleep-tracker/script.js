// Initialize sleep data
let sleepData = JSON.parse(localStorage.getItem('sleepData')) || {
    entries: [],
    lastReset: new Date().toDateString()
};

let sleepChart = null;
let selectedQuality = null;

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    checkDayReset();
    initializeChart();
    updateUI();
    setupEventListeners();
    setDefaultDates();
});

// Set default dates for the form
function setDefaultDates() {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(22, 0, 0, 0);

    document.getElementById('sleepStart').value = formatDateTimeForInput(yesterday);
    document.getElementById('sleepEnd').value = formatDateTimeForInput(now);
}

// Format date for datetime-local input
function formatDateTimeForInput(date) {
    return date.toISOString().slice(0, 16);
}

// Setup event listeners
function setupEventListeners() {
    // Quality buttons
    document.querySelectorAll('.quality-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.quality-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedQuality = btn.dataset.quality;
        });
    });

    // Save entry button
    document.getElementById('saveSleepEntry').addEventListener('click', saveSleepEntry);
}

// Save new sleep entry
function saveSleepEntry() {
    const startTime = new Date(document.getElementById('sleepStart').value);
    const endTime = new Date(document.getElementById('sleepEnd').value);
    const notes = document.getElementById('sleepNotes').value;

    if (!startTime || !endTime || !selectedQuality) {
        alert('Please fill in all required fields');
        return;
    }

    if (endTime <= startTime) {
        alert('Wake up time must be after sleep time');
        return;
    }

    const duration = (endTime - startTime) / (1000 * 60 * 60); // Duration in hours

    const entry = {
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        duration: duration,
        quality: selectedQuality,
        notes: notes,
        timestamp: new Date().toISOString()
    };

    sleepData.entries.unshift(entry);
    saveData();
    updateUI();

    // Reset form
    document.getElementById('sleepNotes').value = '';
    document.querySelectorAll('.quality-btn').forEach(btn => btn.classList.remove('active'));
    selectedQuality = null;

    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('addSleepModal'));
    modal.hide();

    showNotification('Sleep Entry Added! 💤', 'Your sleep entry has been successfully recorded.');
}

// Initialize Chart.js
function initializeChart() {
    const ctx = document.getElementById('sleepChart').getContext('2d');
    sleepChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Sleep Duration (hours)',
                data: [],
                borderColor: '#6f42c1',
                backgroundColor: 'rgba(111, 66, 193, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Hours'
                    }
                }
            }
        }
    });
}

// Update UI elements
function updateUI() {
    updateStatistics();
    updateChart();
    updateEntries();
}

// Update statistics
function updateStatistics() {
    const stats = calculateStatistics();
    
    document.getElementById('avgSleepTime').textContent = 
        `${Math.floor(stats.avgDuration)}h ${Math.round((stats.avgDuration % 1) * 60)}m`;
    document.getElementById('avgQuality').textContent = stats.avgQuality;
    document.getElementById('totalEntries').textContent = sleepData.entries.length;
}

// Calculate statistics
function calculateStatistics() {
    if (sleepData.entries.length === 0) {
        return {
            avgDuration: 0,
            avgQuality: '-',
            totalEntries: 0
        };
    }

    const totalDuration = sleepData.entries.reduce((sum, entry) => sum + entry.duration, 0);
    const qualityMap = { poor: 1, fair: 2, good: 3 };
    const qualitySum = sleepData.entries.reduce((sum, entry) => sum + qualityMap[entry.quality], 0);

    const avgQualityScore = qualitySum / sleepData.entries.length;
    let avgQuality = '😴';
    if (avgQualityScore >= 2.5) avgQuality = '😃';
    else if (avgQualityScore >= 1.5) avgQuality = '😊';

    return {
        avgDuration: totalDuration / sleepData.entries.length,
        avgQuality: avgQuality,
        totalEntries: sleepData.entries.length
    };
}

// Update chart
function updateChart() {
    const entries = sleepData.entries.slice().reverse(); // Show oldest to newest
    sleepChart.data.labels = entries.map(entry => 
        new Date(entry.startTime).toLocaleDateString()
    );
    sleepChart.data.datasets[0].data = entries.map(entry => entry.duration);
    sleepChart.update();
}

// Update entries list
function updateEntries() {
    const entriesContainer = document.getElementById('sleepEntries');
    entriesContainer.innerHTML = sleepData.entries.map(entry => {
        const startDate = new Date(entry.startTime);
        const endDate = new Date(entry.endTime);
        const qualityClass = `quality-${entry.quality}`;
        
        return `
            <div class="card mb-3 sleep-card">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-center">
                        <h6 class="card-subtitle mb-2 text-muted">
                            ${startDate.toLocaleDateString()}
                        </h6>
                        <div class="quality-indicator ${qualityClass}"></div>
                    </div>
                    <p class="card-text">
                        ${startDate.toLocaleTimeString()} - ${endDate.toLocaleTimeString()}
                        <br>
                        Duration: ${Math.floor(entry.duration)}h ${Math.round((entry.duration % 1) * 60)}m
                    </p>
                    ${entry.notes ? `<p class="card-text"><small class="text-muted">${entry.notes}</small></p>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// Save data to localStorage
function saveData() {
    localStorage.setItem('sleepData', JSON.stringify(sleepData));
}

// Check if we need to reset daily stats
function checkDayReset() {
    const today = new Date().toDateString();
    if (sleepData.lastReset !== today) {
        sleepData.lastReset = today;
        saveData();
    }
}

// Show notification
function showNotification(title, message) {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
            body: message,
            icon: '/favicon.ico'
        });
    }
}

// Request notification permission
if ('Notification' in window) {
    Notification.requestPermission();
} 