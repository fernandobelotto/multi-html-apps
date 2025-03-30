// Initialize the grocery list from localStorage or create an empty one
let groceryList = JSON.parse(localStorage.getItem('groceryList')) || [];

// DOM Elements
const addItemForm = document.getElementById('addItemForm');
const itemNameInput = document.getElementById('itemName');
const itemCategorySelect = document.getElementById('itemCategory');
const groceryListElement = document.getElementById('groceryList');
const emptyListMessage = document.getElementById('emptyList');
const totalItemsElement = document.getElementById('totalItems');
const completedItemsElement = document.getElementById('completedItems');
const remainingItemsElement = document.getElementById('remainingItems');

// Filter buttons
const showAllButton = document.getElementById('showAll');
const showActiveButton = document.getElementById('showActive');
const showCompletedButton = document.getElementById('showCompleted');
const clearCompletedButton = document.getElementById('clearCompleted');

// Current filter state
let currentFilter = 'all';

// Save groceryList to localStorage
function saveToLocalStorage() {
    localStorage.setItem('groceryList', JSON.stringify(groceryList));
}

// Update statistics
function updateStatistics() {
    const total = groceryList.length;
    const completed = groceryList.filter(item => item.completed).length;
    const remaining = total - completed;

    totalItemsElement.textContent = total;
    completedItemsElement.textContent = completed;
    remainingItemsElement.textContent = remaining;
}

// Create a new grocery item element
function createGroceryItemElement(item) {
    const li = document.createElement('li');
    li.className = `list-group-item grocery-item d-flex justify-content-between align-items-center ${item.completed ? 'completed' : ''}`;
    li.dataset.id = item.id;

    const leftSection = document.createElement('div');
    leftSection.className = 'd-flex align-items-center';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'form-check-input me-2';
    checkbox.checked = item.completed;
    checkbox.addEventListener('change', () => toggleItemComplete(item.id));

    const itemText = document.createElement('span');
    itemText.textContent = item.name;
    itemText.className = 'me-2';

    const categoryBadge = document.createElement('span');
    categoryBadge.className = `badge bg-secondary category-badge ${item.category}`;
    categoryBadge.textContent = item.category;

    const deleteButton = document.createElement('button');
    deleteButton.className = 'btn btn-sm btn-outline-danger';
    deleteButton.innerHTML = '<i class="bi bi-trash"></i>';
    deleteButton.addEventListener('click', () => deleteItem(item.id));

    leftSection.appendChild(checkbox);
    leftSection.appendChild(itemText);
    leftSection.appendChild(categoryBadge);

    li.appendChild(leftSection);
    li.appendChild(deleteButton);

    return li;
}

// Render the grocery list
function renderGroceryList() {
    groceryListElement.innerHTML = '';
    
    let filteredList = groceryList;
    if (currentFilter === 'active') {
        filteredList = groceryList.filter(item => !item.completed);
    } else if (currentFilter === 'completed') {
        filteredList = groceryList.filter(item => item.completed);
    }

    if (filteredList.length === 0) {
        emptyListMessage.classList.remove('d-none');
    } else {
        emptyListMessage.classList.add('d-none');
        filteredList.forEach(item => {
            groceryListElement.appendChild(createGroceryItemElement(item));
        });
    }

    updateStatistics();
}

// Add new item
addItemForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const name = itemNameInput.value.trim();
    const category = itemCategorySelect.value;
    
    if (name) {
        const newItem = {
            id: Date.now().toString(),
            name,
            category,
            completed: false
        };
        
        groceryList.push(newItem);
        saveToLocalStorage();
        renderGroceryList();
        
        itemNameInput.value = '';
        itemNameInput.focus();
    }
});

// Toggle item complete
function toggleItemComplete(id) {
    groceryList = groceryList.map(item => {
        if (item.id === id) {
            return { ...item, completed: !item.completed };
        }
        return item;
    });
    
    saveToLocalStorage();
    renderGroceryList();
}

// Delete item
function deleteItem(id) {
    groceryList = groceryList.filter(item => item.id !== id);
    saveToLocalStorage();
    renderGroceryList();
}

// Filter handlers
showAllButton.addEventListener('click', () => {
    currentFilter = 'all';
    renderGroceryList();
});

showActiveButton.addEventListener('click', () => {
    currentFilter = 'active';
    renderGroceryList();
});

showCompletedButton.addEventListener('click', () => {
    currentFilter = 'completed';
    renderGroceryList();
});

clearCompletedButton.addEventListener('click', () => {
    groceryList = groceryList.filter(item => !item.completed);
    saveToLocalStorage();
    renderGroceryList();
});

// Initial render
renderGroceryList(); 