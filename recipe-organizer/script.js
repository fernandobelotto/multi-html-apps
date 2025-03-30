// Initialize recipes from localStorage or create empty array
let recipes = JSON.parse(localStorage.getItem('recipes')) || [];

// DOM Elements
const recipeGrid = document.getElementById('recipeGrid');
const emptyState = document.getElementById('emptyState');
const recipeForm = document.getElementById('recipeForm');
const addRecipeModal = new bootstrap.Modal(document.getElementById('addRecipeModal'));
const viewRecipeModal = new bootstrap.Modal(document.getElementById('viewRecipeModal'));

// Search and Filter Elements
const searchInput = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');
const difficultyFilter = document.getElementById('difficultyFilter');
const sortBySelect = document.getElementById('sortBy');

// Save recipes to localStorage
function saveToLocalStorage() {
    localStorage.setItem('recipes', JSON.stringify(recipes));
}

// Create recipe card element
function createRecipeCard(recipe) {
    const col = document.createElement('div');
    col.className = 'col-md-4';
    
    col.innerHTML = `
        <div class="card h-100 recipe-card" data-id="${recipe.id}">
            <img src="${recipe.imageUrl || 'https://via.placeholder.com/300x200?text=No+Image'}" 
                 class="card-img-top recipe-image" alt="${recipe.name}">
            <span class="badge bg-primary category-badge">${recipe.category}</span>
            <div class="card-body">
                <h5 class="card-title">${recipe.name}</h5>
                <p class="card-text cooking-time">
                    <i class="bi bi-clock"></i> ${recipe.cookingTime} mins
                </p>
                <p class="card-text difficulty ${recipe.difficulty}">
                    <i class="bi bi-star-fill"></i> ${recipe.difficulty.charAt(0).toUpperCase() + recipe.difficulty.slice(1)}
                </p>
            </div>
        </div>
    `;

    col.querySelector('.recipe-card').addEventListener('click', () => viewRecipe(recipe.id));
    return col;
}

// Filter and sort recipes
function filterAndSortRecipes() {
    const searchTerm = searchInput.value.toLowerCase();
    const category = categoryFilter.value;
    const difficulty = difficultyFilter.value;
    const sortBy = sortBySelect.value;

    let filteredRecipes = recipes.filter(recipe => {
        const matchesSearch = recipe.name.toLowerCase().includes(searchTerm) ||
                            recipe.ingredients.some(ing => ing.toLowerCase().includes(searchTerm));
        const matchesCategory = !category || recipe.category === category;
        const matchesDifficulty = !difficulty || recipe.difficulty === difficulty;
        
        return matchesSearch && matchesCategory && matchesDifficulty;
    });

    // Sort recipes
    filteredRecipes.sort((a, b) => {
        switch(sortBy) {
            case 'name':
                return a.name.localeCompare(b.name);
            case 'date':
                return b.dateAdded - a.dateAdded;
            case 'time':
                return a.cookingTime - b.cookingTime;
            default:
                return 0;
        }
    });

    return filteredRecipes;
}

// Render recipe grid
function renderRecipes() {
    const filteredRecipes = filterAndSortRecipes();
    recipeGrid.innerHTML = '';
    
    if (filteredRecipes.length === 0) {
        emptyState.classList.remove('d-none');
    } else {
        emptyState.classList.add('d-none');
        filteredRecipes.forEach(recipe => {
            recipeGrid.appendChild(createRecipeCard(recipe));
        });
    }
}

// Add new ingredient input field
function addIngredientField() {
    const ingredientsList = document.getElementById('ingredientsList');
    const newIngredient = document.createElement('div');
    newIngredient.className = 'input-group mb-2';
    newIngredient.innerHTML = `
        <input type="text" class="form-control" placeholder="Ingredient" required>
        <button type="button" class="btn btn-outline-danger remove-ingredient">
            <i class="bi bi-dash-circle"></i>
        </button>
    `;
    ingredientsList.appendChild(newIngredient);
}

// Remove ingredient field
function removeIngredientField(button) {
    const ingredientsList = document.getElementById('ingredientsList');
    if (ingredientsList.children.length > 1) {
        button.closest('.input-group').remove();
    }
}

