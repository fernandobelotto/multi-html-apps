class CheckersGame {
    constructor() {
        this.board = this.createInitialBoard();
        this.currentPlayer = 'red';
        this.selectedPiece = null;
        this.moveHistory = [];
        this.capturedPieces = {
            red: [],
            black: []
        };
        this.gameOver = false;
        this.mustJump = false;
        this.chainJumping = false;

        this.initializeGame();
    }

    createInitialBoard() {
        const board = Array(8).fill().map(() => Array(8).fill(null));
        
        // Set up black pieces
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 8; col++) {
                if ((row + col) % 2 === 1) {
                    board[row][col] = { type: 'piece', color: 'black', isKing: false };
                }
            }
        }

        // Set up red pieces
        for (let row = 5; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if ((row + col) % 2 === 1) {
                    board[row][col] = { type: 'piece', color: 'red', isKing: false };
                }
            }
        }

        return board;
    }

    initializeGame() {
        this.initializeDOM();
        this.initializeEventListeners();
        this.renderBoard();
        this.updateTurnIndicator();
    }

    initializeDOM() {
        this.checkerboard = document.getElementById('checkerboard');
        this.turnIndicator = document.querySelector('.turn-indicator');
        this.moveList = document.getElementById('move-list');
        this.capturedRed = document.getElementById('captured-red');
        this.capturedBlack = document.getElementById('captured-black');
        this.modal = document.getElementById('game-over-modal');
        this.modalTitle = document.getElementById('modal-title');
        this.modalMessage = document.getElementById('modal-message');
    }

    initializeEventListeners() {
        document.getElementById('new-game').addEventListener('click', () => this.resetGame());
        document.getElementById('new-game-modal').addEventListener('click', () => {
            this.modal.style.display = 'none';
            this.resetGame();
        });
        document.getElementById('undo-move').addEventListener('click', () => this.undoMove());
        document.getElementById('resign').addEventListener('click', () => this.resign());
    }

    renderBoard() {
        this.checkerboard.innerHTML = '';
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const square = document.createElement('div');
                square.className = `square ${(row + col) % 2 === 0 ? 'white' : 'black'}`;
                square.dataset.row = row;
                square.dataset.col = col;

                const piece = this.board[row][col];
                if (piece) {
                    const pieceElement = document.createElement('div');
                    pieceElement.className = `piece ${piece.color}${piece.isKing ? ' king' : ''}`;
                    square.appendChild(pieceElement);
                }

                square.addEventListener('click', (e) => this.handleSquareClick(row, col));
                this.checkerboard.appendChild(square);
            }
        }
    }

    handleSquareClick(row, col) {
        if (this.gameOver) return;

        const piece = this.board[row][col];
        
        // If a piece is already selected
        if (this.selectedPiece) {
            const [selectedRow, selectedCol] = this.selectedPiece;
            
            // If clicking the same piece, deselect it
            if (row === selectedRow && col === selectedCol) {
                this.clearSelection();
                return;
            }

            // If the move is valid, make it
            if (this.isValidMove(selectedRow, selectedCol, row, col)) {
                this.makeMove(selectedRow, selectedCol, row, col);
                return;
            }

            // If clicking another piece of the same color and no mandatory jumps
            if (piece && piece.color === this.currentPlayer && !this.mustJump) {
                this.clearSelection();
                this.selectPiece(row, col);
                return;
            }

            // Invalid move, clear selection if not chain jumping
            if (!this.chainJumping) {
                this.clearSelection();
            }
            return;
        }

        // If no piece is selected and clicked on a piece of current player's color
        if (piece && piece.color === this.currentPlayer) {
            // Check if there are mandatory jumps
            this.mustJump = this.hasJumps();
            
            // If there are mandatory jumps, only allow selecting pieces that can jump
            if (this.mustJump && !this.canJump(row, col)) {
                return;
            }
            
            this.selectPiece(row, col);
        }
    }

    selectPiece(row, col) {
        this.selectedPiece = [row, col];
        const square = this.getSquareElement(row, col);
        const pieceElement = square.querySelector('.piece');
        if (pieceElement) {
            pieceElement.classList.add('selected');
        }
        this.showValidMoves(row, col);
    }

    clearSelection() {
        if (!this.selectedPiece) return;
        
        const [row, col] = this.selectedPiece;
        const square = this.getSquareElement(row, col);
        const pieceElement = square.querySelector('.piece');
        if (pieceElement) {
            pieceElement.classList.remove('selected');
        }
        
        // Clear valid move indicators
        document.querySelectorAll('.valid-move').forEach(square => {
            square.classList.remove('valid-move');
        });
        
        this.selectedPiece = null;
        this.chainJumping = false;
    }

    showValidMoves(row, col) {
        const moves = this.getValidMoves(row, col);
        moves.forEach(([toRow, toCol]) => {
            const square = this.getSquareElement(toRow, toCol);
            square.classList.add('valid-move');
        });
    }

    getValidMoves(row, col) {
        const moves = [];
        const piece = this.board[row][col];
        
        if (!piece) return moves;

        // Check for jumps first
        const jumps = this.getJumps(row, col);
        if (jumps.length > 0) return jumps;

        // If no jumps and not in chain jumping, check for regular moves
        if (!this.chainJumping) {
            const directions = piece.isKing ? [-1, 1] : piece.color === 'red' ? [-1] : [1];
            
            directions.forEach(dRow => {
                [-1, 1].forEach(dCol => {
                    const newRow = row + dRow;
                    const newCol = col + dCol;
                    
                    if (this.isValidPosition(newRow, newCol) && !this.board[newRow][newCol]) {
                        moves.push([newRow, newCol]);
                    }
                });
            });
        }

        return moves;
    }

    getJumps(row, col) {
        const jumps = [];
        const piece = this.board[row][col];
        
        if (!piece) return jumps;

        const directions = piece.isKing ? [-1, 1] : piece.color === 'red' ? [-1] : [1];
        
        directions.forEach(dRow => {
            [-1, 1].forEach(dCol => {
                const jumpRow = row + dRow * 2;
                const jumpCol = col + dCol * 2;
                const middleRow = row + dRow;
                const middleCol = col + dCol;
                
                if (this.isValidPosition(jumpRow, jumpCol) && 
                    this.board[middleRow][middleCol]?.color !== piece.color && 
                    this.board[middleRow][middleCol] && 
                    !this.board[jumpRow][jumpCol]) {
                    jumps.push([jumpRow, jumpCol]);
                }
            });
        });

        return jumps;
    }

    hasJumps() {
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece && piece.color === this.currentPlayer) {
                    if (this.getJumps(row, col).length > 0) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    canJump(row, col) {
        return this.getJumps(row, col).length > 0;
    }

    isValidPosition(row, col) {
        return row >= 0 && row < 8 && col >= 0 && col < 8;
    }

    isValidMove(fromRow, fromCol, toRow, toCol) {
        const validMoves = this.getValidMoves(fromRow, fromCol);
        return validMoves.some(([row, col]) => row === toRow && col === toCol);
    }

    makeMove(fromRow, fromCol, toRow, toCol) {
        const piece = this.board[fromRow][fromCol];
        const isJump = Math.abs(toRow - fromRow) === 2;

        // Record move
        const move = {
            from: { row: fromRow, col: fromCol },
            to: { row: toRow, col: toCol },
            piece: { ...piece },
            captured: null,
            wasKinged: false
        };

        // Handle capture
        if (isJump) {
            const middleRow = (fromRow + toRow) / 2;
            const middleCol = (fromCol + toCol) / 2;
            const capturedPiece = this.board[middleRow][middleCol];
            move.captured = { ...capturedPiece };
            
            this.capturedPieces[capturedPiece.color].push(capturedPiece);
            this.board[middleRow][middleCol] = null;
            this.updateCapturedPieces();
        }

        // Move piece
        this.board[toRow][toCol] = piece;
        this.board[fromRow][fromCol] = null;

        // Check for king promotion
        if (!piece.isKing && ((piece.color === 'red' && toRow === 0) || (piece.color === 'black' && toRow === 7))) {
            piece.isKing = true;
            move.wasKinged = true;
        }

        this.moveHistory.push(move);

        // Add move to history display
        this.addMoveToHistory(fromRow, fromCol, toRow, toCol, isJump, move.wasKinged);

        // Check for additional jumps
        if (isJump && this.getJumps(toRow, toCol).length > 0) {
            this.chainJumping = true;
            this.clearSelection();
            this.selectPiece(toRow, toCol);
            this.renderBoard();
            return;
        }

        // Switch turns
        this.chainJumping = false;
        this.currentPlayer = this.currentPlayer === 'red' ? 'black' : 'red';
        this.updateTurnIndicator();

        // Enable undo button
        document.getElementById('undo-move').disabled = false;

        // Check for game over
        if (this.isGameOver()) {
            this.endGame(`${piece.color.charAt(0).toUpperCase() + piece.color.slice(1)} wins!`);
        }

        // Render the updated board
        this.clearSelection();
        this.renderBoard();
    }

    addMoveToHistory(fromRow, fromCol, toRow, toCol, isJump, wasKinged) {
        const moveNumber = Math.floor(this.moveHistory.length / 2) + 1;
        const from = `${String.fromCharCode(97 + fromCol)}${8 - fromRow}`;
        const to = `${String.fromCharCode(97 + toCol)}${8 - toRow}`;
        const moveText = `${from}${isJump ? ' x ' : ' - '}${to}${wasKinged ? ' K' : ''}`;

        const moveItem = document.createElement('li');
        moveItem.className = 'move-item';
        moveItem.textContent = `${moveNumber}. ${moveText}`;
        this.moveList.appendChild(moveItem);
        this.moveList.scrollTop = this.moveList.scrollHeight;
    }

    updateCapturedPieces() {
        this.capturedRed.innerHTML = '';
        this.capturedBlack.innerHTML = '';

        this.capturedPieces.red.forEach(() => {
            const pieceElement = document.createElement('div');
            pieceElement.className = 'captured-piece red';
            this.capturedRed.appendChild(pieceElement);
        });

        this.capturedPieces.black.forEach(() => {
            const pieceElement = document.createElement('div');
            pieceElement.className = 'captured-piece black';
            this.capturedBlack.appendChild(pieceElement);
        });
    }

    updateTurnIndicator() {
        this.turnIndicator.textContent = `${this.currentPlayer.charAt(0).toUpperCase() + this.currentPlayer.slice(1)}'s Turn`;
    }

    getSquareElement(row, col) {
        return this.checkerboard.children[row * 8 + col];
    }

    undoMove() {
        if (this.moveHistory.length === 0) return;

        const lastMove = this.moveHistory.pop();
        const { from, to, piece, captured, wasKinged } = lastMove;

        // Restore piece
        if (wasKinged) {
            piece.isKing = false;
        }
        this.board[from.row][from.col] = piece;
        this.board[to.row][to.col] = null;

        // Restore captured piece if any
        if (captured) {
            const middleRow = (from.row + to.row) / 2;
            const middleCol = (from.col + to.col) / 2;
            this.board[middleRow][middleCol] = captured;
            
            const index = this.capturedPieces[captured.color].length - 1;
            if (index !== -1) {
                this.capturedPieces[captured.color].splice(index, 1);
            }
            this.updateCapturedPieces();
        }

        // Remove last move from history display
        if (this.moveList.lastChild) {
            this.moveList.removeChild(this.moveList.lastChild);
        }

        // Switch turns back
        this.currentPlayer = this.currentPlayer === 'red' ? 'black' : 'red';
        this.updateTurnIndicator();

        // Disable undo button if no more moves
        document.getElementById('undo-move').disabled = this.moveHistory.length === 0;

        // Reset chain jumping state
        this.chainJumping = false;
        this.clearSelection();

        // Render the updated board
        this.renderBoard();
    }

    resign() {
        const winner = this.currentPlayer === 'red' ? 'Black' : 'Red';
        this.endGame(`${winner} wins by resignation!`);
    }

    isGameOver() {
        // Check if current player has any valid moves
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece && piece.color === this.currentPlayer) {
                    if (this.getValidMoves(row, col).length > 0) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    endGame(message) {
        this.gameOver = true;
        this.modalTitle.textContent = 'Game Over';
        this.modalMessage.textContent = message;
        this.modal.style.display = 'flex';
    }

    resetGame() {
        this.board = this.createInitialBoard();
        this.currentPlayer = 'red';
        this.selectedPiece = null;
        this.moveHistory = [];
        this.capturedPieces = { red: [], black: [] };
        this.gameOver = false;
        this.mustJump = false;
        this.chainJumping = false;

        this.moveList.innerHTML = '';
        this.updateCapturedPieces();
        this.updateTurnIndicator();
        document.getElementById('undo-move').disabled = true;
        this.clearSelection();
        this.renderBoard();
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new CheckersGame();
}); 