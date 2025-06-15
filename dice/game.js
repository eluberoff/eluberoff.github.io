"use strict";

class Game {
    constructor() {
        this.grid = Array(5).fill(null).map(() => Array(5).fill(0));
        this.dice = [];
        this.initialDice = []; // Store original configuration for reset
        this.gameState = {
            selectedDie: null,
            movesRemaining: 0,
            dragging: false,
            transientTile: null, // Tracks the moving tile's current position without modifying original dice
            inputMethod: null, // 'keyboard' or 'pointer' - tracks how current move was initiated
            delayGameOverCheck: false // Delay game over overlay until animations complete
        };
        this.gameContainer = document.getElementById('gameContent');
        this.init();
    }
    init() {
        // Check if there's a shared puzzle in URL
        if (!this.loadFromUrl()) {
            // No shared puzzle, generate random one
            this.placeDice();
        }
        this.render();
        this.setupEventListeners();
    }
    getRandomDiceValue() {
        return Math.floor(Math.random() * 6) + 1;
    }
    getInnerPositions() {
        const positions = [];
        for (let row = 1; row <= 3; row++) {
            for (let col = 1; col <= 3; col++) {
                positions.push(row * 5 + col);
            }
        }
        return positions;
    }
    placeDice() {
        const innerPositions = this.getInnerPositions();
        const selectedPositions = [];
        // Select 6 random positions from the inner 3x3 area
        while (selectedPositions.length < 6) {
            const randomIndex = Math.floor(Math.random() * innerPositions.length);
            const position = innerPositions[randomIndex];
            if (!selectedPositions.includes(position)) {
                selectedPositions.push(position);
            }
        }
        // Create dice with random values
        this.dice = selectedPositions.map((position, index) => ({
            value: this.getRandomDiceValue(),
            position: position,
            id: `dice-${index}`
        }));
        // Store initial configuration for reset
        this.initialDice = this.dice.map(dice => ({ ...dice }));
    }
    isInnerCell(row, col) {
        return row >= 1 && row <= 3 && col >= 1 && col <= 3;
    }
    getDiceAtPosition(position) {
        return this.dice.find(dice => dice.position === position);
    }
    render() {
        let statusHTML = `<div id="gameStatus">${this.getStatusMessage()}</div>`;
        let gridHTML = '<div id="grid">';
        
        // Get valid moves for current transient tile
        const validMoves = this.gameState.transientTile && this.gameState.movesRemaining > 0 
            ? this.getValidMoves(this.gameState.transientTile.position, this.gameState.movesRemaining) 
            : [];
        
        for (let row = 0; row < 5; row++) {
            for (let col = 0; col < 5; col++) {
                const position = row * 5 + col;
                const isInner = this.isInnerCell(row, col);
                const dice = this.getDiceAtPosition(position);
                let cellClasses = ['cell'];
                
                if (isInner) cellClasses.push('inner');
                
                // Add visual indicators for game state
                if (this.gameState.selectedDie && position === this.gameState.selectedDie.position) {
                    cellClasses.push('current-position');
                }
                
                // Show valid move indicators for empty squares
                if (validMoves.includes(position) && !dice) {
                    cellClasses.push('valid-move');
                }
                
                let cellContent = '';
                
                // Show transient tile if it's at this position
                if (this.gameState.transientTile && this.gameState.transientTile.position === position) {
                    const isSelected = this.gameState.selectedDie?.id === this.gameState.transientTile.originalDiceId;
                    const classes = ['dice'];
                    if (isSelected) classes.push('selected');
                    cellContent = `<div class="${classes.join(' ')}" data-dice-id="${this.gameState.transientTile.originalDiceId}" tabindex="0">${this.gameState.transientTile.value}</div>`;
                } 
                // Show original dice if no transient tile is here
                else if (dice) {
                    // Don't show the original dice if the transient tile has moved away from it
                    const isOriginalPosition = !this.gameState.transientTile || 
                        this.gameState.transientTile.originalDiceId !== dice.id ||
                        this.gameState.transientTile.position === dice.position;
                    
                    if (isOriginalPosition) {
                        const isSelected = this.gameState.selectedDie?.id === dice.id;
                        const classes = ['dice'];
                        if (isSelected) classes.push('selected');
                        cellContent = `<div class="${classes.join(' ')}" data-dice-id="${dice.id}" tabindex="0">${dice.value}</div>`;
                    }
                }
                
                // Add shadow dice at start position if dice is moving
                if (this.gameState.selectedDie &&
                    this.gameState.selectedDie.position === position &&
                    this.gameState.transientTile &&
                    this.gameState.transientTile.position !== position &&
                    this.gameState.movesRemaining < this.gameState.selectedDie.value) {
                    cellContent += `<div class="dice shadow">${this.gameState.selectedDie.value}</div>`;
                }
                
                gridHTML += `<div class="${cellClasses.join(' ')}" data-position="${position}">${cellContent}</div>`;
            }
        }
        // Add game over overlay (always present but hidden initially)
        const isGameOverState = this.isGameOver() && !this.gameState.delayGameOverCheck;
        if (isGameOverState) {
            const finalScore = this.getFinalScore();
            const finalDiceHTML = this.dice.map(dice => 
                `<div class="final-dice">${dice.value}</div>`
            ).join('');
            
            gridHTML += `
                <div id="gameOverOverlay">
                    <div class="game-over-score">Your score: ${finalScore}</div>
                    <div class="final-dice-container">${finalDiceHTML}</div>
                </div>
            `;
        }
        
        gridHTML += '</div>';
        
        // Always show buttons
        const buttonsHTML = `
            <div class="button-container">
                <button id="resetButton" class="game-btn reset-btn">Reset</button>
                <button id="newGameButton" class="game-btn new-game-btn">New</button>
                <button id="shareButton" class="game-btn share-btn">Share</button>
            </div>
        `;
        this.gameContainer.innerHTML = statusHTML + gridHTML + buttonsHTML;
        this.attachSquareListeners();
        this.attachButtonListeners();
        this.cleanupAnimationClasses();
        
        // Animate game over overlay if game is over
        if (isGameOverState) {
            setTimeout(() => {
                const overlay = document.getElementById('gameOverOverlay');
                if (overlay) {
                    overlay.classList.add('show');
                }
            }, 100); // Quick delay to let the final state be visible first
        }
    }
    attachButtonListeners() {
        const resetButton = document.getElementById('resetButton');
        const newGameButton = document.getElementById('newGameButton');
        const shareButton = document.getElementById('shareButton');
        if (resetButton) {
            resetButton.addEventListener('click', () => {
                this.resetToInitialState();
            });
        }
        if (newGameButton) {
            newGameButton.addEventListener('click', () => {
                this.startNewGame();
            });
        }
        if (shareButton) {
            shareButton.addEventListener('click', () => {
                this.sharePuzzle();
            });
        }
    }
    resetToInitialState() {
        // Reset dice to initial configuration
        this.dice = this.initialDice.map(dice => ({ ...dice }));
        // Reset game state
        this.gameState.selectedDie = null;
        this.gameState.movesRemaining = 0;
        this.gameState.dragging = false;
        this.gameState.transientTile = null;
        this.gameState.inputMethod = null;
        this.gameState.delayGameOverCheck = false;
        this.render();
    }
    startNewGame() {
        // Generate completely new dice configuration
        this.placeDice();
        // Reset game state
        this.gameState.selectedDie = null;
        this.gameState.movesRemaining = 0;
        this.gameState.dragging = false;
        this.gameState.transientTile = null;
        this.gameState.inputMethod = null;
        this.gameState.delayGameOverCheck = false;
        // Clear URL parameters for new game
        this.clearUrlParameters();
        this.render();
    }
    sharePuzzle() {
        const puzzleState = this.encodePuzzleState();
        const url = new URL(window.location.href);
        url.searchParams.set('puzzle', puzzleState);
        // Update URL without reloading page
        window.history.replaceState({}, '', url.toString());
        // Try multiple methods to copy to clipboard
        this.copyToClipboard(url.toString());
    }
    async copyToClipboard(text) {
        try {
            // Method 1: Modern clipboard API
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
                this.showShareFeedback('Puzzle URL copied to clipboard!');
                return;
            }
        }
        catch (err) {
            console.log('Clipboard API failed:', err);
        }
        try {
            // Method 2: Legacy execCommand method
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);
            if (successful) {
                this.showShareFeedback('Puzzle URL copied to clipboard!');
                return;
            }
        }
        catch (err) {
            console.log('execCommand failed:', err);
        }
        // Fallback: Just show the URL update message
        this.showShareFeedback('Puzzle URL updated. Copy from address bar.');
    }
    showShareFeedback(message) {
        const statusEl = document.getElementById('gameStatus');
        if (statusEl) {
            const originalText = statusEl.textContent;
            statusEl.textContent = message;
            statusEl.style.color = '#4caf50';
            setTimeout(() => {
                statusEl.textContent = originalText || '';
                statusEl.style.color = '';
            }, 2000);
        }
    }
    encodePuzzleState() {
        // Encode the initial dice configuration as a compact string
        const positions = this.initialDice.map(d => d.position);
        const values = this.initialDice.map(d => d.value);
        // Create a compact representation: positions and values as base64
        const positionsStr = positions.join(',');
        const valuesStr = values.join(',');
        const combined = `${positionsStr}|${valuesStr}`;
        return btoa(combined);
    }
    decodePuzzleState(encoded) {
        try {
            const decoded = atob(encoded);
            const [positionsStr, valuesStr] = decoded.split('|');
            const positions = positionsStr.split(',').map(p => parseInt(p));
            const values = valuesStr.split(',').map(v => parseInt(v));
            // Validate data
            if (positions.length !== values.length ||
                positions.some(p => isNaN(p) || p < 0 || p >= 25) ||
                values.some(v => isNaN(v) || v < 1 || v > 6)) {
                return null;
            }
            return { positions, values };
        }
        catch {
            return null;
        }
    }
    clearUrlParameters() {
        const url = new URL(window.location.href);
        url.searchParams.delete('puzzle');
        window.history.replaceState({}, '', url.toString());
    }
    loadFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        const puzzleParam = urlParams.get('puzzle');
        if (!puzzleParam) {
            return false;
        }
        const puzzleData = this.decodePuzzleState(puzzleParam);
        if (!puzzleData) {
            // Invalid puzzle data, clear the parameter
            this.clearUrlParameters();
            return false;
        }
        // Create dice from decoded data
        this.dice = puzzleData.positions.map((position, index) => ({
            value: puzzleData.values[index],
            position: position,
            id: `dice-${index}`
        }));
        // Store initial configuration for reset
        this.initialDice = this.dice.map(dice => ({ ...dice }));
        return true;
    }
    cleanupAnimationClasses() {
        // Remove any leftover animation classes from all dice
        // Note: Don't remove 'spinning' here as it's managed by animateReplacement
        const allDice = document.querySelectorAll('.dice');
        allDice.forEach(dice => {
            dice.classList.remove('destroying', 'bouncing');
        });
    }
    getStatusMessage() {
        // Don't check game over while a dice is actively moving
        if (this.gameState.selectedDie && this.gameState.movesRemaining < this.gameState.selectedDie.value) {
            return `Moves remaining: ${this.gameState.movesRemaining}`;
        }
        // Only check game over in stable states (no dice selected or dice selected but no moves made)
        if (this.isGameOver()) {
            const finalScore = this.getFinalScore();
            return `Game Over! Final Score: ${finalScore}`;
        }
        if (this.gameState.selectedDie) {
            return `Moves remaining: ${this.gameState.movesRemaining}`;
        }
        return 'Click a die to start!';
    }
    setupEventListeners() {
        // Add keyboard listeners
        document.addEventListener('keydown', (e) => {
            // Handle Tab for dice cycling
            if (e.key === 'Tab') {
                e.preventDefault();
                this.cycleThroughDice();
                return;
            }
            if (e.key === 'Escape' && this.gameState.selectedDie) {
                // Reset all game state (die is already at start position)
                this.gameState.selectedDie = null;
                this.gameState.movesRemaining = 0;
                this.gameState.transientTile = null;
        this.gameState.inputMethod = null;
        this.gameState.delayGameOverCheck = false;
                this.render();
                return;
            }
            if (this.gameState.selectedDie && this.gameState.movesRemaining > 0) {
                let direction = null;
                switch (e.key) {
                    case 'ArrowUp':
                        direction = [-1, 0];
                        break;
                    case 'ArrowDown':
                        direction = [1, 0];
                        break;
                    case 'ArrowLeft':
                        direction = [0, -1];
                        break;
                    case 'ArrowRight':
                        direction = [0, 1];
                        break;
                }
                if (direction) {
                    e.preventDefault();
                    this.gameState.inputMethod = 'keyboard';
                    this.moveOneStep(direction);
                }
            }
        });
    }
    cycleThroughDice() {
        // Don't allow tab cycling if game is over
        if (this.isGameOver()) {
            return;
        }
        // Only allow tab cycling if no moves have been made with current dice
        if (this.gameState.selectedDie && this.gameState.movesRemaining < this.gameState.selectedDie.value) {
            return; // Dice has already moved
        }
        // Sort dice by ID for consistent ordering
        const sortedDice = [...this.dice].sort((a, b) => a.id.localeCompare(b.id));
        if (sortedDice.length === 0)
            return;
        let nextIndex = 0;
        if (this.gameState.selectedDie) {
            const currentIndex = sortedDice.findIndex(d => d.id === this.gameState.selectedDie.id);
            nextIndex = (currentIndex + 1) % sortedDice.length;
        }
        const nextDice = sortedDice[nextIndex];
        this.selectDice(nextDice.id);
    }
    attachSquareListeners() {
        const squares = document.querySelectorAll('.cell');
        squares.forEach(square => {
            // Attach unified interaction handler to each square
            this.attachInteractionHandler(square);
        });
        
        // Attach accessibility listeners to dice
        const diceElements = document.querySelectorAll('.dice');
        diceElements.forEach(diceEl => {
            diceEl.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    const diceId = diceEl.dataset.diceId;
                    if (diceId) {
                        this.selectDice(diceId);
                    }
                }
            });
        });
    }
    
    attachInteractionHandler(element) {
        let startX, startY;
        let isDragging = false;
        let moveHandler;
        let endHandler;
        
        const handleStart = (e) => {
            if (this.isGameOver() || this.gameState.dragging) {
                return;
            }
            
            e.preventDefault();
            e.stopPropagation();
            
            const position = parseInt(element.dataset.position);
            if (isNaN(position)) {
                return;
            }
            
            // Priority 1: Check for capture attempt (final move landing on adjacent dice)
            if (this.gameState.transientTile && this.gameState.movesRemaining === 1) {
                const targetDice = this.getDiceAtPosition(position);
                if (targetDice && targetDice.id !== this.gameState.selectedDie?.id) {
                    // Check if this is an adjacent move before attempting capture
                    const currentPosition = this.gameState.transientTile.position;
                    const [currentRow, currentCol] = this.positionToRowCol(currentPosition);
                    const [targetRow, targetCol] = this.positionToRowCol(position);
                    const rowDiff = targetRow - currentRow;
                    const colDiff = targetCol - currentCol;
                    const distance = Math.abs(rowDiff) + Math.abs(colDiff);
                    
                    if (distance === 1) {
                        // This is a valid adjacent capture attempt
                        this.gameState.inputMethod = 'pointer';
                        if (this.moveToPosition(position)) {
                            return; // Successful capture move, no need for drag setup
                        }
                    }
                }
            }
            
            // Priority 2: Check for valid move to empty square
            if (this.gameState.transientTile && this.gameState.movesRemaining > 0) {
                const diceAtPosition = this.getDiceAtPosition(position);
                if (!diceAtPosition) {
                    // Empty square - try to move there
                    this.gameState.inputMethod = 'pointer';
                    if (this.moveToPosition(position)) {
                        return; // Successful move, no need for drag setup
                    }
                }
            }
            
            // Priority 3: Check for dice selection
            const diceAtPosition = this.getDiceAtPosition(position);
            if (diceAtPosition) {
                this.selectDice(diceAtPosition.id);
                // Continue with drag setup in case user wants to drag
            } else {
                // Clicked on empty space with no valid action, do nothing
                return;
            }
            
            if (e instanceof TouchEvent) {
                if (e.touches.length > 0) {
                    startX = e.touches[0].clientX;
                    startY = e.touches[0].clientY;
                }
            } else {
                startX = e.clientX;
                startY = e.clientY;
            }
            
            isDragging = false;
            
            // Create move handler for this drag session
            moveHandler = (e) => {
                if (!this.gameState.transientTile || this.gameState.movesRemaining <= 0) return;
                
                e.preventDefault();
                e.stopPropagation();
                
                let currentX, currentY;
                if (e instanceof TouchEvent) {
                    if (e.touches.length > 0) {
                        currentX = e.touches[0].clientX;
                        currentY = e.touches[0].clientY;
                    } else {
                        return; // No touches, exit
                    }
                } else {
                    currentX = e.clientX;
                    currentY = e.clientY;
                }
                
                const deltaX = currentX - startX;
                const deltaY = currentY - startY;
                const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
                
                // Start dragging if moved enough (smaller threshold for mobile)
                if (!isDragging && distance > 5) {
                    isDragging = true;
                    this.gameState.dragging = true;
                }
                
                if (isDragging) {
                    // Find which cell the touch/mouse is currently over
                    const elementAtPoint = document.elementFromPoint(currentX, currentY);
                    if (elementAtPoint) {
                        const cell = elementAtPoint.closest('.cell');
                        if (cell && cell.dataset.position) {
                            const targetPosition = parseInt(cell.dataset.position);
                            if (!isNaN(targetPosition)) {
                                // Use the same logic as click-to-move
                                this.gameState.inputMethod = 'pointer';
                                this.moveToPosition(targetPosition);
                            }
                        }
                    }
                }
            };
            
            // Create end handler for this drag session
            endHandler = () => {
                // Reset if we were dragging and stopped with moves remaining
                if (isDragging && this.gameState.movesRemaining > 0 && this.gameState.selectedDie) {
                    // Clear selection and transient tile
                    this.gameState.selectedDie = null;
                    this.gameState.movesRemaining = 0;
                    this.gameState.transientTile = null;
        this.gameState.inputMethod = null;
        this.gameState.delayGameOverCheck = false;
                    this.render();
                }
                
                if (isDragging) {
                    this.gameState.dragging = false;
                    isDragging = false;
                }
                
                // Remove listeners when drag ends
                document.removeEventListener('mousemove', moveHandler);
                document.removeEventListener('mouseup', endHandler);
                document.removeEventListener('touchmove', moveHandler);
                document.removeEventListener('touchend', endHandler);
                if ('PointerEvent' in window) {
                    document.removeEventListener('pointermove', moveHandler);
                    document.removeEventListener('pointerup', endHandler);
                }
            };
            
            // Add listeners only during drag session
            document.addEventListener('mousemove', moveHandler);
            document.addEventListener('mouseup', endHandler);
            document.addEventListener('touchmove', moveHandler, { passive: false });
            document.addEventListener('touchend', endHandler);
            if ('PointerEvent' in window) {
                document.addEventListener('pointermove', moveHandler, { passive: false });
                document.addEventListener('pointerup', endHandler);
            }
        };
        
        // Attach start events to the element
        element.addEventListener('mousedown', handleStart);
        element.addEventListener('touchstart', handleStart, { passive: false });
        // Also add pointer events for better mobile support
        if ('PointerEvent' in window) {
            element.addEventListener('pointerdown', handleStart);
        }
    }
    selectDice(diceId) {
        // Don't allow selection if game is over
        if (this.isGameOver()) {
            return;
        }
        if (this.gameState.selectedDie) {
            // Deselect current dice
            this.gameState.selectedDie = null;
            this.gameState.movesRemaining = 0;
            this.gameState.transientTile = null;
        this.gameState.inputMethod = null;
        this.gameState.delayGameOverCheck = false;
        }
        const dice = this.dice.find(d => d.id === diceId);
        if (dice) {
            this.gameState.selectedDie = dice;
            this.gameState.movesRemaining = dice.value;
            // Initialize transient tile at dice's current position
            this.gameState.transientTile = {
                position: dice.position,
                value: dice.value,
                originalDiceId: dice.id
            };
        }
        this.render();
    }
    
    getValidMoves(fromPosition, movesRemaining) {
        const validMoves = [];
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]]; // up, down, left, right
        
        for (const direction of directions) {
            const isLastMove = movesRemaining === 1;
            if (this.canMoveInDirection(fromPosition, direction, isLastMove)) {
                const [currentRow, currentCol] = this.positionToRowCol(fromPosition);
                const [deltaRow, deltaCol] = direction;
                const newRow = currentRow + deltaRow;
                const newCol = currentCol + deltaCol;
                const newPosition = this.rowColToPosition(newRow, newCol);
                validMoves.push(newPosition);
            }
        }
        
        return validMoves;
    }
    positionToRowCol(position) {
        return [Math.floor(position / 5), position % 5];
    }
    rowColToPosition(row, col) {
        return row * 5 + col;
    }
    getTaxicabDistance(pos1, pos2) {
        const [row1, col1] = this.positionToRowCol(pos1);
        const [row2, col2] = this.positionToRowCol(pos2);
        return Math.abs(row1 - row2) + Math.abs(col1 - col2);
    }
    canDiceReachDice(fromDice, toDice) {
        const distance = this.getTaxicabDistance(fromDice.position, toDice.position);
        const moves = fromDice.value;
        // Can reach if distance <= moves and same parity
        // Same parity means both odd or both even
        return distance <= moves && (distance % 2 === moves % 2);
    }
    isGameOver() {
        // Only check when 3 or fewer dice remain
        if (this.dice.length > 3) {
            return false;
        }
        // Check if any dice can reach any other dice
        for (let i = 0; i < this.dice.length; i++) {
            for (let j = 0; j < this.dice.length; j++) {
                if (i !== j && this.canDiceReachDice(this.dice[i], this.dice[j])) {
                    return false; // Found a possible move
                }
            }
        }
        return true; // No dice can reach any other dice
    }
    getFinalScore() {
        return this.dice.reduce((sum, dice) => sum + dice.value, 0);
    }
    canMoveInDirection(currentPosition, direction, isLastMove = false) {
        const [currentRow, currentCol] = this.positionToRowCol(currentPosition);
        const [deltaRow, deltaCol] = direction;
        const newRow = currentRow + deltaRow;
        const newCol = currentCol + deltaCol;
        // Check bounds
        if (newRow < 0 || newRow >= 5 || newCol < 0 || newCol >= 5) {
            return false;
        }
        const newPosition = this.rowColToPosition(newRow, newCol);
        const diceAtPosition = this.getDiceAtPosition(newPosition);
        // If it's the last move, allow landing on another dice for collision
        // Otherwise, can't move to a position with another dice
        if (isLastMove) {
            return true; // Allow landing on another dice on the final move
        }
        else {
            return !diceAtPosition; // Can't pass through another dice
        }
    }
    moveOneStep(direction) {
        if (!this.gameState.transientTile || this.gameState.movesRemaining <= 0)
            return;
        const currentPosition = this.gameState.transientTile.position;
        const isLastMove = this.gameState.movesRemaining === 1;
        if (!this.canMoveInDirection(currentPosition, direction, isLastMove)) {
            return; // Invalid move
        }
        const [currentRow, currentCol] = this.positionToRowCol(currentPosition);
        const [deltaRow, deltaCol] = direction;
        const newRow = currentRow + deltaRow;
        const newCol = currentCol + deltaCol;
        const newPosition = this.rowColToPosition(newRow, newCol);
        
        // Move the transient tile
        this.gameState.transientTile.position = newPosition;
        this.gameState.movesRemaining--;
        
        // Check if we've used all moves
        if (this.gameState.movesRemaining === 0) {
            this.finalizeTileMovement();
        }
        else {
            // Still have moves left, just update the display
            this.render();
        }
    }
    
    finalizeTileMovement() {
        if (!this.gameState.transientTile || !this.gameState.selectedDie) {
            return;
        }
        
        const finalPosition = this.gameState.transientTile.position;
        const movingDice = this.gameState.selectedDie;
        
        // Check if landed on another dice
        const targetDice = this.dice.find(d => d.position === finalPosition && d.id !== movingDice.id);
        
        if (targetDice) {
            // Handle collision at final position (don't modify die position yet)
            this.handleDiceCollision(movingDice, targetDice, finalPosition);
        }
        else {
            // No collision, return to start after brief pause
            this.render(); // Show final position first
            setTimeout(() => {
                this.returnToStart();
            }, 300);
        }
    }
    handleDiceCollision(movingDice, targetDice, finalPosition) {
        // Delay game over check until animations complete
        this.gameState.delayGameOverCheck = true;
        
        // First render to show the collision
        this.render();
        if (movingDice.value === targetDice.value) {
            // Same values: animate destruction then remove both
            this.animateDestruction(movingDice, targetDice);
        }
        else {
            // Different values: animate pop then replace with difference
            this.animateReplacement(movingDice, targetDice);
        }
    }
    animateDestruction(movingDice, targetDice) {
        // Add destroying animation to both dice
        const movingElement = document.querySelector(`[data-dice-id="${movingDice.id}"]`);
        const targetElement = document.querySelector(`[data-dice-id="${targetDice.id}"]`);
        
        if (movingElement) {
            movingElement.classList.add('destroying');
        }
        if (targetElement) {
            targetElement.classList.add('destroying');
        }
        
        // Wait for animation to complete before removing dice
        setTimeout(() => {
            this.dice = this.dice.filter(d => d.id !== movingDice.id && d.id !== targetDice.id);
            // Reset game state
            this.gameState.selectedDie = null;
            this.gameState.movesRemaining = 0;
            this.gameState.transientTile = null;
            this.gameState.inputMethod = null;
        this.gameState.delayGameOverCheck = false;
            this.gameState.delayGameOverCheck = false; // Allow game over check now
            this.render();
        }, 800); // Match the CSS animation duration
    }
    animateReplacement(movingDice, targetDice) {
        const difference = Math.abs(movingDice.value - targetDice.value);
        if (difference === 0) {
            // If difference is 0, treat as destruction
            this.animateDestruction(movingDice, targetDice);
            return;
        }
        // Update the value and remove moving dice immediately
        targetDice.value = difference;
        this.dice = this.dice.filter(d => d.id !== movingDice.id);
        
        // Clear transient tile so target dice renders properly
        this.gameState.transientTile = null;
        this.render(); // Show the new value first
        
        // Then animate the value change with a delightful spin
        // Use requestAnimationFrame to ensure DOM is ready
        requestAnimationFrame(() => {
            const targetElement = document.querySelector(`[data-dice-id="${targetDice.id}"]`);
            if (targetElement) {
                targetElement.classList.add('spinning');
            }
        });
        
        // Wait for animation to complete, then finalize state
        setTimeout(() => {
            // Remove the spinning class
            const targetElement = document.querySelector(`[data-dice-id="${targetDice.id}"]`);
            if (targetElement) {
                targetElement.classList.remove('spinning');
            }
            
            // Auto-select the new dice only if game is not over AND we used keyboard
            if (!this.isGameOver() && this.gameState.inputMethod === 'keyboard') {
                this.gameState.selectedDie = targetDice;
                this.gameState.movesRemaining = targetDice.value;
                this.gameState.transientTile = {
                    position: targetDice.position,
                    value: targetDice.value,
                    originalDiceId: targetDice.id
                };
            }
            else {
                this.gameState.selectedDie = null;
                this.gameState.movesRemaining = 0;
                this.gameState.transientTile = null;
                this.gameState.inputMethod = null;
        this.gameState.delayGameOverCheck = false;
            }
            
            // Clear input method after move completion
            this.gameState.inputMethod = null;
        this.gameState.delayGameOverCheck = false;
            this.gameState.delayGameOverCheck = false; // Allow game over check now
            this.render();
        }, 400); // Match the CSS animation duration
    }
    moveToPosition(targetPosition) {
        if (!this.gameState.transientTile || this.gameState.movesRemaining <= 0) {
            return false;
        }
        
        const currentPosition = this.gameState.transientTile.position;
        const [currentRow, currentCol] = this.positionToRowCol(currentPosition);
        const [targetRow, targetCol] = this.positionToRowCol(targetPosition);
        
        const rowDiff = targetRow - currentRow;
        const colDiff = targetCol - currentCol;
        const distance = Math.abs(rowDiff) + Math.abs(colDiff);
        
        // Check if target is adjacent (1 step away)
        if (distance !== 1) {
            return false;
        }
        
        const direction = [
            rowDiff === 0 ? 0 : (rowDiff > 0 ? 1 : -1),
            colDiff === 0 ? 0 : (colDiff > 0 ? 1 : -1)
        ];
        
        this.moveOneStep(direction);
        return true;
    }
    
    returnToStart() {
        if (!this.gameState.selectedDie)
            return;
        const returningDice = this.gameState.selectedDie;
        const startPos = this.gameState.selectedDie.position;
        // Use requestAnimationFrame to ensure DOM is ready
        requestAnimationFrame(() => {
            const currentDiceEl = document.querySelector(`[data-dice-id="${returningDice.id}"]`);
            if (currentDiceEl) {
                // Clean up any existing animation classes first
                currentDiceEl.classList.remove('destroying', 'bouncing');
                // Force reflow to ensure class removal takes effect
                currentDiceEl.offsetHeight;
                currentDiceEl.classList.add('bouncing');
            }
            // Wait for bounce animation, then reselect (die is already at start position)
            setTimeout(() => {
                this.gameState.selectedDie = returningDice;
                this.gameState.movesRemaining = returningDice.value;
                this.gameState.transientTile = {
                    position: startPos,
                    value: returningDice.value,
                    originalDiceId: returningDice.id
                };
                this.render();
            }, 300); // Match faster animation duration
        });
    }
}
// Start the game when the page loads
window.addEventListener('DOMContentLoaded', () => {
    new Game();
});
