class HangmanGame {
    constructor() {
        this.words = {
            animals: ['ELEPHANT', 'GIRAFFE', 'PENGUIN', 'KANGAROO', 'DOLPHIN', 'OCTOPUS', 'CHEETAH', 'ZEBRA', 'KOALA', 'PANDA'],
            countries: ['BRAZIL', 'JAPAN', 'FRANCE', 'AUSTRALIA', 'CANADA', 'MEXICO', 'ITALY', 'EGYPT', 'INDIA', 'SPAIN'],
            fruits: ['APPLE', 'BANANA', 'ORANGE', 'MANGO', 'PINEAPPLE', 'GRAPE', 'STRAWBERRY', 'KIWI', 'PEACH', 'LEMON'],
            sports: ['FOOTBALL', 'BASKETBALL', 'TENNIS', 'SWIMMING', 'VOLLEYBALL', 'BASEBALL', 'CRICKET', 'HOCKEY', 'RUGBY', 'GOLF'],
            movies: ['AVATAR', 'INCEPTION', 'TITANIC', 'GLADIATOR', 'FROZEN', 'JAWS', 'MATRIX', 'ALIEN', 'ROCKY', 'BATMAN']
        };

        this.hints = {
            animals: {
                'ELEPHANT': 'Largest land mammal with a trunk',
                'GIRAFFE': 'Tallest land animal with a long neck',
                'PENGUIN': 'Flightless bird that loves the cold',
                'KANGAROO': 'Australian animal that hops and has a pouch',
                'DOLPHIN': 'Intelligent marine mammal known for its clicks',
                'OCTOPUS': 'Sea creature with eight arms',
                'CHEETAH': 'Fastest land animal',
                'ZEBRA': 'African horse with black and white stripes',
                'KOALA': 'Australian tree-dwelling marsupial',
                'PANDA': 'Black and white bear that eats bamboo'
            },
            // Add hints for other categories...
        };

        this.maxGuesses = 6;
        this.guessesLeft = this.maxGuesses;
        this.word = '';
        this.category = '';
        this.guessedLetters = new Set();
        this.correctLetters = new Set();
        this.stats = this.loadStats();
        
        this.initializeGame();
    }

    initializeGame() {
        this.initializeCanvas();
        this.initializeDOM();
        this.initializeEventListeners();
        this.updateStats();
        this.startNewGame();
    }

