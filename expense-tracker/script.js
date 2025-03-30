// Store expenses in localStorage
let expenses = JSON.parse(localStorage.getItem('expenses')) || [];

// Category colors for consistent styling
const categoryColors = {
    food: '#FF6B6B',
    transportation: '#4ECDC4',
    shopping: '#45B7D1',
    entertainment: '#96CEB4',
    utilities: '#FFEEAD',
    health: '#D4A5A5',
    education: '#9B9B9B',
    other: '#FFE66D'
};

// Initialize charts
let categoryChart = null;
let dailyChart = null;

function initializeCharts() {
    // Category Chart
    const ctxCategory = document.getElementById('categoryChart').getContext('2d');
    categoryChart = new Chart(ctxCategory, {
        type: 'doughnut',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: [],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });

    // Daily Chart
    const ctxDaily = document.getElementById('dailyChart').getContext('2d');
    dailyChart = new Chart(ctxDaily, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Daily Expenses',
                data: [],
                backgroundColor: '#0d6efd',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function createExpenseCard(expense) {
    const col = document.createElement('div');
    col.className = 'col-md-6 offset-md-3 mb-3';
    
    const card = document.createElement('div');
    card.className = 'card expense-card shadow-sm';
    
    const cardBody = document.createElement('div');
    cardBody.className = 'card-body';
    
    const header = document.createElement('div');
    header.className = 'd-flex justify-content-between align-items-center mb-2';
    
    const description = document.createElement('h5');
    description.className = 'card-title mb-0';
    description.textContent = expense.description;
    
    const amount = document.createElement('span');
    amount.className = 'amount text-primary';
    amount.textContent = `$${expense.amount.toFixed(2)}`;
    
    const details = document.createElement('div');
    details.className = 'd-flex justify-content-between align-items-center';
    
    const category = document.createElement('span');
    category.className = `category-badge`;
    category.style.backgroundColor = categoryColors[expense.category];
    category.textContent = expense.category.charAt(0).toUpperCase() + expense.category.slice(1);
    
    const date = document.createElement('span');
    date.className = 'date';
    date.textContent = new Date(expense.date).toLocaleDateString();
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn btn-outline-danger btn-sm ms-2';
    deleteBtn.innerHTML = '<i class="bi bi-trash"></i>';
    deleteBtn.onclick = () => deleteExpense(expense.id);
    
    header.appendChild(description);
    header.appendChild(amount);
    details.appendChild(category);
    details.appendChild(date);
    details.appendChild(deleteBtn);
    
    cardBody.appendChild(header);
    cardBody.appendChild(details);
    card.appendChild(cardBody);
    col.appendChild(card);
    
    return col;
}

function createCategoryTotalCard(category, total) {
    const col = document.createElement('div');
    col.className = 'col-md-3 mb-3';
    
    const card = document.createElement('div');
    card.className = 'card category-total shadow-sm';
    card.style.borderLeft = `4px solid ${categoryColors[category]}`;
    
    const cardBody = document.createElement('div');
    cardBody.className = 'card-body';
    
    const title = document.createElement('h6');
    title.className = 'card-title text-muted mb-1';
    title.textContent = category.charAt(0).toUpperCase() + category.slice(1);
    
    const totalAmount = document.createElement('h5');
    totalAmount.className = 'mb-0';
    totalAmount.textContent = `$${total.toFixed(2)}`;
    
    cardBody.appendChild(title);
    cardBody.appendChild(totalAmount);
    card.appendChild(cardBody);
    col.appendChild(card);
    
    return col;
}

function addExpense(amount, description, category, date) {
    const newExpense = {
        id: Date.now(),
        amount: parseFloat(amount),
        description,
        category,
        date
    };
    
    expenses.push(newExpense);
    saveExpenses();
    renderExpenses();
    updateCharts();
    updateTotals();
}

function deleteExpense(expenseId) {
    if (confirm('Are you sure you want to delete this expense?')) {
        expenses = expenses.filter(e => e.id !== expenseId);
        saveExpenses();
        renderExpenses();
        updateCharts();
        updateTotals();
    }
}

function saveExpenses() {
    localStorage.setItem('expenses', JSON.stringify(expenses));
}

function renderExpenses() {
    const container = document.getElementById('expensesContainer');
    container.innerHTML = '';
    
    // Sort expenses by date (most recent first)
    const sortedExpenses = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    sortedExpenses.forEach(expense => {
        container.appendChild(createExpenseCard(expense));
    });
}

function updateCharts() {
    // Update category chart
    const categoryTotals = expenses.reduce((acc, expense) => {
        acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
        return acc;
    }, {});
    
    categoryChart.data.labels = Object.keys(categoryTotals).map(cat => 
        cat.charAt(0).toUpperCase() + cat.slice(1)
    );
    categoryChart.data.datasets[0].data = Object.values(categoryTotals);
    categoryChart.data.datasets[0].backgroundColor = Object.keys(categoryTotals).map(cat => 
        categoryColors[cat]
    );
    categoryChart.update();
    
    // Update daily chart
    const dailyTotals = expenses.reduce((acc, expense) => {
        const date = expense.date;
        acc[date] = (acc[date] || 0) + expense.amount;
        return acc;
    }, {});
    
    const sortedDates = Object.keys(dailyTotals).sort();
    
    dailyChart.data.labels = sortedDates.map(date => 
        new Date(date).toLocaleDateString()
    );
    dailyChart.data.datasets[0].data = sortedDates.map(date => 
        dailyTotals[date]
    );
    dailyChart.update();
}

function updateTotals() {
    const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    document.getElementById('totalAmount').textContent = total.toFixed(2);
    
    // Update category totals
    const categoryTotals = expenses.reduce((acc, expense) => {
        acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
        return acc;
    }, {});
    
    const categoryTotalsContainer = document.getElementById('categoryTotals');
    categoryTotalsContainer.innerHTML = '';
    
    Object.entries(categoryTotals).forEach(([category, total]) => {
        categoryTotalsContainer.appendChild(createCategoryTotalCard(category, total));
    });
}

// Event Listeners
document.getElementById('confirmAddExpense').addEventListener('click', () => {
    const amountInput = document.getElementById('expenseAmount');
    const descriptionInput = document.getElementById('expenseDescription');
    const categoryInput = document.getElementById('expenseCategory');
    const dateInput = document.getElementById('expenseDate');
    
    const amount = parseFloat(amountInput.value);
    const description = descriptionInput.value.trim();
    const category = categoryInput.value;
    const date = dateInput.value;
    
    if (amount > 0 && description && category && date) {
        addExpense(amount, description, category, date);
        
        // Reset form
        amountInput.value = '';
        descriptionInput.value = '';
        categoryInput.value = 'food';
        dateInput.value = '';
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('addExpenseModal'));
        modal.hide();
    }
});

// Set today's date as default in the date input
document.addEventListener('DOMContentLoaded', () => {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('expenseDate').value = today;
    
    initializeCharts();
    renderExpenses();
    updateCharts();
    updateTotals();
}); 