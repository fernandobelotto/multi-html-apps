class ChessGame {
    constructor() {
        this.board = this.createInitialBoard();
        this.currentPlayer = 'white';
        this.selectedPiece = null;
        this.moveHistory = [];
        this.capturedPieces = {
            white: [],
            black: []
        };
        this.gameOver = false;

        this.pieces = {
            white: {
                king: '♔',
                queen: '♕',
                rook: '♖',
                bishop: '♗',
                knight: '♘',
                pawn: '♙'
            },
            black: {
                king: '♚',
                queen: '♛',
                rook: '♜',
                bishop: '♝',
                knight: '♞',
                pawn: '♟'
            }
        };

        this.initializeGame();
    }

    createInitialBoard() {
        const board = Array(8).fill().map(() => Array(8).fill(null));
        
        // Set up pawns
        for (let i = 0; i < 8; i++) {
            board[1][i] = { type: 'pawn', color: 'black' };
            board[6][i] = { type: 'pawn', color: 'white' };
        }

        // Set up other pieces
        const backRowPieces = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];
        for (let i = 0; i < 8; i++) {
            board[0][i] = { type: backRowPieces[i], color: 'black' };
            board[7][i] = { type: backRowPieces[i], color: 'white' };
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
        this.chessboard = document.getElementById('chessboard');
        this.turnIndicator = document.querySelector('.turn-indicator');
        this.moveList = document.getElementById('move-list');
        this.capturedWhite = document.getElementById('captured-white');
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
        this.chessboard.innerHTML = '';
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const square = document.createElement('div');
                square.className = `square ${(row + col) % 2 === 0 ? 'white' : 'black'}`;
                square.dataset.row = row;
                square.dataset.col = col;

                const piece = this.board[row][col];
                if (piece) {
                    square.textContent = this.pieces[piece.color][piece.type];
                }

                square.addEventListener('click', (e) => this.handleSquareClick(row, col));
                this.chessboard.appendChild(square);
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
                this.clearSelection();
                return;
            }

            // If clicking another piece of the same color, select it instead
            if (piece && piece.color === this.currentPlayer) {
                this.clearSelection();
                this.selectPiece(row, col);
                return;
            }

            // Invalid move, clear selection
            this.clearSelection();
            return;
        }

        // If no piece is selected and clicked on a piece of current player's color
        if (piece && piece.color === this.currentPlayer) {
            this.selectPiece(row, col);
        }
    }

    selectPiece(row, col) {
        this.selectedPiece = [row, col];
        const square = this.getSquareElement(row, col);
        square.classList.add('selected');
        this.showValidMoves(row, col);
    }

    clearSelection() {
        if (!this.selectedPiece) return;
        
        const [row, col] = this.selectedPiece;
        const square = this.getSquareElement(row, col);
        square.classList.remove('selected');
        
        // Clear valid move indicators
        document.querySelectorAll('.valid-move').forEach(square => {
            square.classList.remove('valid-move');
        });
        
        this.selectedPiece = null;
    }

    showValidMoves(row, col) {
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                if (this.isValidMove(row, col, i, j)) {
                    const square = this.getSquareElement(i, j);
                    square.classList.add('valid-move');
                }
            }
        }
    }

    isValidMove(fromRow, fromCol, toRow, toCol) {
        const piece = this.board[fromRow][fromCol];
        const targetSquare = this.board[toRow][toCol];

        // Can't move to a square with own piece
        if (targetSquare && targetSquare.color === piece.color) {
            return false;
        }

        const rowDiff = Math.abs(toRow - fromRow);
        const colDiff = Math.abs(toCol - fromCol);

        switch (piece.type) {
            case 'pawn':
                return this.isValidPawnMove(fromRow, fromCol, toRow, toCol);
            case 'rook':
                return this.isValidRookMove(fromRow, fromCol, toRow, toCol);
            case 'knight':
                return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);
            case 'bishop':
                return this.isValidBishopMove(fromRow, fromCol, toRow, toCol);
            case 'queen':
                return this.isValidRookMove(fromRow, fromCol, toRow, toCol) ||
                       this.isValidBishopMove(fromRow, fromCol, toRow, toCol);
            case 'king':
                return rowDiff <= 1 && colDiff <= 1;
            default:
                return false;
        }
    }

    isValidPawnMove(fromRow, fromCol, toRow, toCol) {
        const piece = this.board[fromRow][fromCol];
        const direction = piece.color === 'white' ? -1 : 1;
        const startRow = piece.color === 'white' ? 6 : 1;
        const targetSquare = this.board[toRow][toCol];

        // Forward movement
        if (fromCol === toCol && !targetSquare) {
            if (toRow === fromRow + direction) return true;
            if (fromRow === startRow && toRow === fromRow + 2 * direction && !this.board[fromRow + direction][fromCol]) {
                return true;
            }
        }

        // Capture
        if (Math.abs(toCol - fromCol) === 1 && toRow === fromRow + direction) {
            return targetSquare && targetSquare.color !== piece.color;
        }

        return false;
    }

    isValidRookMove(fromRow, fromCol, toRow, toCol) {
        if (fromRow !== toRow && fromCol !== toCol) return false;
        return this.isPathClear(fromRow, fromCol, toRow, toCol);
    }

    isValidBishopMove(fromRow, fromCol, toRow, toCol) {
        if (Math.abs(toRow - fromRow) !== Math.abs(toCol - fromCol)) return false;
        return this.isPathClear(fromRow, fromCol, toRow, toCol);
    }

    isPathClear(fromRow, fromCol, toRow, toCol) {
        const rowStep = fromRow === toRow ? 0 : (toRow - fromRow) / Math.abs(toRow - fromRow);
        const colStep = fromCol === toCol ? 0 : (toCol - fromCol) / Math.abs(toCol - fromCol);

        let currentRow = fromRow + rowStep;
        let currentCol = fromCol + colStep;

        while (currentRow !== toRow || currentCol !== toCol) {
            if (this.board[currentRow][currentCol]) return false;
            currentRow += rowStep;
            currentCol += colStep;
        }

        return true;
    }

    makeMove(fromRow, fromCol, toRow, toCol) {
        const piece = this.board[fromRow][fromCol];
        const capturedPiece = this.board[toRow][toCol];

        // Record move
        const move = {
            from: { row: fromRow, col: fromCol },
            to: { row: toRow, col: toCol },
            piece: { ...piece },
            captured: capturedPiece ? { ...capturedPiece } : null
        };
        this.moveHistory.push(move);

        // Handle capture
        if (capturedPiece) {
            this.capturedPieces[capturedPiece.color].push(capturedPiece);
            this.updateCapturedPieces();
        }

        // Move piece
        this.board[toRow][toCol] = piece;
        this.board[fromRow][fromCol] = null;

        // Add move to history display
        this.addMoveToHistory(fromRow, fromCol, toRow, toCol, piece, capturedPiece);

        // Check for pawn promotion
        if (piece.type === 'pawn' && (toRow === 0 || toRow === 7)) {
            this.promotePawn(toRow, toCol);
        }

        // Switch turns
        this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
        this.updateTurnIndicator();

        // Enable undo button
        document.getElementById('undo-move').disabled = false;

        // Check for checkmate or stalemate
        if (this.isCheckmate()) {
            this.endGame(`Checkmate! ${piece.color.charAt(0).toUpperCase() + piece.color.slice(1)} wins!`);
        } else if (this.isStalemate()) {
            this.endGame('Stalemate! The game is a draw.');
        }

        // Render the updated board
        this.renderBoard();
    }

    promotePawn(row, col) {
        const piece = this.board[row][col];
        piece.type = 'queen'; // Automatically promote to queen for simplicity
    }

    addMoveToHistory(fromRow, fromCol, toRow, toCol, piece, captured) {
        const moveNumber = Math.floor(this.moveHistory.length / 2) + 1;
        const from = `${String.fromCharCode(97 + fromCol)}${8 - fromRow}`;
        const to = `${String.fromCharCode(97 + toCol)}${8 - toRow}`;
        const captureText = captured ? ' x ' : ' - ';
        const moveText = `${piece.type.charAt(0).toUpperCase()}${from}${captureText}${to}`;

        const moveItem = document.createElement('li');
        moveItem.className = 'move-item';
        moveItem.textContent = `${moveNumber}. ${moveText}`;
        this.moveList.appendChild(moveItem);
        this.moveList.scrollTop = this.moveList.scrollHeight;
    }

    updateCapturedPieces() {
        this.capturedWhite.innerHTML = '';
        this.capturedBlack.innerHTML = '';

        this.capturedPieces.white.forEach(piece => {
            const pieceElement = document.createElement('span');
            pieceElement.className = 'captured-piece';
            pieceElement.textContent = this.pieces.white[piece.type];
            this.capturedWhite.appendChild(pieceElement);
        });

        this.capturedPieces.black.forEach(piece => {
            const pieceElement = document.createElement('span');
            pieceElement.className = 'captured-piece';
            pieceElement.textContent = this.pieces.black[piece.type];
            this.capturedBlack.appendChild(pieceElement);
        });
    }

    updateTurnIndicator() {
        this.turnIndicator.textContent = `${this.currentPlayer.charAt(0).toUpperCase() + this.currentPlayer.slice(1)}'s Turn`;
    }

    getSquareElement(row, col) {
        return this.chessboard.children[row * 8 + col];
    }

    undoMove() {
        if (this.moveHistory.length === 0) return;

        const lastMove = this.moveHistory.pop();
        const { from, to, piece, captured } = lastMove;

        // Restore pieces
        this.board[from.row][from.col] = piece;
        this.board[to.row][to.col] = captured;

        // Remove from captured pieces if necessary
        if (captured) {
            const index = this.capturedPieces[captured.color].findIndex(p => 
                p.type === captured.type && p.color === captured.color
            );
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
        this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
        this.updateTurnIndicator();

        // Disable undo button if no more moves
        document.getElementById('undo-move').disabled = this.moveHistory.length === 0;

        // Render the updated board
        this.renderBoard();
    }

    resign() {
        const winner = this.currentPlayer === 'white' ? 'Black' : 'White';
        this.endGame(`${winner} wins by resignation!`);
    }

    endGame(message) {
        this.gameOver = true;
        this.modalTitle.textContent = 'Game Over';
        this.modalMessage.textContent = message;
        this.modal.style.display = 'flex';
    }

    resetGame() {
        this.board = this.createInitialBoard();
        this.currentPlayer = 'white';
        this.selectedPiece = null;
        this.moveHistory = [];
        this.capturedPieces = { white: [], black: [] };
        this.gameOver = false;

        this.moveList.innerHTML = '';
        this.updateCapturedPieces();
        this.updateTurnIndicator();
        document.getElementById('undo-move').disabled = true;
        this.renderBoard();
    }

    isCheckmate() {
        // Simplified check for demo purposes
        return false;
    }

    isStalemate() {
        // Simplified check for demo purposes
        return false;
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ChessGame();
}); 