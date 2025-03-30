// Initialize meal data
let mealData = JSON.parse(localStorage.getItem('mealData')) || {
    meals: [],
    currentWeekStart: null
};

// Initialize variables
let currentWeekStart = mealData.currentWeekStart ? new Date(mealData.currentWeekStart) : getWeekStart(new Date());

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
});

// Initialize the app
function initializeApp() {
    if (!mealData.currentWeekStart) {
        mealData.currentWeekStart = currentWeekStart.toISOString();
        saveData();
    }
    updateUI();
}

// Setup event listeners
function setupEventListeners() {
    // Navigation buttons
    document.getElementById('prevWeek').addEventListener('click', () => navigateWeek(-1));
    document.getElementById('nextWeek').addEventListener('click', () => navigateWeek(1));

    // Save meal button
    document.getElementById('saveMeal').addEventListener('click', saveMeal);

    // Delete meal button
    document.getElementById('deleteMeal').addEventListener('click', deleteMeal);

    // Set default date in add meal form
    document.getElementById('mealDate').valueAsDate = new Date();
}

// Get week start date
function getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
}

// Navigate between weeks
function navigateWeek(direction) {
    currentWeekStart = new Date(currentWeekStart);
    currentWeekStart.setDate(currentWeekStart.getDate() + (direction * 7));
    mealData.currentWeekStart = currentWeekStart.toISOString();
    saveData();
    updateUI();
}

// Save new meal
function saveMeal() {
    const date = document.getElementById('mealDate').value;
    const type = document.getElementById('mealType').value;
    const name = document.getElementById('recipeName').value;
    const description = document.getElementById('mealDescription').value;
    const notes = document.getElementById('mealNotes').value;

    if (!date || !type || !name) {
        alert('Please fill in all required fields');
        return;
    }

    const meal = {
        id: Date.now().toString(),
        date: date,
        type: type,
        name: name,
        description: description,
        notes: notes
    };

    mealData.meals.push(meal);
    saveData();
    updateUI();

    // Reset form and close modal
    document.getElementById('addMealForm').reset();
    const modal = bootstrap.Modal.getInstance(document.getElementById('addMealModal'));
    modal.hide();

    showNotification('Meal Added! 🍽️', `${name} has been added to your meal plan.`);
}

// Delete meal
function deleteMeal() {
    const mealId = document.getElementById('viewMealContent').dataset.mealId;
    mealData.meals = mealData.meals.filter(meal => meal.id !== mealId);
    saveData();
    updateUI();

    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('viewMealModal'));
    modal.hide();

    showNotification('Meal Deleted! 🗑️', 'The meal has been removed from your plan.');
}

// Show meal details
function showMealDetails(mealId) {
    const meal = mealData.meals.find(m => m.id === mealId);
    if (!meal) return;

    const content = document.getElementById('viewMealContent');
    content.dataset.mealId = mealId;
    content.innerHTML = `
        <div class="mb-3">
            <strong>Date:</strong> ${formatDate(meal.date)}
        </div>
        <div class="mb-3">
            <strong>Type:</strong> 
            <span class="meal-tag ${meal.type}-tag">${capitalizeFirst(meal.type)}</span>
        </div>
        <div class="mb-3">
            <strong>Recipe:</strong> ${meal.name}
        </div>
        ${meal.description ? `
        <div class="mb-3">
            <strong>Description:</strong>
            <p>${meal.description}</p>
        </div>
        ` : ''}
        ${meal.notes ? `
        <div class="mb-3">
            <strong>Notes:</strong>
            <p>${meal.notes}</p>
        </div>
        ` : ''}
    `;

    const modal = new bootstrap.Modal(document.getElementById('viewMealModal'));
    modal.show();
}

// Update UI elements
function updateUI() {
    updateCalendar();
    updateStatistics();
}

// Update calendar
function updateCalendar() {
    const calendarGrid = document.getElementById('calendarGrid');
    calendarGrid.innerHTML = '';
    
    // Update month display
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    document.getElementById('currentMonth').textContent = 
        `${monthNames[currentWeekStart.getMonth()]} ${currentWeekStart.getFullYear()}`;

    // Create calendar days
    const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const today = new Date().toDateString();

    for (let i = 0; i < 7; i++) {
        const date = new Date(currentWeekStart);
        date.setDate(date.getDate() + i);
        const dayMeals = mealData.meals.filter(meal => meal.date === date.toISOString().split('T')[0]);
        
        const col = document.createElement('div');
        col.className = 'col';
        col.innerHTML = `
            <div class="calendar-day ${date.toDateString() === today ? 'today' : ''}">
                <div class="day-header">
                    <strong>${weekDays[i]}</strong>
                    <br>
                    <small>${formatDate(date.toISOString().split('T')[0])}</small>
                </div>
                <div class="meal-list">
                    ${dayMeals.map(meal => `
                        <div class="meal-tag ${meal.type}-tag" 
                             style="cursor: pointer;"
                             onclick="showMealDetails('${meal.id}')">
                            ${meal.name}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        calendarGrid.appendChild(col);
    }
}

// Update statistics
function updateStatistics() {
    const weekStart = new Date(currentWeekStart);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const weekMeals = mealData.meals.filter(meal => {
        const mealDate = new Date(meal.date);
        return mealDate >= weekStart && mealDate <= weekEnd;
    });

    document.getElementById('totalMeals').textContent = weekMeals.length;
    document.getElementById('uniqueRecipes').textContent = 
        new Set(weekMeals.map(meal => meal.name)).size;
    document.getElementById('mealTypes').textContent = 
        new Set(weekMeals.map(meal => meal.type)).size;
}

// Helper functions
function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
    });
}

function capitalizeFirst(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Save data to localStorage
function saveData() {
    localStorage.setItem('mealData', JSON.stringify(mealData));
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