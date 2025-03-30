// Initialize water intake data
let waterData = JSON.parse(localStorage.getItem('waterData')) || {
    dailyGoal: 2000,
    currentIntake: 0,
    lastReset: new Date().toDateString(),
    weeklyData: Array(7).fill(0),
    settings: {
        reminderInterval: 60,
        startTime: '08:00',
        endTime: '22:00',
        notificationsEnabled: true
    },
    history: [],
    streak: 0,
    lastGoalMet: null
};

let weeklyChart = null;
let reminderTimeout = null;

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    checkDayReset();
    updateUI();
    initializeChart();
    loadSettings();
    setupReminders();
    requestNotificationPermission();
});

// Check if we need to reset daily intake
function checkDayReset() {
    const today = new Date().toDateString();
    if (waterData.lastReset !== today) {
        // Check if yesterday's goal was met for streak
        const yesterdayIntake = waterData.currentIntake;
        if (yesterdayIntake >= waterData.dailyGoal) {
            if (!waterData.lastGoalMet || new Date(waterData.lastGoalMet).toDateString() === new Date(Date.now() - 86400000).toDateString()) {
                waterData.streak++;
            }
            waterData.lastGoalMet = new Date().toDateString();
        } else {
            waterData.streak = 0;
        }

        // Update weekly data (shift array and add yesterday's value)
        waterData.weeklyData.shift();
        waterData.weeklyData.push(waterData.currentIntake);
        
        // Reset daily intake and history
        waterData.currentIntake = 0;
        waterData.history = [];
        waterData.lastReset = today;
        saveData();
    }
}

// Add water intake
function addWater(amount) {
    const timestamp = new Date();
    waterData.currentIntake += amount;
    
    // Add to history
    waterData.history.unshift({
        amount: amount,
        timestamp: timestamp.toISOString(),
        total: waterData.currentIntake
    });
    
    updateUI();
    saveData();
    
    // Enable undo button
    document.getElementById('undoButton').disabled = false;
    
    // Check if goal is met for the first time today
    if (waterData.currentIntake >= waterData.dailyGoal && (!waterData.lastGoalMet || waterData.lastGoalMet !== new Date().toDateString())) {
        waterData.lastGoalMet = new Date().toDateString();
        if (waterData.streak === 0 || new Date(waterData.lastGoalMet).toDateString() === new Date(Date.now() - 86400000).toDateString()) {
            waterData.streak++;
            saveData();
        }
    }
    
    // Show success notification
    const percentage = Math.min(100, Math.round((waterData.currentIntake / waterData.dailyGoal) * 100));
    if (percentage === 100) {
        showNotification('Daily Goal Achieved! 🎉', 'Congratulations! You\'ve reached your daily water intake goal!');
    } else {
        showNotification('Water Added! 💧', `You've consumed ${amount}ml of water. Keep it up!`);
    }
}

// Add custom water amount
function addCustomWater() {
    const customAmount = parseInt(document.getElementById('customAmount').value);
    if (customAmount > 0) {
        addWater(customAmount);
        document.getElementById('customAmount').value = '';
    }
}

// Undo last water entry
function undoLastEntry() {
    if (waterData.history.length > 0) {
        const lastEntry = waterData.history[0];
        waterData.currentIntake -= lastEntry.amount;
        waterData.history.shift();
        
        // Disable undo button if no more history
        document.getElementById('undoButton').disabled = waterData.history.length === 0;
        
        updateUI();
        saveData();
        
        showNotification('Entry Removed! ↩️', `Removed ${lastEntry.amount}ml from your water intake.`);
    }
}

