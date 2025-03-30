class SudokuGame {
    constructor() {
        this.board = Array(9).fill().map(() => Array(9).fill(0));
        this.solution = Array(9).fill().map(() => Array(9).fill(0));
        this.notes = Array(9).fill().map(() => Array(9).fill().map(() => new Set()));
        this.selectedCell = null;
        this.isNotesMode = false;
        this.timer = 0;
        this.timerInterval = null;
        this.difficulty = 'easy';
        this.difficultyConfig = {
            'easy': { min: 35, max: 45 },
            'medium': { min: 30, max: 35 },
            'hard': { min: 25, max: 30 },
            'expert': { min: 20, max: 25 }
        };

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
        this.newGameButton = document.getElementById('new-game');
        this.hintButton = document.getElementById('hint');
        this.clearButton = document.getElementById('clear');
        this.numberButtons = document.querySelectorAll('.number-btn');

        // Create board cells
        for (let i = 0; i < 81; i++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.row = Math.floor(i / 9);
            cell.dataset.col = i % 9;
            this.boardElement.appendChild(cell);
        }
    }

    initializeEventListeners() {
        this.boardElement.addEventListener('click', (e) => {
            const cell = e.target.closest('.cell');
            if (cell && !cell.classList.contains('fixed')) {
                this.selectCell(cell);
            }
        });

        this.numberButtons.forEach(button => {
            button.addEventListener('click', () => {
                const number = button.dataset.number;
                if (number === 'notes') {
                    this.isNotesMode = !this.isNotesMode;
                    button.style.backgroundColor = this.isNotesMode ? '#bde0fe' : '#f8f9fa';
                } else if (this.selectedCell) {
                    this.fillNumber(number);
                }
            });
        });

        document.addEventListener('keydown', (e) => {
            if (this.selectedCell) {
                if (e.key >= '1' && e.key <= '9') {
                    this.fillNumber(e.key);
                } else if (e.key === 'Backspace' || e.key === 'Delete') {
                    this.fillNumber('0');
                } else if (e.key === 'n') {
                    this.isNotesMode = !this.isNotesMode;
                    document.querySelector('[data-number="notes"]').style.backgroundColor = 
                        this.isNotesMode ? '#bde0fe' : '#f8f9fa';
                }
            }
        });

        this.difficultySelector.addEventListener('change', () => {
            this.difficulty = this.difficultySelector.value;
            this.startNewGame();
        });

        this.newGameButton.addEventListener('click', () => this.startNewGame());
        this.hintButton.addEventListener('click', () => this.giveHint());
        this.clearButton.addEventListener('click', () => this.clearBoard());
    }

    generateSudoku() {
        // Initialize empty board
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                this.solution[i][j] = 0;
            }
        }

        // Fill diagonal 3x3 boxes
        for (let i = 0; i < 9; i += 3) {
            this.fillBox(i, i);
        }

        // Fill remaining cells
        this.solveSudoku(this.solution);

        // Copy solution to current board
        this.board = this.solution.map(row => [...row]);

        // Remove numbers based on difficulty
        const cellsToRemove = 81 - this.getRandomInt(
            this.difficultyConfig[this.difficulty].min,
            this.difficultyConfig[this.difficulty].max
        );

        let removed = 0;
        while (removed < cellsToRemove) {
            const row = this.getRandomInt(0, 8);
            const col = this.getRandomInt(0, 8);
            if (this.board[row][col] !== 0) {
                this.board[row][col] = 0;
                removed++;
            }
        }
    }

    fillBox(row, col) {
        const numbers = this.shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                this.solution[row + i][col + j] = numbers[i * 3 + j];
            }
        }
    }

    solveSudoku(board) {
        const emptyCell = this.findEmptyCell(board);
        if (!emptyCell) return true;

        const [row, col] = emptyCell;
        for (let num = 1; num <= 9; num++) {
            if (this.isValidMove(board, row, col, num)) {
                board[row][col] = num;
                if (this.solveSudoku(board)) return true;
                board[row][col] = 0;
            }
        }
        return false;
    }

    findEmptyCell(board) {
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                if (board[i][j] === 0) return [i, j];
            }
        }
        return null;
    }

    isValidMove(board, row, col, num) {
        // Check row
        for (let x = 0; x < 9; x++) {
            if (board[row][x] === num) return false;
        }

        // Check column
        for (let x = 0; x < 9; x++) {
            if (board[x][col] === num) return false;
        }

        // Check 3x3 box
        const boxRow = Math.floor(row / 3) * 3;
        const boxCol = Math.floor(col / 3) * 3;
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (board[boxRow + i][boxCol + j] === num) return false;
            }
        }

        return true;
    }

    startNewGame() {
        this.stopTimer();
        this.timer = 0;
        this.updateTimerDisplay();
        this.generateSudoku();
        this.notes = Array(9).fill().map(() => Array(9).fill().map(() => new Set()));
        this.renderBoard();
        this.startTimer();
    }

    renderBoard() {
        const cells = this.boardElement.children;
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                const cell = cells[i * 9 + j];
                const value = this.board[i][j];
                
                cell.innerHTML = '';
                if (value !== 0) {
                    cell.textContent = value;
                    cell.classList.add('fixed');
                } else {
                    cell.classList.remove('fixed');
                    if (this.notes[i][j].size > 0) {
                        const notesElement = document.createElement('div');
                        notesElement.className = 'notes';
                        for (let n = 1; n <= 9; n++) {
                            const note = document.createElement('div');
                            note.className = 'note';
                            note.textContent = this.notes[i][j].has(n) ? n : '';
                            notesElement.appendChild(note);
                        }
                        cell.appendChild(notesElement);
                    }
                }
            }
        }
    }

    selectCell(cell) {
        // Remove previous selection
        const previousSelected = document.querySelector('.cell.selected');
        if (previousSelected) {
            previousSelected.classList.remove('selected');
        }
        document.querySelectorAll('.cell.same-number').forEach(cell => {
            cell.classList.remove('same-number');
        });

        // Add new selection
        cell.classList.add('selected');
        this.selectedCell = cell;

        // Highlight same numbers
        const number = cell.textContent;
        if (number) {
            document.querySelectorAll('.cell').forEach(c => {
                if (c.textContent === number) {
                    c.classList.add('same-number');
                }
            });
        }
    }

    fillNumber(number) {
        if (!this.selectedCell) return;

        const row = parseInt(this.selectedCell.dataset.row);
        const col = parseInt(this.selectedCell.dataset.col);

        if (this.isNotesMode && number !== '0') {
            if (!this.notes[row][col]) {
                this.notes[row][col] = new Set();
            }
            if (this.notes[row][col].has(parseInt(number))) {
                this.notes[row][col].delete(parseInt(number));
            } else {
                this.notes[row][col].add(parseInt(number));
            }
            this.board[row][col] = 0;
        } else {
            this.board[row][col] = number === '0' ? 0 : parseInt(number);
            this.notes[row][col].clear();
        }

        this.renderBoard();
        this.checkWin();
    }

    giveHint() {
        if (!this.selectedCell) return;

        const row = parseInt(this.selectedCell.dataset.row);
        const col = parseInt(this.selectedCell.dataset.col);

        if (this.board[row][col] === 0) {
            this.board[row][col] = this.solution[row][col];
            this.notes[row][col].clear();
            this.renderBoard();
            this.checkWin();
        }
    }

    clearBoard() {
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                if (!document.querySelector(`[data-row="${i}"][data-col="${j}"]`).classList.contains('fixed')) {
                    this.board[i][j] = 0;
                    this.notes[i][j].clear();
                }
            }
        }
        this.renderBoard();
    }

    checkWin() {
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                if (this.board[i][j] !== this.solution[i][j]) return;
            }
        }
        this.stopTimer();
        setTimeout(() => {
            alert('Congratulations! You solved the puzzle! 🎉');
        }, 100);
    }

    startTimer() {
        this.timerInterval = setInterval(() => {
            this.timer++;
            this.updateTimerDisplay();
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    updateTimerDisplay() {
        const minutes = Math.floor(this.timer / 60);
        const seconds = this.timer % 60;
        this.timerElement.textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SudokuGame();
}); 