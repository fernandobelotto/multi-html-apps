// Store habits in localStorage
let habits = JSON.parse(localStorage.getItem('habits')) || [];

// Get today's date in YYYY-MM-DD format
function getTodayDate() {
    const today = new Date();
    return today.toISOString().split('T')[0];
}

function createHabitCard(habit) {
    const col = document.createElement('div');
    col.className = 'col-md-6 offset-md-3 mb-4';
    
    const card = document.createElement('div');
    card.className = 'card habit-card shadow-sm';
    card.style.borderLeftColor = habit.color;
    
    const cardBody = document.createElement('div');
    cardBody.className = 'card-body';
    
    const header = document.createElement('div');
    header.className = 'd-flex justify-content-between align-items-center mb-3';
    
    const title = document.createElement('h5');
    title.className = 'card-title mb-0';
    title.textContent = habit.name;
    
    const streak = document.createElement('span');
    streak.className = 'streak-badge';
    streak.textContent = `${habit.currentStreak} day streak`;
    
    const goal = document.createElement('p');
    goal.className = 'card-text text-muted mb-3';
    goal.textContent = habit.goal;
    
    const completionTracker = document.createElement('div');
    completionTracker.className = 'd-flex justify-content-between align-items-center';
    
    const circle = document.createElement('div');
    circle.className = `completion-circle ${habit.completedDates.includes(getTodayDate()) ? 'completed' : ''}`;
    circle.onclick = () => toggleHabitCompletion(habit.id);
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn btn-outline-danger btn-sm';
    deleteBtn.innerHTML = '<i class="bi bi-trash"></i>';
    deleteBtn.onclick = () => deleteHabit(habit.id);
    
    header.appendChild(title);
    header.appendChild(streak);
    completionTracker.appendChild(circle);
    completionTracker.appendChild(deleteBtn);
    
    cardBody.appendChild(header);
    cardBody.appendChild(goal);
    cardBody.appendChild(completionTracker);
    card.appendChild(cardBody);
    col.appendChild(card);
    
    return col;
}

function addHabit(name, goal, color) {
    const newHabit = {
        id: Date.now(),
        name,
        goal,
        color,
        completedDates: [],
        currentStreak: 0,
        createdAt: getTodayDate()
    };
    
    habits.push(newHabit);
    saveHabits();
    renderHabits();
}

function toggleHabitCompletion(habitId) {
    const habit = habits.find(h => h.id === habitId);
    const today = getTodayDate();
    
    if (habit.completedDates.includes(today)) {
        habit.completedDates = habit.completedDates.filter(date => date !== today);
    } else {
        habit.completedDates.push(today);
    }
    
    updateStreak(habit);
    saveHabits();
    renderHabits();
    updateTotalProgress();
}

function updateStreak(habit) {
    const today = new Date();
    let streak = 0;
    let currentDate = new Date(today);
    
    while (true) {
        const dateStr = currentDate.toISOString().split('T')[0];
        if (!habit.completedDates.includes(dateStr)) {
            break;
        }
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
    }
    
    habit.currentStreak = streak;
}

function deleteHabit(habitId) {
    if (confirm('Are you sure you want to delete this habit?')) {
        habits = habits.filter(h => h.id !== habitId);
        saveHabits();
        renderHabits();
        updateTotalProgress();
    }
}

function saveHabits() {
    localStorage.setItem('habits', JSON.stringify(habits));
}

function renderHabits() {
    const container = document.getElementById('habitsContainer');
    container.innerHTML = '';
    habits.forEach(habit => {
        container.appendChild(createHabitCard(habit));
    });
}

function updateTotalProgress() {
    const today = getTodayDate();
    const completedToday = habits.filter(h => h.completedDates.includes(today)).length;
    const totalHabits = habits.length;
    const progress = totalHabits > 0 ? (completedToday / totalHabits) * 100 : 0;
    
    document.getElementById('todayProgress').style.width = `${progress}%`;
    
    const totalStreak = habits.reduce((max, habit) => Math.max(max, habit.currentStreak), 0);
    document.getElementById('totalStreak').textContent = totalStreak;
}

// Event Listeners
document.getElementById('confirmAddHabit').addEventListener('click', () => {
    const nameInput = document.getElementById('habitName');
    const goalInput = document.getElementById('habitGoal');
    const colorInput = document.getElementById('habitColor');
    
    const name = nameInput.value.trim();
    const goal = goalInput.value.trim();
    const color = colorInput.value;
    
    if (name && goal) {
        addHabit(name, goal, color);
        nameInput.value = '';
        goalInput.value = '';
        colorInput.value = '#6c757d';
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('addHabitModal'));
        modal.hide();
    }
});

// Initial render
renderHabits();
updateTotalProgress(); 