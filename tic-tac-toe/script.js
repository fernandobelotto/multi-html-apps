class TicTacToe {
    constructor() {
        this.board = Array(9).fill('');
        this.currentPlayer = 'X';
        this.gameEnded = false;
        this.scores = { X: 0, O: 0 };
        
        // Winning combinations (indices)
        this.winningCombos = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
            [0, 4, 8], [2, 4, 6]             // Diagonals
        ];

        this.initializeGame();
    }

    initializeGame() {
        // Get DOM elements
        this.cells = document.querySelectorAll('.cell');
        this.statusElement = document.getElementById('status');
        this.resetButton = document.getElementById('reset-game');
        this.scoreX = document.getElementById('score-x');
        this.scoreO = document.getElementById('score-o');

        // Add event listeners
        this.cells.forEach(cell => {
            cell.addEventListener('click', () => this.handleCellClick(cell));
        });
        this.resetButton.addEventListener('click', () => this.resetGame());

        // Update scores display
        this.updateScores();
    }

    handleCellClick(cell) {
        const index = cell.dataset.index;
        
        // Check if cell is empty and game is not ended
        if (this.board[index] === '' && !this.gameEnded) {
            // Update board array and cell display
            this.board[index] = this.currentPlayer;
            cell.textContent = this.currentPlayer;
            cell.classList.add(this.currentPlayer.toLowerCase());

            // Check for win or draw
            if (this.checkWin()) {
                this.handleWin();
            } else if (this.checkDraw()) {
                this.handleDraw();
            } else {
                // Switch player
                this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
                this.updateStatus(`Player ${this.currentPlayer}'s turn`);
            }
        }
    }

    checkWin() {
        return this.winningCombos.some(combo => {
            return combo.every(index => {
                return this.board[index] === this.currentPlayer;
            });
        });
    }

    checkDraw() {
        return this.board.every(cell => cell !== '');
    }

    handleWin() {
        this.gameEnded = true;
        this.scores[this.currentPlayer]++;
        this.updateScores();
        this.updateStatus(`Player ${this.currentPlayer} wins! 🎉`);
        this.highlightWinningCells();
    }

    handleDraw() {
        this.gameEnded = true;
        this.updateStatus("It's a draw! 🤝");
    }

    highlightWinningCells() {
        const winningCombo = this.winningCombos.find(combo => {
            return combo.every(index => this.board[index] === this.currentPlayer);
        });

        if (winningCombo) {
            winningCombo.forEach(index => {
                this.cells[index].style.backgroundColor = '#e8f5e9';
            });
        }
    }

    resetGame() {
        // Reset board array
        this.board = Array(9).fill('');
        
        // Reset visual state
        this.cells.forEach(cell => {
            cell.textContent = '';
            cell.style.backgroundColor = '';
            cell.classList.remove('x', 'o');
        });

        // Reset game state
        this.gameEnded = false;
        this.currentPlayer = 'X';
        this.updateStatus(`Player ${this.currentPlayer}'s turn`);
    }

    updateStatus(message) {
        this.statusElement.textContent = message;
    }

    updateScores() {
        this.scoreX.textContent = this.scores.X;
        this.scoreO.textContent = this.scores.O;
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TicTacToe();
}); 