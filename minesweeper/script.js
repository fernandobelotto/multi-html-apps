class Minesweeper {
    constructor() {
        this.difficultyConfig = {
            beginner: { rows: 9, cols: 9, mines: 10 },
            intermediate: { rows: 16, cols: 16, mines: 40 },
            expert: { rows: 16, cols: 30, mines: 99 }
        };
        
        this.board = [];
        this.mineLocations = new Set();
        this.revealed = new Set();
        this.flagged = new Set();
        this.isGameOver = false;
        this.isFirstClick = true;
        this.difficulty = 'beginner';
        this.timer = 0;
        this.timerInterval = null;
        this.bestTimes = this.loadBestTimes();

        this.initializeGame();
    }

    initializeGame() {
        this.initializeDOM();
        this.initializeEventListeners();
        this.startNewGame();
    }

    initializeDOM() {
        this.boardElement = document.getElementById('board');
        this.difficultySelector = document.getElementById('difficulty');
        this.timerElement = document.getElementById('timer');
        this.flagsLeftElement = document.getElementById('flags-left');
        this.newGameButton = document.getElementById('new-game');
        this.modal = document.getElementById('game-over-modal');
        this.modalTitle = document.getElementById('modal-title');
        this.modalMessage = document.getElementById('modal-message');
        this.modalButton = document.getElementById('modal-button');
        this.bestTimesList = document.getElementById('best-times');
    }

    initializeEventListeners() {
        this.boardElement.addEventListener('click', (e) => {
            const cell = e.target.closest('.cell');
            if (cell && !this.isGameOver) {
                this.handleCellClick(cell);
            }
        });

        this.boardElement.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            const cell = e.target.closest('.cell');
            if (cell && !this.isGameOver) {
                this.toggleFlag(cell);
            }
        });

        this.difficultySelector.addEventListener('change', () => {
            this.difficulty = this.difficultySelector.value;
            this.startNewGame();
        });

        this.newGameButton.addEventListener('click', () => this.startNewGame());
        this.modalButton.addEventListener('click', () => {
            this.modal.style.display = 'none';
            this.startNewGame();
        });

        // Handle chord action (middle click or both left+right click)
        this.boardElement.addEventListener('mousedown', (e) => {
            if ((e.button === 1 || (e.button === 0 && e.buttons === 3)) && !this.isGameOver) {
                const cell = e.target.closest('.cell');
                if (cell) {
                    this.handleChordClick(cell);
                }
            }
        });
    }

    startNewGame() {
        const config = this.difficultyConfig[this.difficulty];
        this.board = Array(config.rows).fill().map(() => Array(config.cols).fill(0));
        this.mineLocations.clear();
        this.revealed.clear();
        this.flagged.clear();
        this.isGameOver = false;
        this.isFirstClick = true;
        
        // Stop and reset timer
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        this.timer = 0;
        this.updateTimer();

        // Update flags counter
        this.updateFlagsLeft();

        // Create board UI
        this.createBoard();

        // Update board size
        this.boardElement.style.gridTemplateColumns = `repeat(${config.cols}, 1fr)`;
    }

    createBoard() {
        const config = this.difficultyConfig[this.difficulty];
        this.boardElement.innerHTML = '';
        
        for (let row = 0; row < config.rows; row++) {
            for (let col = 0; col < config.cols; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                this.boardElement.appendChild(cell);
            }
        }
    }

    placeMines(firstRow, firstCol) {
        const config = this.difficultyConfig[this.difficulty];
        let minesToPlace = config.mines;

        while (minesToPlace > 0) {
            const row = Math.floor(Math.random() * config.rows);
            const col = Math.floor(Math.random() * config.cols);
            const key = `${row},${col}`;

            // Don't place mine on first click or adjacent to it
            if (!this.mineLocations.has(key) && 
                Math.abs(row - firstRow) > 1 || 
                Math.abs(col - firstCol) > 1) {
                this.mineLocations.add(key);
                minesToPlace--;
            }
        }

        // Calculate numbers for adjacent cells
        for (const mine of this.mineLocations) {
            const [row, col] = mine.split(',').map(Number);
            this.incrementAdjacentCells(row, col);
        }
    }

    incrementAdjacentCells(row, col) {
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                if (i === 0 && j === 0) continue;
                
                const newRow = row + i;
                const newCol = col + j;
                
                if (this.isValidCell(newRow, newCol) && 
                    !this.mineLocations.has(`${newRow},${newCol}`)) {
                    this.board[newRow][newCol]++;
                }
            }
        }
    }

    handleCellClick(cell) {
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        const key = `${row},${col}`;

        // Don't reveal flagged cells
        if (this.flagged.has(key)) return;

        // Handle first click
        if (this.isFirstClick) {
            this.isFirstClick = false;
            this.placeMines(row, col);
            this.startTimer();
        }

        // Check if clicked on mine
        if (this.mineLocations.has(key)) {
            this.gameOver(false);
            return;
        }

        this.revealCell(row, col);
        this.checkWin();
    }

    revealCell(row, col) {
        const key = `${row},${col}`;
        
        // Skip if cell is already revealed or flagged
        if (this.revealed.has(key) || this.flagged.has(key)) return;
        
        // Reveal the cell
        this.revealed.add(key);
        const cell = this.boardElement.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        cell.classList.add('revealed');

        // If it's a number, show it
        if (this.board[row][col] > 0) {
            cell.textContent = this.board[row][col];
            cell.classList.add(`number-${this.board[row][col]}`);
            return;
        }

        // If it's empty, reveal adjacent cells
        if (this.board[row][col] === 0) {
            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    const newRow = row + i;
                    const newCol = col + j;
                    if (this.isValidCell(newRow, newCol)) {
                        this.revealCell(newRow, newCol);
                    }
                }
            }
        }
    }

    toggleFlag(cell) {
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        const key = `${row},${col}`;

        // Don't flag revealed cells
        if (this.revealed.has(key)) return;

        if (this.flagged.has(key)) {
            this.flagged.delete(key);
            cell.textContent = '';
            cell.classList.remove('flagged');
        } else {
            this.flagged.add(key);
            cell.textContent = '🚩';
            cell.classList.add('flagged');
        }

        this.updateFlagsLeft();
    }

    handleChordClick(cell) {
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        const key = `${row},${col}`;

        // Only chord on revealed numbers
        if (!this.revealed.has(key) || this.board[row][col] === 0) return;

        // Count adjacent flags
        let flagCount = 0;
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                if (i === 0 && j === 0) continue;
                const newRow = row + i;
                const newCol = col + j;
                if (this.isValidCell(newRow, newCol) && 
                    this.flagged.has(`${newRow},${newCol}`)) {
                    flagCount++;
                }
            }
        }

        // If flags match the number, reveal adjacent cells
        if (flagCount === this.board[row][col]) {
            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    if (i === 0 && j === 0) continue;
                    const newRow = row + i;
                    const newCol = col + j;
                    if (this.isValidCell(newRow, newCol) && 
                        !this.flagged.has(`${newRow},${newCol}`) &&
                        !this.revealed.has(`${newRow},${newCol}`)) {
                        if (this.mineLocations.has(`${newRow},${newCol}`)) {
                            this.gameOver(false);
                            return;
                        }
                        this.revealCell(newRow, newCol);
                    }
                }
            }
            this.checkWin();
        }
    }

    gameOver(isWin) {
        this.isGameOver = true;
        this.stopTimer();

        // Reveal all mines
        this.mineLocations.forEach(key => {
            const [row, col] = key.split(',').map(Number);
            const cell = this.boardElement.querySelector(`[data-row="${row}"][data-col="${col}"]`);
            cell.textContent = '💣';
            cell.classList.add('mine');
        });

        // Show game over modal
        this.modalTitle.textContent = isWin ? 'Congratulations!' : 'Game Over!';
        this.modalMessage.textContent = isWin ? 
            `You won in ${this.formatTime(this.timer)}!` : 
            'Better luck next time!';
        this.modal.style.display = 'flex';

        // Update best time if won
        if (isWin) {
            this.updateBestTime();
        }
    }

    checkWin() {
        const config = this.difficultyConfig[this.difficulty];
        const totalCells = config.rows * config.cols;
        
        if (this.revealed.size === totalCells - config.mines) {
            this.gameOver(true);
        }
    }

    startTimer() {
        this.timerInterval = setInterval(() => {
            this.timer++;
            this.updateTimer();
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    updateTimer() {
        this.timerElement.textContent = this.timer.toString().padStart(3, '0');
    }

    updateFlagsLeft() {
        const config = this.difficultyConfig[this.difficulty];
        this.flagsLeftElement.textContent = (config.mines - this.flagged.size).toString();
    }

    isValidCell(row, col) {
        const config = this.difficultyConfig[this.difficulty];
        return row >= 0 && row < config.rows && col >= 0 && col < config.cols;
    }

    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    loadBestTimes() {
        const saved = localStorage.getItem('minesweeper-best-times');
        return saved ? JSON.parse(saved) : {
            beginner: null,
            intermediate: null,
            expert: null
        };
    }

    updateBestTime() {
        if (!this.bestTimes[this.difficulty] || this.timer < this.bestTimes[this.difficulty]) {
            this.bestTimes[this.difficulty] = this.timer;
            localStorage.setItem('minesweeper-best-times', JSON.stringify(this.bestTimes));
            this.updateBestTimesList();
        }
    }

    updateBestTimesList() {
        const items = this.bestTimesList.getElementsByTagName('li');
        ['beginner', 'intermediate', 'expert'].forEach((diff, index) => {
            const time = this.bestTimes[diff];
            items[index].lastElementChild.textContent = 
                time !== null ? this.formatTime(time) : '---';
        });
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new Minesweeper();
}); 