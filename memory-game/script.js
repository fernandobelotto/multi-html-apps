// Game configuration
const config = {
    easy: { rows: 4, cols: 4 },
    medium: { rows: 5, cols: 5 },
    hard: { rows: 6, cols: 6 }
};

// Card symbols (emojis)
const symbols = [
    '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼',
    '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐙', '🐵',
    '🦄', '🦋', '🐢', '🦕', '🦖', '🦀', '🐠', '🦈',
    '🦩', '🦜', '🦚', '🦉', '🦅', '🐝', '🦒', '🦘'
];

// Game state
let gameState = {
    difficulty: 'easy',
    cards: [],
    flippedCards: [],
    matchedPairs: 0,
    moves: 0,
    startTime: null,
    timerInterval: null,
    isPlaying: false
};

// DOM Elements
const gameGrid = document.getElementById('game-grid');
const difficultySelect = document.getElementById('difficulty-select');
const timeDisplay = document.getElementById('time');
const movesDisplay = document.getElementById('moves');
const celebration = document.getElementById('celebration');
const finalTimeDisplay = document.getElementById('final-time');
const finalMovesDisplay = document.getElementById('final-moves');

// Initialize
function init() {
    loadBestTimes();
    setupEventListeners();
}

// Event Listeners
function setupEventListeners() {
    // Difficulty selection
    document.querySelectorAll('[data-difficulty]').forEach(button => {
        button.addEventListener('click', () => {
            gameState.difficulty = button.dataset.difficulty;
            startNewGame();
        });
    });

    // New game button
    document.getElementById('new-game').addEventListener('click', () => {
        difficultySelect.classList.remove('d-none');
        stopTimer();
        resetGame();
    });

    // Play again button
    document.getElementById('play-again').addEventListener('click', () => {
        celebration.classList.remove('show');
        difficultySelect.classList.remove('d-none');
        resetGame();
    });
}

// Game Management
function startNewGame() {
    resetGame();
    difficultySelect.classList.add('d-none');
    const { rows, cols } = config[gameState.difficulty];
    gameGrid.className = `game-grid difficulty-${gameState.difficulty}`;
    
    // Generate and shuffle cards
    const pairs = (rows * cols) / 2;
    const selectedSymbols = symbols.slice(0, pairs);
    const cardSymbols = [...selectedSymbols, ...selectedSymbols];
    shuffleArray(cardSymbols);
    
    // Create card elements
    gameGrid.innerHTML = cardSymbols.map((symbol, index) => `
        <div class="card" data-index="${index}">
            <div class="card-inner">
                <div class="card-front">
                    <i class="bi bi-question-lg"></i>
                </div>
                <div class="card-back">
                    ${symbol}
                </div>
            </div>
        </div>
    `).join('');
    
    // Add click handlers
    document.querySelectorAll('.card').forEach(card => {
        card.addEventListener('click', () => handleCardClick(card));
    });
    
    gameState.cards = cardSymbols;
    gameState.isPlaying = true;
    startTimer();
}

function handleCardClick(card) {
    if (!gameState.isPlaying) return;
    if (card.classList.contains('flipped') || card.classList.contains('matched')) return;
    if (gameState.flippedCards.length >= 2) return;
    
    const index = parseInt(card.dataset.index);
    flipCard(card);
    gameState.flippedCards.push({ index, symbol: gameState.cards[index] });
    
    if (gameState.flippedCards.length === 2) {
        gameState.moves++;
        movesDisplay.textContent = gameState.moves;
        checkMatch();
    }
}

function flipCard(card) {
    card.classList.add('flipped');
}

function checkMatch() {
    const [card1, card2] = gameState.flippedCards;
    const elements = document.querySelectorAll('.card');
    
    if (card1.symbol === card2.symbol) {
        // Match found
        setTimeout(() => {
            elements[card1.index].classList.add('matched');
            elements[card2.index].classList.add('matched');
            gameState.matchedPairs++;
            gameState.flippedCards = [];
            
            if (gameState.matchedPairs === gameState.cards.length / 2) {
                handleGameWin();
            }
        }, 500);
    } else {
        // No match
        setTimeout(() => {
            elements[card1.index].classList.remove('flipped');
            elements[card2.index].classList.remove('flipped');
            gameState.flippedCards = [];
        }, 1000);
    }
}

function handleGameWin() {
    stopTimer();
    gameState.isPlaying = false;
    
    const time = timeDisplay.textContent;
    finalTimeDisplay.textContent = time;
    finalMovesDisplay.textContent = gameState.moves;
    
    // Update best times
    const bestTimes = JSON.parse(localStorage.getItem(`bestTimes_${gameState.difficulty}`)) || [];
    bestTimes.push({
        time: time,
        moves: gameState.moves,
        date: new Date().toLocaleDateString()
    });
    bestTimes.sort((a, b) => {
        const timeA = timeToSeconds(a.time);
        const timeB = timeToSeconds(b.time);
        return timeA - timeB;
    });
    localStorage.setItem(`bestTimes_${gameState.difficulty}`, JSON.stringify(bestTimes.slice(0, 10)));
    
    updateBestTimesList(gameState.difficulty);
    celebration.classList.add('show');
}

// Timer Management
function startTimer() {
    gameState.startTime = Date.now();
    gameState.timerInterval = setInterval(updateTimer, 1000);
}

function stopTimer() {
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
        gameState.timerInterval = null;
    }
}

function updateTimer() {
    const elapsed = Math.floor((Date.now() - gameState.startTime) / 1000);
    const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
    const seconds = (elapsed % 60).toString().padStart(2, '0');
    timeDisplay.textContent = `${minutes}:${seconds}`;
}

// Best Times Management
function loadBestTimes() {
    ['easy', 'medium', 'hard'].forEach(difficulty => {
        updateBestTimesList(difficulty);
    });
}

function updateBestTimesList(difficulty) {
    const bestTimes = JSON.parse(localStorage.getItem(`bestTimes_${difficulty}`)) || [];
    const list = document.getElementById(`${difficulty}-times-list`);
    
    if (bestTimes.length === 0) {
        list.innerHTML = '<p class="text-muted">No records yet</p>';
        return;
    }
    
    list.innerHTML = bestTimes.map((record, index) => `
        <div class="d-flex justify-content-between align-items-center mb-2">
            <span>#${index + 1}</span>
            <span>${record.time}</span>
            <span>${record.moves} moves</span>
            <small class="text-muted">${record.date}</small>
        </div>
    `).join('');
}

// Utilities
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function timeToSeconds(timeString) {
    const [minutes, seconds] = timeString.split(':').map(Number);
    return minutes * 60 + seconds;
}

function resetGame() {
    gameState = {
        ...gameState,
        cards: [],
        flippedCards: [],
        matchedPairs: 0,
        moves: 0,
        startTime: null,
        isPlaying: false
    };
    
    stopTimer();
    timeDisplay.textContent = '00:00';
    movesDisplay.textContent = '0';
    gameGrid.innerHTML = '';
}

// Initialize the app
init(); 