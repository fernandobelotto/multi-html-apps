document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const addPlantForm = document.getElementById('addPlantForm');
    const plantsList = document.getElementById('plantsList');
    const upcomingTasks = document.getElementById('upcomingTasks');
    const filterType = document.getElementById('filterType');
    const searchPlant = document.getElementById('searchPlant');

    // Load plants from localStorage
    let plants = JSON.parse(localStorage.getItem('plants')) || [];

    // Schedule intervals in days
    const scheduleIntervals = {
        daily: 1,
        '2days': 2,
        weekly: 7,
        biweekly: 14,
        monthly: 30,
        quarterly: 90,
        yearly: 365
    };

    // Function to save plants to localStorage
    const savePlants = () => {
        localStorage.setItem('plants', JSON.stringify(plants));
    };

    // Function to calculate next task date
    const calculateNextDate = (lastDate, interval) => {
        const days = scheduleIntervals[interval];
        const date = lastDate ? new Date(lastDate) : new Date();
        date.setDate(date.getDate() + days);
        return date;
    };

    // Function to format date
    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    // Function to get task icon
    const getTaskIcon = (taskType) => {
        const icons = {
            watering: 'fa-tint',
            fertilizing: 'fa-seedling',
            pruning: 'fa-cut'
        };
        return icons[taskType] || 'fa-check';
    };

    // Function to create plant card
    const createPlantCard = (plant) => {
        const card = document.createElement('div');
        card.className = 'plant-card';
        card.innerHTML = `
            <div class="plant-header">
                <span class="plant-name">${plant.name}</span>
                <span class="plant-type">${plant.type}</span>
            </div>
            <div class="schedule-item">
                <span class="schedule-label">Watering:</span>
                <span class="schedule-value">${plant.wateringSchedule}</span>
            </div>
            <div class="schedule-item">
                <span class="schedule-label">Fertilizing:</span>
                <span class="schedule-value">${plant.fertilizingSchedule}</span>
            </div>
            <div class="schedule-item">
                <span class="schedule-label">Pruning:</span>
                <span class="schedule-value">${plant.pruningSchedule}</span>
            </div>
            ${plant.notes ? `
            <div class="schedule-item">
                <span class="schedule-label">Notes:</span>
                <span class="schedule-value">${plant.notes}</span>
            </div>
            ` : ''}
            <button class="btn-complete" onclick="deletePlant('${plant.id}')">
                <i class="fas fa-trash"></i> Remove
            </button>
        `;
        return card;
    };

    // Function to create task item
    const createTaskItem = (task) => {
        const item = document.createElement('div');
        item.className = 'task-item';
        item.innerHTML = `
            <div class="task-info">
                <div class="task-icon">
                    <i class="fas ${getTaskIcon(task.type)}"></i>
                </div>
                <div class="task-details">
                    <h3>${task.plantName}</h3>
                    <p>${task.type.charAt(0).toUpperCase() + task.type.slice(1)}</p>
                </div>
            </div>
            <span class="task-date">${formatDate(task.date)}</span>
            <button class="btn-complete" onclick="completeTask('${task.id}')">
                Complete
            </button>
        `;
        return item;
    };

    // Function to display plants
    const displayPlants = (filteredPlants = plants) => {
        plantsList.innerHTML = '';
        filteredPlants.forEach(plant => {
            plantsList.appendChild(createPlantCard(plant));
        });
    };

    // Function to get upcoming tasks
    const getUpcomingTasks = () => {
        const tasks = [];
        plants.forEach(plant => {
            ['watering', 'fertilizing', 'pruning'].forEach(taskType => {
                const scheduleKey = `${taskType}Schedule`;
                const lastDateKey = `last${taskType.charAt(0).toUpperCase() + taskType.slice(1)}Date`;
                
                const nextDate = calculateNextDate(plant[lastDateKey], plant[scheduleKey]);
                
                tasks.push({
                    id: `${plant.id}-${taskType}`,
                    plantName: plant.name,
                    type: taskType,
                    date: nextDate,
                    plantId: plant.id
                });
            });
        });

        return tasks.sort((a, b) => new Date(a.date) - new Date(b.date));
    };

    // Function to display upcoming tasks
    const displayTasks = () => {
        upcomingTasks.innerHTML = '';
        const tasks = getUpcomingTasks();
        tasks.slice(0, 10).forEach(task => {
            upcomingTasks.appendChild(createTaskItem(task));
        });
    };

    // Function to add new plant
    const addPlant = (e) => {
        e.preventDefault();

        const newPlant = {
            id: Date.now().toString(),
            name: document.getElementById('plantName').value,
            type: document.getElementById('plantType').value,
            wateringSchedule: document.getElementById('wateringSchedule').value,
            fertilizingSchedule: document.getElementById('fertilizingSchedule').value,
            pruningSchedule: document.getElementById('pruningSchedule').value,
            notes: document.getElementById('notes').value,
            lastWateringDate: null,
            lastFertilizingDate: null,
            lastPruningDate: null
        };

        plants.push(newPlant);
        savePlants();
        displayPlants();
        displayTasks();
        e.target.reset();
    };

    // Function to delete plant
    window.deletePlant = (plantId) => {
        if (confirm('Are you sure you want to delete this plant?')) {
            plants = plants.filter(plant => plant.id !== plantId);
            savePlants();
            displayPlants();
            displayTasks();
        }
    };

    // Function to complete task
    window.completeTask = (taskId) => {
        const [plantId, taskType] = taskId.split('-');
        const plant = plants.find(p => p.id === plantId);
        
        if (plant) {
            const dateKey = `last${taskType.charAt(0).toUpperCase() + taskType.slice(1)}Date`;
            plant[dateKey] = new Date().toISOString();
            savePlants();
            displayTasks();
        }
    };

    // Filter plants by type
    filterType.addEventListener('change', () => {
        const selectedType = filterType.value;
        const filteredPlants = selectedType === 'all' 
            ? plants 
            : plants.filter(plant => plant.type === selectedType);
        displayPlants(filteredPlants);
    });

    // Search plants
    searchPlant.addEventListener('input', () => {
        const searchTerm = searchPlant.value.toLowerCase();
        const filteredPlants = plants.filter(plant => 
            plant.name.toLowerCase().includes(searchTerm) ||
            plant.type.toLowerCase().includes(searchTerm)
        );
        displayPlants(filteredPlants);
    });

    // Event listeners
    addPlantForm.addEventListener('submit', addPlant);

    // Initial display
    displayPlants();
    displayTasks();

    // Update tasks display every hour
    setInterval(displayTasks, 3600000);
}); 