// Save recipe
function saveRecipe() {
    const form = document.getElementById('recipeForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const ingredients = Array.from(document.querySelectorAll('#ingredientsList input'))
                            .map(input => input.value.trim())
                            .filter(value => value);

    const recipe = {
        id: Date.now().toString(),
        name: document.getElementById('recipeName').value.trim(),
        category: document.getElementById('recipeCategory').value,
        difficulty: document.getElementById('recipeDifficulty').value,
        cookingTime: parseInt(document.getElementById('cookingTime').value),
        ingredients: ingredients,
        instructions: document.getElementById('instructions').value.trim(),
        imageUrl: document.getElementById('imageUrl').value.trim(),
        dateAdded: Date.now()
    };

    recipes.push(recipe);
    saveToLocalStorage();
    renderRecipes();
    addRecipeModal.hide();
    form.reset();
}

// View recipe details
function viewRecipe(id) {
    const recipe = recipes.find(r => r.id === id);
    if (!recipe) return;

    document.getElementById('viewRecipeTitle').textContent = recipe.name;
    
    const content = document.getElementById('viewRecipeContent');
    content.innerHTML = `
        <img src="${recipe.imageUrl || 'https://via.placeholder.com/800x400?text=No+Image'}" 
             class="img-fluid mb-3" alt="${recipe.name}">
        <div class="row mb-3">
            <div class="col">
                <strong>Category:</strong> ${recipe.category}
            </div>
            <div class="col">
                <strong>Difficulty:</strong> 
                <span class="${recipe.difficulty}">
                    ${recipe.difficulty.charAt(0).toUpperCase() + recipe.difficulty.slice(1)}
                </span>
            </div>
            <div class="col">
                <strong>Cooking Time:</strong> ${recipe.cookingTime} mins
            </div>
        </div>
        <h5>Ingredients:</h5>
        <ul class="mb-3">
            ${recipe.ingredients.map(ing => `<li>${ing}</li>`).join('')}
        </ul>
        <h5>Instructions:</h5>
        <p class="mb-0">${recipe.instructions}</p>
    `;

    document.getElementById('deleteRecipe').onclick = () => deleteRecipe(id);
    document.getElementById('editRecipe').onclick = () => editRecipe(id);
    
    viewRecipeModal.show();
}

// Delete recipe
function deleteRecipe(id) {
    if (confirm('Are you sure you want to delete this recipe?')) {
        recipes = recipes.filter(recipe => recipe.id !== id);
        saveToLocalStorage();
        renderRecipes();
        viewRecipeModal.hide();
    }
}

// Edit recipe
function editRecipe(id) {
    const recipe = recipes.find(r => r.id === id);
    if (!recipe) return;

    document.getElementById('recipeName').value = recipe.name;
    document.getElementById('recipeCategory').value = recipe.category;
    document.getElementById('recipeDifficulty').value = recipe.difficulty;
    document.getElementById('cookingTime').value = recipe.cookingTime;
    document.getElementById('instructions').value = recipe.instructions;
    document.getElementById('imageUrl').value = recipe.imageUrl || '';

    // Set up ingredients
    const ingredientsList = document.getElementById('ingredientsList');
    ingredientsList.innerHTML = '';
    recipe.ingredients.forEach(ingredient => {
        const div = document.createElement('div');
        div.className = 'input-group mb-2';
        div.innerHTML = `
            <input type="text" class="form-control" placeholder="Ingredient" value="${ingredient}" required>
            <button type="button" class="btn btn-outline-danger remove-ingredient">
                <i class="bi bi-dash-circle"></i>
            </button>
        `;
        ingredientsList.appendChild(div);
    });

    // Change save button behavior
    const saveButton = document.getElementById('saveRecipe');
    const originalOnClick = saveButton.onclick;
    saveButton.onclick = () => {
        recipes = recipes.filter(r => r.id !== id);
        saveRecipe();
        saveButton.onclick = originalOnClick;
    };

    viewRecipeModal.hide();
    addRecipeModal.show();
}

// Event Listeners
document.getElementById('addIngredient').addEventListener('click', addIngredientField);

document.getElementById('ingredientsList').addEventListener('click', (e) => {
    if (e.target.closest('.remove-ingredient')) {
        removeIngredientField(e.target.closest('.remove-ingredient'));
    }
});

document.getElementById('saveRecipe').addEventListener('click', saveRecipe);

// Search and filter event listeners
searchInput.addEventListener('input', renderRecipes);
categoryFilter.addEventListener('change', renderRecipes);
difficultyFilter.addEventListener('change', renderRecipes);
sortBySelect.addEventListener('change', renderRecipes);

// Reset form when modal is hidden
document.getElementById('addRecipeModal').addEventListener('hidden.bs.modal', () => {
    document.getElementById('recipeForm').reset();
    document.getElementById('ingredientsList').innerHTML = `
        <div class="input-group mb-2">
            <input type="text" class="form-control" placeholder="Ingredient" required>
            <button type="button" class="btn btn-outline-danger remove-ingredient">
                <i class="bi bi-dash-circle"></i>
            </button>
        </div>
    `;
});

// Initial render
renderRecipes(); 