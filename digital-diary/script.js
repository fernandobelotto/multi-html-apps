// Initialize diary entries and password from localStorage
let diaryEntries = [];
let diaryPassword = localStorage.getItem('diaryPassword');
let selectedMood = '';

// DOM Elements
const lockScreen = document.getElementById('lockScreen');
const passwordForm = document.getElementById('passwordForm');
const entriesGrid = document.getElementById('entriesGrid');
const emptyState = document.getElementById('emptyState');
const entryForm = document.getElementById('entryForm');
const newEntryModal = new bootstrap.Modal(document.getElementById('newEntryModal'));
const viewEntryModal = new bootstrap.Modal(document.getElementById('viewEntryModal'));

// Search and Filter Elements
const searchInput = document.getElementById('searchInput');
const moodFilter = document.getElementById('moodFilter');
const dateFilter = document.getElementById('dateFilter');
const sortBySelect = document.getElementById('sortBy');

// Password protection
function checkPassword(password) {
    if (!diaryPassword) {
        // First time setup
        diaryPassword = password;
        localStorage.setItem('diaryPassword', password);
        return true;
    }
    return password === diaryPassword;
}

passwordForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const password = document.getElementById('password').value;
    
    if (checkPassword(password)) {
        lockScreen.style.display = 'none';
        loadEntries();
    } else {
        alert('Incorrect password. Please try again.');
    }
    passwordForm.reset();
});

document.getElementById('lockDiary').addEventListener('click', () => {
    lockScreen.style.display = 'flex';
    document.getElementById('password').value = '';
});

// Save entries to localStorage
function saveToLocalStorage() {
    const encryptedEntries = diaryEntries.map(entry => ({
        ...entry,
        content: btoa(entry.content) // Simple base64 encoding for basic privacy
    }));
    localStorage.setItem('diaryEntries', JSON.stringify(encryptedEntries));
}

// Load entries from localStorage
function loadEntries() {
    const storedEntries = localStorage.getItem('diaryEntries');
    if (storedEntries) {
        const encryptedEntries = JSON.parse(storedEntries);
        diaryEntries = encryptedEntries.map(entry => ({
            ...entry,
            content: atob(entry.content) // Decode base64 content
        }));
        renderEntries();
    }
}

// Create entry card element
function createEntryCard(entry) {
    const col = document.createElement('div');
    col.className = 'col-md-6 col-lg-4';
    
    const moodIcon = {
        happy: '<i class="bi bi-emoji-smile mood-happy"></i>',
        neutral: '<i class="bi bi-emoji-neutral mood-neutral"></i>',
        sad: '<i class="bi bi-emoji-frown mood-sad"></i>'
    }[entry.mood];

    const date = new Date(entry.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    col.innerHTML = `
        <div class="card h-100 entry-card" data-id="${entry.id}">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <h5 class="card-title mb-0">${entry.title}</h5>
                    <div class="mood-icon">${moodIcon}</div>
                </div>
                <p class="card-text entry-preview">${entry.content}</p>
                <div class="mt-3">
                    ${entry.tags.map(tag => `
                        <span class="badge bg-secondary tag">${tag}</span>
                    `).join('')}
                </div>
                <small class="text-muted d-block mt-2">${date}</small>
            </div>
        </div>
    `;

    col.querySelector('.entry-card').addEventListener('click', () => viewEntry(entry.id));
    return col;
}

// Filter and sort entries
function filterAndSortEntries() {
    const searchTerm = searchInput.value.toLowerCase();
    const mood = moodFilter.value;
    const date = dateFilter.value;
    const sortBy = sortBySelect.value;

    let filteredEntries = diaryEntries.filter(entry => {
        const matchesSearch = entry.title.toLowerCase().includes(searchTerm) ||
                            entry.content.toLowerCase().includes(searchTerm) ||
                            entry.tags.some(tag => tag.toLowerCase().includes(searchTerm));
        const matchesMood = !mood || entry.mood === mood;
        
        const entryDate = new Date(entry.date);
        const now = new Date();
        let matchesDate = true;

        if (date === 'today') {
            matchesDate = entryDate.toDateString() === now.toDateString();
        } else if (date === 'week') {
            const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
            matchesDate = entryDate >= weekAgo;
        } else if (date === 'month') {
            matchesDate = entryDate.getMonth() === now.getMonth() &&
                         entryDate.getFullYear() === now.getFullYear();
        } else if (date === 'year') {
            matchesDate = entryDate.getFullYear() === now.getFullYear();
        }

        return matchesSearch && matchesMood && matchesDate;
    });

    // Sort entries
    filteredEntries.sort((a, b) => {
        return sortBy === 'newest' ? 
            new Date(b.date) - new Date(a.date) : 
            new Date(a.date) - new Date(b.date);
    });

    return filteredEntries;
}

// Render entries grid
function renderEntries() {
    const filteredEntries = filterAndSortEntries();
    entriesGrid.innerHTML = '';
    
    if (filteredEntries.length === 0) {
        emptyState.classList.remove('d-none');
    } else {
        emptyState.classList.add('d-none');
        filteredEntries.forEach(entry => {
            entriesGrid.appendChild(createEntryCard(entry));
        });
    }
}

// Handle mood selection
document.querySelectorAll('.mood-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedMood = btn.dataset.mood;
    });
});

