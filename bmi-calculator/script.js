// Initialize BMI data
let bmiData = JSON.parse(localStorage.getItem('bmiData')) || {
    entries: [],
    lastReset: new Date().toDateString()
};

let bmiChart = null;

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    checkDayReset();
    initializeChart();
    updateUI();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    // Unit toggle
    document.getElementById('metric').addEventListener('change', toggleUnits);
    document.getElementById('imperial').addEventListener('change', toggleUnits);

    // Form submission
    document.getElementById('bmiForm').addEventListener('submit', (e) => {
        e.preventDefault();
        calculateBMI();
    });
}

// Toggle between metric and imperial units
function toggleUnits() {
    const isMetric = document.getElementById('metric').checked;
    document.querySelector('.metric-inputs').classList.toggle('d-none', !isMetric);
    document.querySelector('.imperial-inputs').classList.toggle('d-none', isMetric);
}

// Calculate BMI
function calculateBMI() {
    const isMetric = document.getElementById('metric').checked;
    let height, weight;

    if (isMetric) {
        height = parseFloat(document.getElementById('heightCm').value) / 100; // Convert cm to m
        weight = parseFloat(document.getElementById('weightKg').value);
    } else {
        const feet = parseFloat(document.getElementById('heightFt').value);
        const inches = parseFloat(document.getElementById('heightIn').value) || 0;
        const totalInches = (feet * 12) + inches;
        height = totalInches * 0.0254; // Convert inches to m
        weight = parseFloat(document.getElementById('weightLbs').value) * 0.453592; // Convert lbs to kg
    }

    if (!height || !weight) {
        alert('Please enter valid height and weight values');
        return;
    }

    const bmi = weight / (height * height);
    const category = getBMICategory(bmi);
    const healthyRange = calculateHealthyRange(height);

    // Save entry
    const entry = {
        date: new Date().toISOString(),
        bmi: bmi,
        category: category,
        height: height,
        weight: weight,
        unit: isMetric ? 'metric' : 'imperial'
    };

    bmiData.entries.unshift(entry);
    saveData();
    updateUI();
    showResult(bmi, category, healthyRange);
}

// Get BMI category
function getBMICategory(bmi) {
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25) return 'Normal weight';
    if (bmi < 30) return 'Overweight';
    return 'Obese';
}

// Calculate healthy weight range for given height
function calculateHealthyRange(height) {
    const minWeight = 18.5 * (height * height);
    const maxWeight = 24.9 * (height * height);
    return {
        min: Math.round(minWeight * 10) / 10,
        max: Math.round(maxWeight * 10) / 10
    };
}

// Show BMI result
function showResult(bmi, category, healthyRange) {
    const resultSection = document.getElementById('resultSection');
    resultSection.classList.remove('d-none');

    document.getElementById('bmiValue').textContent = bmi.toFixed(1);
    document.getElementById('bmiCategory').textContent = category;
    document.getElementById('healthyRange').textContent = 
        `For your height, a healthy weight range would be ${healthyRange.min}kg to ${healthyRange.max}kg`;

    // Scroll to result
    resultSection.scrollIntoView({ behavior: 'smooth' });
}

// Initialize Chart.js
function initializeChart() {
    const ctx = document.getElementById('bmiChart').getContext('2d');
    bmiChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'BMI',
                data: [],
                borderColor: '#0d6efd',
                backgroundColor: 'rgba(13, 110, 253, 0.1)',
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
                        text: 'BMI'
                    }
                }
            },
            plugins: {
                annotation: {
                    annotations: {
                        normalRange: {
                            type: 'box',
                            yMin: 18.5,
                            yMax: 24.9,
                            backgroundColor: 'rgba(40, 167, 69, 0.1)',
                            borderColor: 'transparent'
                        }
                    }
                }
            }
        }
    });
}

// Update UI elements
function updateUI() {
    updateChart();
    updateHistory();
}

// Update chart
function updateChart() {
    const entries = bmiData.entries.slice().reverse(); // Show oldest to newest
    bmiChart.data.labels = entries.map(entry => 
        new Date(entry.date).toLocaleDateString()
    );
    bmiChart.data.datasets[0].data = entries.map(entry => entry.bmi);
    bmiChart.update();
}

// Update history entries
function updateHistory() {
    const historyContainer = document.getElementById('historyEntries');
    historyContainer.innerHTML = bmiData.entries.map(entry => {
        const date = new Date(entry.date);
        const categoryClass = entry.category.toLowerCase().replace(' ', '');
        
        return `
            <div class="card mb-3 history-card">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-center">
                        <h6 class="card-subtitle mb-2 text-muted">
                            ${date.toLocaleDateString()} ${date.toLocaleTimeString()}
                        </h6>
                        <div class="category-indicator ${categoryClass}"></div>
                    </div>
                    <p class="card-text">
                        BMI: ${entry.bmi.toFixed(1)} (${entry.category})
                        <br>
                        Height: ${formatMeasurement(entry.height, entry.unit, 'height')}
                        <br>
                        Weight: ${formatMeasurement(entry.weight, entry.unit, 'weight')}
                    </p>
                </div>
            </div>
        `;
    }).join('');
}

// Format measurement based on unit system
function formatMeasurement(value, unit, type) {
    if (unit === 'metric') {
        if (type === 'height') {
            return `${(value * 100).toFixed(1)} cm`;
        } else {
            return `${value.toFixed(1)} kg`;
        }
    } else {
        if (type === 'height') {
            const inches = value * 39.3701;
            const feet = Math.floor(inches / 12);
            const remainingInches = Math.round((inches % 12) * 10) / 10;
            return `${feet}'${remainingInches}"`;
        } else {
            return `${(value / 0.453592).toFixed(1)} lbs`;
        }
    }
}

// Save data to localStorage
function saveData() {
    localStorage.setItem('bmiData', JSON.stringify(bmiData));
}

// Check if we need to reset daily stats
function checkDayReset() {
    const today = new Date().toDateString();
    if (bmiData.lastReset !== today) {
        bmiData.lastReset = today;
        saveData();
    }
} 