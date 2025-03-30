// DOM Elements
const decksView = document.getElementById('decks-view');
const studyView = document.getElementById('study-view');
const decksContainer = document.getElementById('decks-container');
const emptyState = document.getElementById('empty-state');
const deckTitle = document.getElementById('deck-title');
const currentCard = document.getElementById('current-card');
const cardFront = document.getElementById('card-front');
const cardBack = document.getElementById('card-back');
const studyProgress = document.getElementById('study-progress');

// State
let decks = JSON.parse(localStorage.getItem('flashcards_decks')) || [];
let currentDeckIndex = -1;
let currentCardIndex = 0;
let shuffledCards = [];

// Initialize
function init() {
    renderDecks();
    setupEventListeners();
}

// Event Listeners
function setupEventListeners() {
    // Deck Management
    document.getElementById('create-deck').addEventListener('click', createDeck);
    document.getElementById('back-to-decks').addEventListener('click', showDecksView);
    
    // Card Management
    document.getElementById('add-card').addEventListener('click', addCard);
    document.getElementById('prev-card').addEventListener('click', showPreviousCard);
    document.getElementById('next-card').addEventListener('click', showNextCard);
    document.getElementById('shuffle-cards').addEventListener('click', shuffleCurrentDeck);
    
    // Card Flipping
    currentCard.addEventListener('click', () => {
        currentCard.classList.toggle('flipped');
    });
}

// Deck Management
function createDeck() {
    const name = document.getElementById('deck-name').value.trim();
    const description = document.getElementById('deck-description').value.trim();
    
    if (!name) return;
    
    const newDeck = {
        id: Date.now(),
        name,
        description,
        cards: []
    };
    
    decks.push(newDeck);
    saveDecksToDisk();
    renderDecks();
    
    // Reset and close modal
    document.getElementById('new-deck-form').reset();
    bootstrap.Modal.getInstance(document.getElementById('newDeckModal')).hide();
}

function renderDecks() {
    if (decks.length === 0) {
        decksContainer.classList.add('d-none');
        emptyState.classList.remove('d-none');
        return;
    }
    
    decksContainer.classList.remove('d-none');
    emptyState.classList.add('d-none');
    
    decksContainer.innerHTML = decks.map((deck, index) => `
        <div class="col-md-4">
            <div class="card deck-card h-100" onclick="startStudySession(${index})">
                <div class="card-body">
                    <h5 class="card-title">${escapeHtml(deck.name)}</h5>
                    <p class="card-text text-muted">${escapeHtml(deck.description || '')}</p>
                    <p class="card-text">
                        <small class="text-muted">
                            ${deck.cards.length} card${deck.cards.length !== 1 ? 's' : ''}
                        </small>
                    </p>
                </div>
            </div>
        </div>
    `).join('');
}

// Card Management
function addCard() {
    const front = document.getElementById('new-card-front').value.trim();
    const back = document.getElementById('new-card-back').value.trim();
    
    if (!front || !back) return;
    
    const newCard = {
        id: Date.now(),
        front,
        back
    };
    
    decks[currentDeckIndex].cards.push(newCard);
    saveDecksToDisk();
    
    // Reset and close modal
    document.getElementById('new-card-form').reset();
    bootstrap.Modal.getInstance(document.getElementById('newCardModal')).hide();
    
    // Update study session
    shuffledCards = [...decks[currentDeckIndex].cards];
    updateStudyProgress();
}

// Study Session
function startStudySession(deckIndex) {
    currentDeckIndex = deckIndex;
    currentCardIndex = 0;
    
    const deck = decks[deckIndex];
    deckTitle.textContent = deck.name;
    
    shuffledCards = [...deck.cards];
    showStudyView();
    showCurrentCard();
}

function showStudyView() {
    decksView.classList.add('d-none');
    studyView.classList.remove('d-none');
}

function showDecksView() {
    studyView.classList.add('d-none');
    decksView.classList.remove('d-none');
    currentCard.classList.remove('flipped');
}

function showCurrentCard() {
    if (shuffledCards.length === 0) {
        cardFront.textContent = 'No cards in this deck';
        cardBack.textContent = 'Add some cards to start studying!';
        return;
    }
    
    const card = shuffledCards[currentCardIndex];
    cardFront.textContent = card.front;
    cardBack.textContent = card.back;
    currentCard.classList.remove('flipped');
    updateStudyProgress();
}

function showNextCard() {
    if (currentCardIndex < shuffledCards.length - 1) {
        currentCardIndex++;
        showCurrentCard();
    }
}

function showPreviousCard() {
    if (currentCardIndex > 0) {
        currentCardIndex--;
        showCurrentCard();
    }
}

function shuffleCurrentDeck() {
    // Fisher-Yates shuffle
    for (let i = shuffledCards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledCards[i], shuffledCards[j]] = [shuffledCards[j], shuffledCards[i]];
    }
    currentCardIndex = 0;
    showCurrentCard();
}

function updateStudyProgress() {
    const progress = ((currentCardIndex + 1) / shuffledCards.length) * 100;
    studyProgress.style.width = `${progress}%`;
}

// Utilities
function saveDecksToDisk() {
    localStorage.setItem('flashcards_decks', JSON.stringify(decks));
}

function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Initialize the app
init(); 