// Update UI elements
function updateUI() {
    const percentage = Math.min(100, Math.round((waterData.currentIntake / waterData.dailyGoal) * 100));
    
    // Update water level visualization
    document.getElementById('waterLevel').style.height = `${percentage}%`;
    document.getElementById('waterPercentage').textContent = `${percentage}%`;
    
    // Update intake numbers
    document.getElementById('currentIntake').textContent = waterData.currentIntake;
    document.getElementById('dailyGoal').textContent = waterData.dailyGoal;
    
    // Update streak counter
    document.getElementById('streakCounter').textContent = `${waterData.streak}🔥`;
    
    // Update history log
    const historyLog = document.getElementById('historyLog');
    historyLog.innerHTML = waterData.history.map(entry => {
        const time = new Date(entry.timestamp).toLocaleTimeString();
        return `
            <div class="history-item">
                <small class="text-muted">${time}</small>
                <div>Added ${entry.amount}ml (Total: ${entry.total}ml)</div>
            </div>
        `;
    }).join('');
    
    // Update chart
    if (weeklyChart) {
        weeklyChart.data.datasets[0].data = waterData.weeklyData;
        weeklyChart.update();
    }
}

// Initialize Chart.js
function initializeChart() {
    const ctx = document.getElementById('weeklyChart').getContext('2d');
    weeklyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['6 days ago', '5 days ago', '4 days ago', '3 days ago', '2 days ago', 'Yesterday', 'Today'],
            datasets: [{
                label: 'Daily Water Intake (ml)',
                data: waterData.weeklyData,
                backgroundColor: 'rgba(13, 110, 253, 0.5)',
                borderColor: 'rgba(13, 110, 253, 1)',
                borderWidth: 1
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
                        text: 'Water Intake (ml)'
                    }
                }
            }
        }
    });
}

// Save data to localStorage
function saveData() {
    localStorage.setItem('waterData', JSON.stringify(waterData));
}

// Load settings into form
function loadSettings() {
    document.getElementById('goalInput').value = waterData.dailyGoal;
    document.getElementById('intervalInput').value = waterData.settings.reminderInterval;
    document.getElementById('startTime').value = waterData.settings.startTime;
    document.getElementById('endTime').value = waterData.settings.endTime;
    document.getElementById('notificationsEnabled').checked = waterData.settings.notificationsEnabled;
}

// Save settings from form
document.getElementById('saveSettings').addEventListener('click', () => {
    waterData.dailyGoal = parseInt(document.getElementById('goalInput').value);
    waterData.settings.reminderInterval = parseInt(document.getElementById('intervalInput').value);
    waterData.settings.startTime = document.getElementById('startTime').value;
    waterData.settings.endTime = document.getElementById('endTime').value;
    waterData.settings.notificationsEnabled = document.getElementById('notificationsEnabled').checked;
    
    saveData();
    updateUI();
    setupReminders();
    
    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('settingsModal'));
    modal.hide();
    
    showNotification('Settings Saved! ⚙️', 'Your water intake settings have been updated.');
});

// Setup reminder system
function setupReminders() {
    if (reminderTimeout) {
        clearTimeout(reminderTimeout);
    }
    
    if (!waterData.settings.notificationsEnabled) {
        return;
    }
    
    function scheduleNextReminder() {
        const now = new Date();
        const startTime = new Date(now.toDateString() + ' ' + waterData.settings.startTime);
        const endTime = new Date(now.toDateString() + ' ' + waterData.settings.endTime);
        
        if (now >= startTime && now <= endTime) {
            reminderTimeout = setTimeout(() => {
                showNotification('Water Reminder 💧', 'Time to drink some water! Stay hydrated!');
                scheduleNextReminder();
            }, waterData.settings.reminderInterval * 60 * 1000);
        } else {
            // Schedule for next day's start time
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            const nextStart = new Date(tomorrow.toDateString() + ' ' + waterData.settings.startTime);
            const delay = nextStart.getTime() - now.getTime();
            
            reminderTimeout = setTimeout(scheduleNextReminder, delay);
        }
    }
    
    scheduleNextReminder();
}

// Request notification permission
function requestNotificationPermission() {
    if ('Notification' in window) {
        Notification.requestPermission();
    }
}

// Show notification
function showNotification(title, message) {
    if (waterData.settings.notificationsEnabled && 'Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
            body: message,
            icon: '/favicon.ico'
        });
    }
} 