// Save entry
function saveEntry() {
    const form = document.getElementById('entryForm');
    if (!form.checkValidity() || !selectedMood) {
        if (!selectedMood) alert('Please select a mood');
        form.reportValidity();
        return;
    }

    const entry = {
        id: Date.now().toString(),
        title: document.getElementById('entryTitle').value.trim(),
        content: document.getElementById('editor').value.trim(),
        mood: selectedMood,
        tags: document.getElementById('entryTags').value
            .split(',')
            .map(tag => tag.trim())
            .filter(tag => tag),
        date: new Date().toISOString()
    };

    diaryEntries.push(entry);
    saveToLocalStorage();
    renderEntries();
    newEntryModal.hide();
    form.reset();
    selectedMood = '';
    document.querySelectorAll('.mood-btn').forEach(btn => btn.classList.remove('active'));
}

// View entry
function viewEntry(id) {
    const entry = diaryEntries.find(e => e.id === id);
    if (!entry) return;

    document.getElementById('viewEntryTitle').textContent = entry.title;
    
    const content = document.getElementById('viewEntryContent');
    const date = new Date(entry.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const moodIcon = {
        happy: '<i class="bi bi-emoji-smile mood-happy"></i>',
        neutral: '<i class="bi bi-emoji-neutral mood-neutral"></i>',
        sad: '<i class="bi bi-emoji-frown mood-sad"></i>'
    }[entry.mood];

    content.innerHTML = `
        <div class="d-flex align-items-center mb-3">
            <div class="mood-icon">${moodIcon}</div>
            <small class="text-muted">${date}</small>
        </div>
        <div class="mb-4" style="white-space: pre-wrap;">${entry.content}</div>
        <div>
            ${entry.tags.map(tag => `
                <span class="badge bg-secondary tag">${tag}</span>
            `).join('')}
        </div>
    `;

    document.getElementById('deleteEntry').onclick = () => deleteEntry(id);
    document.getElementById('editEntry').onclick = () => editEntry(id);
    
    viewEntryModal.show();
}

// Delete entry
function deleteEntry(id) {
    if (confirm('Are you sure you want to delete this entry?')) {
        diaryEntries = diaryEntries.filter(entry => entry.id !== id);
        saveToLocalStorage();
        renderEntries();
        viewEntryModal.hide();
    }
}

// Edit entry
function editEntry(id) {
    const entry = diaryEntries.find(e => e.id === id);
    if (!entry) return;

    document.getElementById('entryTitle').value = entry.title;
    document.getElementById('editor').value = entry.content;
    document.getElementById('entryTags').value = entry.tags.join(', ');
    
    selectedMood = entry.mood;
    document.querySelectorAll('.mood-btn').forEach(btn => {
        if (btn.dataset.mood === entry.mood) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    const saveButton = document.getElementById('saveEntry');
    const originalOnClick = saveButton.onclick;
    saveButton.onclick = () => {
        diaryEntries = diaryEntries.filter(e => e.id !== id);
        saveEntry();
        saveButton.onclick = originalOnClick;
    };

    viewEntryModal.hide();
    newEntryModal.show();
}

// Event Listeners
document.getElementById('saveEntry').addEventListener('click', saveEntry);

// Search and filter event listeners
searchInput.addEventListener('input', renderEntries);
moodFilter.addEventListener('change', renderEntries);
dateFilter.addEventListener('change', renderEntries);
sortBySelect.addEventListener('change', renderEntries);

// Reset form when modal is hidden
document.getElementById('newEntryModal').addEventListener('hidden.bs.modal', () => {
    document.getElementById('entryForm').reset();
    selectedMood = '';
    document.querySelectorAll('.mood-btn').forEach(btn => btn.classList.remove('active'));
});

// Show lock screen initially
if (!diaryPassword) {
    lockScreen.style.display = 'flex';
} else {
    lockScreen.style.display = 'none';
    loadEntries();
} 