    initializeCanvas() {
        this.canvas = document.getElementById('hangman-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;
        this.drawingParts = [
            this.drawGallows,
            this.drawHead,
            this.drawBody,
            this.drawLeftArm,
            this.drawRightArm,
            this.drawLeftLeg,
            this.drawRightLeg
        ];
    }

    initializeDOM() {
        this.wordDisplay = document.getElementById('word-display');
        this.keyboard = document.getElementById('keyboard');
        this.guessesElement = document.getElementById('guesses');
        this.categoryElement = document.getElementById('category');
        this.newGameButton = document.getElementById('new-game');
        this.hintButton = document.getElementById('hint');
        this.modal = document.getElementById('game-over-modal');
        this.modalTitle = document.getElementById('modal-title');
        this.modalMessage = document.getElementById('modal-message');
        this.modalButton = document.getElementById('modal-button');
        
        // Create keyboard
        for (let letter of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
            const button = document.createElement('button');
            button.className = 'key';
            button.textContent = letter;
            button.dataset.letter = letter;
            this.keyboard.appendChild(button);
        }
    }

    initializeEventListeners() {
        this.keyboard.addEventListener('click', (e) => {
            const button = e.target.closest('.key');
            if (button && !button.disabled) {
                this.makeGuess(button.dataset.letter);
            }
        });

        document.addEventListener('keydown', (e) => {
            const letter = e.key.toUpperCase();
            if (/^[A-Z]$/.test(letter)) {
                const button = this.keyboard.querySelector(`[data-letter="${letter}"]`);
                if (button && !button.disabled) {
                    this.makeGuess(letter);
                }
            }
        });

        this.newGameButton.addEventListener('click', () => this.startNewGame());
        this.hintButton.addEventListener('click', () => this.showHint());
        this.modalButton.addEventListener('click', () => {
            this.modal.style.display = 'none';
            this.startNewGame();
        });
    }

    startNewGame() {
        // Reset game state
        this.guessesLeft = this.maxGuesses;
        this.guessedLetters.clear();
        this.correctLetters.clear();

        // Choose random category and word
        const categories = Object.keys(this.words);
        this.category = categories[Math.floor(Math.random() * categories.length)];
        const wordList = this.words[this.category];
        this.word = wordList[Math.floor(Math.random() * wordList.length)];

        // Reset UI
        this.categoryElement.textContent = `Category: ${this.category.charAt(0).toUpperCase() + this.category.slice(1)}`;
        this.updateWordDisplay();
        this.updateGuessesDisplay();
        this.resetKeyboard();
        this.clearCanvas();
        this.drawGallows();
    }

    makeGuess(letter) {
        if (this.guessedLetters.has(letter)) return;

        this.guessedLetters.add(letter);
        const button = this.keyboard.querySelector(`[data-letter="${letter}"]`);
        button.disabled = true;

        if (this.word.includes(letter)) {
            this.correctLetters.add(letter);
            button.classList.add('correct');
            this.updateWordDisplay();
            this.checkWin();
        } else {
            button.classList.add('wrong');
            this.guessesLeft--;
            this.updateGuessesDisplay();
            this.drawNextPart();
            this.checkLose();
        }
    }

    updateWordDisplay() {
        this.wordDisplay.innerHTML = '';
        for (const letter of this.word) {
            const box = document.createElement('div');
            box.className = 'letter-box';
            box.textContent = this.guessedLetters.has(letter) ? letter : '';
            this.wordDisplay.appendChild(box);
        }
    }

    updateGuessesDisplay() {
        this.guessesElement.textContent = this.guessesLeft;
    }

    resetKeyboard() {
        for (const button of this.keyboard.children) {
            button.disabled = false;
            button.classList.remove('correct', 'wrong');
        }
    }

    checkWin() {
        if ([...this.word].every(letter => this.guessedLetters.has(letter))) {
            this.stats.wins++;
            this.stats.streak++;
            this.saveStats();
            this.updateStats();
            this.showGameOver(true);
        }
    }

    checkLose() {
        if (this.guessesLeft === 0) {
            this.stats.losses++;
            this.stats.streak = 0;
            this.saveStats();
            this.updateStats();
            this.showGameOver(false);
        }
    }

    showGameOver(isWin) {
        this.modalTitle.textContent = isWin ? 'Congratulations!' : 'Game Over!';
        this.modalMessage.textContent = isWin ? 
            'You won! Great job!' : 
            `The word was "${this.word}". Better luck next time!`;
        this.modal.style.display = 'flex';
    }

    showHint() {
        if (this.hints[this.category] && this.hints[this.category][this.word]) {
            alert(this.hints[this.category][this.word]);
        } else {
            alert('No hint available for this word.');
        }
    }

    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawNextPart() {
        const partsDrawn = this.maxGuesses - this.guessesLeft - 1;
        if (partsDrawn >= 0 && partsDrawn < this.drawingParts.length) {
            this.drawingParts[partsDrawn].call(this);
        }
    }

    drawGallows() {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        ctx.strokeStyle = '#2c3e50';
        ctx.lineWidth = 4;
        ctx.beginPath();
        
        // Base
        ctx.moveTo(width * 0.1, height * 0.9);
        ctx.lineTo(width * 0.9, height * 0.9);
        
        // Vertical pole
        ctx.moveTo(width * 0.3, height * 0.9);
        ctx.lineTo(width * 0.3, height * 0.1);
        
        // Horizontal beam
        ctx.lineTo(width * 0.7, height * 0.1);
        
        // Rope
        ctx.lineTo(width * 0.7, height * 0.2);
        
        ctx.stroke();
    }

    drawHead() {
        const ctx = this.ctx;
        const centerX = this.canvas.width * 0.7;
        const centerY = this.canvas.height * 0.3;
        const radius = this.canvas.width * 0.08;

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.stroke();
    }

    drawBody() {
        const ctx = this.ctx;
        const startX = this.canvas.width * 0.7;
        const startY = this.canvas.height * 0.38;
        const endY = this.canvas.height * 0.6;

        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(startX, endY);
        ctx.stroke();
    }

    drawLeftArm() {
        const ctx = this.ctx;
        const startX = this.canvas.width * 0.7;
        const startY = this.canvas.height * 0.45;
        const endX = this.canvas.width * 0.5;
        const endY = this.canvas.height * 0.5;

        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
    }

    drawRightArm() {
        const ctx = this.ctx;
        const startX = this.canvas.width * 0.7;
        const startY = this.canvas.height * 0.45;
        const endX = this.canvas.width * 0.9;
        const endY = this.canvas.height * 0.5;

        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
    }

    drawLeftLeg() {
        const ctx = this.ctx;
        const startX = this.canvas.width * 0.7;
        const startY = this.canvas.height * 0.6;
        const endX = this.canvas.width * 0.5;
        const endY = this.canvas.height * 0.8;

        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
    }

    drawRightLeg() {
        const ctx = this.ctx;
        const startX = this.canvas.width * 0.7;
        const startY = this.canvas.height * 0.6;
        const endX = this.canvas.width * 0.9;
        const endY = this.canvas.height * 0.8;

        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
    }

    loadStats() {
        const saved = localStorage.getItem('hangman-stats');
        return saved ? JSON.parse(saved) : {
            wins: 0,
            losses: 0,
            streak: 0
        };
    }

    saveStats() {
        localStorage.setItem('hangman-stats', JSON.stringify(this.stats));
    }

    updateStats() {
        document.getElementById('wins').textContent = this.stats.wins;
        document.getElementById('losses').textContent = this.stats.losses;
        document.getElementById('streak').textContent = this.stats.streak;
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new HangmanGame();
}); 