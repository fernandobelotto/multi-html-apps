// Store budget items in localStorage
let budgetItems = JSON.parse(localStorage.getItem('budgetItems')) || {
    income: [],
    expenses: []
};

// Category colors for consistent styling
const categoryColors = {
    housing: '#FF6B6B',
    transportation: '#4ECDC4',
    food: '#45B7D1',
    utilities: '#96CEB4',
    insurance: '#FFEEAD',
    healthcare: '#D4A5A5',
    entertainment: '#9B9B9B',
    other: '#FFE66D'
};

// Initialize charts
let comparisonChart = null;
let categoryChart = null;

function initializeCharts() {
    // Comparison Chart (Bar)
    const ctxComparison = document.getElementById('comparisonChart').getContext('2d');
    comparisonChart = new Chart(ctxComparison, {
        type: 'bar',
        data: {
            labels: ['Income', 'Expenses'],
            datasets: [{
                data: [0, 0],
                backgroundColor: ['#28a745', '#dc3545'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    // Category Chart (Doughnut)
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
}

function createBudgetItem(item, type) {
    const div = document.createElement('div');
    div.className = 'category-item card mb-3';
    div.style.borderLeftColor = type === 'expense' ? categoryColors[item.category] : '#28a745';
    
    const cardBody = document.createElement('div');
    cardBody.className = 'card-body';
    
    const content = document.createElement('div');
    content.className = 'd-flex justify-content-between align-items-center';
    
    const description = document.createElement('div');
    description.innerHTML = `
        <h6 class="mb-0">${item.description}</h6>
        <small class="text-muted">${type === 'expense' ? item.category : 'Income'}</small>
    `;
    
    const amount = document.createElement('div');
    amount.className = 'd-flex align-items-center';
    
    const amountText = document.createElement('h5');
    amountText.className = 'mb-0 me-3';
    amountText.style.color = type === 'income' ? '#28a745' : '#dc3545';
    amountText.textContent = `$${item.amount.toFixed(2)}`;
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn btn-outline-danger btn-sm';
    deleteBtn.innerHTML = '<i class="bi bi-trash"></i>';
    deleteBtn.onclick = () => deleteBudgetItem(item.id, type);
    
    amount.appendChild(amountText);
    amount.appendChild(deleteBtn);
    content.appendChild(description);
    content.appendChild(amount);
    cardBody.appendChild(content);
    div.appendChild(cardBody);
    
    return div;
}

function addBudgetItem(description, amount, type, category = null) {
    const newItem = {
        id: Date.now(),
        description,
        amount: parseFloat(amount),
        ...(category && { category })
    };
    
    budgetItems[type === 'income' ? 'income' : 'expenses'].push(newItem);
    saveBudgetItems();
    renderBudgetItems();
    updateCharts();
    updateSummary();
}

function deleteBudgetItem(id, type) {
    if (confirm('Are you sure you want to delete this item?')) {
        const arrayKey = type === 'income' ? 'income' : 'expenses';
        budgetItems[arrayKey] = budgetItems[arrayKey].filter(item => item.id !== id);
        saveBudgetItems();
        renderBudgetItems();
        updateCharts();
        updateSummary();
    }
}

function saveBudgetItems() {
    localStorage.setItem('budgetItems', JSON.stringify(budgetItems));
}

function renderBudgetItems() {
    const incomeList = document.getElementById('incomeList');
    const expenseList = document.getElementById('expenseList');
    
    incomeList.innerHTML = '';
    expenseList.innerHTML = '';
    
    budgetItems.income.forEach(item => {
        incomeList.appendChild(createBudgetItem(item, 'income'));
    });
    
    budgetItems.expenses.forEach(item => {
        expenseList.appendChild(createBudgetItem(item, 'expense'));
    });
}

function updateCharts() {
    // Update comparison chart
    const totalIncome = budgetItems.income.reduce((sum, item) => sum + item.amount, 0);
    const totalExpenses = budgetItems.expenses.reduce((sum, item) => sum + item.amount, 0);
    
    comparisonChart.data.datasets[0].data = [totalIncome, totalExpenses];
    comparisonChart.update();
    
    // Update category chart
    const categoryTotals = budgetItems.expenses.reduce((acc, item) => {
        acc[item.category] = (acc[item.category] || 0) + item.amount;
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
}

function updateSummary() {
    const totalIncome = budgetItems.income.reduce((sum, item) => sum + item.amount, 0);
    const totalExpenses = budgetItems.expenses.reduce((sum, item) => sum + item.amount, 0);
    const balance = totalIncome - totalExpenses;
    
    document.getElementById('totalIncome').textContent = totalIncome.toFixed(2);
    document.getElementById('totalExpenses').textContent = totalExpenses.toFixed(2);
    document.getElementById('balance').textContent = balance.toFixed(2);
}

// Event Listeners
document.getElementById('itemType').addEventListener('change', (e) => {
    const categoryGroup = document.getElementById('categoryGroup');
    categoryGroup.style.display = e.target.value === 'expense' ? 'block' : 'none';
});

document.getElementById('saveItem').addEventListener('click', () => {
    const type = document.getElementById('itemType').value;
    const description = document.getElementById('itemDescription').value.trim();
    const amount = document.getElementById('itemAmount').value;
    const category = document.getElementById('itemCategory').value;
    
    if (description && amount > 0) {
        addBudgetItem(description, amount, type, type === 'expense' ? category : null);
        
        // Reset form
        document.getElementById('itemDescription').value = '';
        document.getElementById('itemAmount').value = '';
        document.getElementById('itemType').value = 'income';
        document.getElementById('itemCategory').value = 'housing';
        document.getElementById('categoryGroup').style.display = 'none';
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('addModal'));
        modal.hide();
    }
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('categoryGroup').style.display = 'none';
    initializeCharts();
    renderBudgetItems();
    updateCharts();
    updateSummary();
}); 