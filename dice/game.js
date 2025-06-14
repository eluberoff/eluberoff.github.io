"use strict";
class Game {
    constructor() {
        this.grid = Array(5).fill(null).map(() => Array(5).fill(0));
        this.dice = [];
        this.initialDice = []; // Store original configuration for reset
        this.gameState = {
            selectedDice: null,
            movesRemaining: 0,
            startPosition: null,
            animating: false,
            dragging: false,
            dragStartPosition: null
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
        for (let row = 0; row < 5; row++) {
            for (let col = 0; col < 5; col++) {
                const position = row * 5 + col;
                const isInner = this.isInnerCell(row, col);
                const dice = this.getDiceAtPosition(position);
                let cellClasses = ['cell'];
                if (isInner)
                    cellClasses.push('inner');
                // Add visual indicators for game state
                if (this.gameState.selectedDice && position === this.gameState.selectedDice.position) {
                    cellClasses.push('current-position');
                }
                let cellContent = '';
                if (dice) {
                    const isSelected = this.gameState.selectedDice?.id === dice.id;
                    const isGameOver = this.isGameOver();
                    const classes = ['dice'];
                    if (isSelected)
                        classes.push('selected');
                    if (isGameOver)
                        classes.push('game-over');
                    cellContent = `<div class="${classes.join(' ')}" data-dice-id="${dice.id}" tabindex="0">${dice.value}</div>`;
                }
                // Add shadow dice at start position if dice is moving
                if (this.gameState.selectedDice &&
                    this.gameState.startPosition === position &&
                    this.gameState.selectedDice.position !== position &&
                    this.gameState.movesRemaining < this.gameState.selectedDice.value) {
                    cellContent += `<div class="dice shadow">${this.gameState.selectedDice.value}</div>`;
                }
                gridHTML += `<div class="${cellClasses.join(' ')}" data-position="${position}">${cellContent}</div>`;
            }
        }
        gridHTML += '</div>';
        // Always show buttons
        const buttonsHTML = `
            <div class="button-container">
                <button id="resetButton" class="game-btn reset-btn">Reset Game</button>
                <button id="newGameButton" class="game-btn new-game-btn">New Game</button>
                <button id="shareButton" class="game-btn share-btn">Share Puzzle</button>
            </div>
        `;
        this.gameContainer.innerHTML = statusHTML + gridHTML + buttonsHTML;
        this.attachDiceListeners();
        this.attachButtonListeners();
        this.cleanupAnimationClasses();
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
        this.gameState.selectedDice = null;
        this.gameState.movesRemaining = 0;
        this.gameState.startPosition = null;
        this.gameState.animating = false;
        this.gameState.dragging = false;
        this.gameState.dragStartPosition = null;
        this.render();
    }
    startNewGame() {
        // Generate completely new dice configuration
        this.placeDice();
        // Reset game state
        this.gameState.selectedDice = null;
        this.gameState.movesRemaining = 0;
        this.gameState.startPosition = null;
        this.gameState.animating = false;
        this.gameState.dragging = false;
        this.gameState.dragStartPosition = null;
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
        const allDice = document.querySelectorAll('.dice');
        allDice.forEach(dice => {
            dice.classList.remove('destroying', 'bouncing');
        });
    }
    getStatusMessage() {
        // Don't check game over while a dice is actively moving
        if (this.gameState.selectedDice && this.gameState.movesRemaining < this.gameState.selectedDice.value) {
            return `Moves remaining: ${this.gameState.movesRemaining}`;
        }
        // Only check game over in stable states (no dice selected or dice selected but no moves made)
        if (this.isGameOver()) {
            const finalScore = this.getFinalScore();
            return `Game Over! Final Score: ${finalScore}`;
        }
        if (this.gameState.selectedDice) {
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
            if (e.key === 'Escape' && this.gameState.selectedDice) {
                // If no moves have been made, just deselect
                if (this.gameState.movesRemaining === this.gameState.selectedDice.value) {
                    this.gameState.selectedDice = null;
                    this.gameState.movesRemaining = 0;
                    this.gameState.startPosition = null;
                    this.render();
                }
                else {
                    // If moves have been made, return to start
                    this.returnToStart();
                }
                return;
            }
            if (this.gameState.selectedDice && this.gameState.movesRemaining > 0) {
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
        if (this.gameState.selectedDice && this.gameState.movesRemaining < this.gameState.selectedDice.value) {
            return; // Dice has already moved
        }
        // Sort dice by ID for consistent ordering
        const sortedDice = [...this.dice].sort((a, b) => a.id.localeCompare(b.id));
        if (sortedDice.length === 0)
            return;
        let nextIndex = 0;
        if (this.gameState.selectedDice) {
            const currentIndex = sortedDice.findIndex(d => d.id === this.gameState.selectedDice.id);
            nextIndex = (currentIndex + 1) % sortedDice.length;
        }
        const nextDice = sortedDice[nextIndex];
        this.selectDice(nextDice.id);
    }
    attachDiceListeners() {
        const diceElements = document.querySelectorAll('.dice');
        diceElements.forEach(diceEl => {
            const element = diceEl;
            // Handle click events
            element.addEventListener('click', (e) => {
                e.stopPropagation();
                const diceId = element.dataset.diceId;
                if (diceId && !this.gameState.dragging) {
                    // Check if we should move to this dice instead of selecting it
                    if (this.gameState.selectedDice &&
                        this.gameState.movesRemaining === 1 &&
                        this.gameState.selectedDice.id !== diceId) {
                        const targetDice = this.dice.find(d => d.id === diceId);
                        if (targetDice && this.isValidMoveDestination(targetDice.position)) {
                            const currentPosition = this.gameState.selectedDice.position;
                            const [currentRow, currentCol] = this.positionToRowCol(currentPosition);
                            const [targetRow, targetCol] = this.positionToRowCol(targetDice.position);
                            const rowDiff = targetRow - currentRow;
                            const colDiff = targetCol - currentCol;
                            const direction = [
                                rowDiff === 0 ? 0 : (rowDiff > 0 ? 1 : -1),
                                colDiff === 0 ? 0 : (colDiff > 0 ? 1 : -1)
                            ];
                            this.moveOneStep(direction);
                            return;
                        }
                    }
                    this.selectDice(diceId);
                }
            });
            // Handle keyboard events for accessibility
            element.addEventListener('keydown', (e) => {
                const keyEvent = e;
                if (keyEvent.key === 'Enter' || keyEvent.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    const diceId = element.dataset.diceId;
                    if (diceId) {
                        this.selectDice(diceId);
                    }
                }
            });
            // Add drag functionality
            this.attachDragListeners(element);
        });
    }
    attachDragListeners(element) {
        let startX, startY;
        let isDragging = false;
        let moveHandler;
        let endHandler;
        const handleStart = (e) => {
            if (this.isGameOver())
                return;
            const diceId = element.dataset.diceId;
            if (!diceId)
                return;
            // Select the dice first
            this.selectDice(diceId);
            if (e instanceof TouchEvent) {
                startX = e.touches[0].clientX;
                startY = e.touches[0].clientY;
            }
            else {
                startX = e.clientX;
                startY = e.clientY;
            }
            isDragging = false;
            this.gameState.dragStartPosition = this.gameState.selectedDice?.position || null;
            // Create move handler for this drag session
            moveHandler = (e) => {
                if (!this.gameState.selectedDice || this.gameState.movesRemaining <= 0)
                    return;
                let currentX, currentY;
                if (e instanceof TouchEvent) {
                    currentX = e.touches[0].clientX;
                    currentY = e.touches[0].clientY;
                }
                else {
                    currentX = e.clientX;
                    currentY = e.clientY;
                }
                const deltaX = currentX - startX;
                const deltaY = currentY - startY;
                const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
                // Start dragging if moved enough
                if (!isDragging && distance > 10) {
                    isDragging = true;
                    this.gameState.dragging = true;
                }
                if (isDragging) {
                    // Find which cell the mouse is currently over
                    const elementAtPoint = document.elementFromPoint(currentX, currentY);
                    if (elementAtPoint) {
                        const cell = elementAtPoint.closest('.cell');
                        if (cell && cell.dataset.position) {
                            const targetPosition = parseInt(cell.dataset.position);
                            if (!isNaN(targetPosition) && this.isValidMoveDestination(targetPosition)) {
                                const currentPosition = this.gameState.selectedDice.position;
                                const [currentRow, currentCol] = this.positionToRowCol(currentPosition);
                                const [targetRow, targetCol] = this.positionToRowCol(targetPosition);
                                const rowDiff = targetRow - currentRow;
                                const colDiff = targetCol - currentCol;
                                const direction = [
                                    rowDiff === 0 ? 0 : (rowDiff > 0 ? 1 : -1),
                                    colDiff === 0 ? 0 : (colDiff > 0 ? 1 : -1)
                                ];
                                this.moveOneStep(direction);
                            }
                        }
                    }
                }
                e.preventDefault();
            };
            // Create end handler for this drag session
            endHandler = () => {
                if (isDragging) {
                    this.gameState.dragging = false;
                    isDragging = false;
                }
                // Remove listeners when drag ends
                document.removeEventListener('mousemove', moveHandler);
                document.removeEventListener('mouseup', endHandler);
                document.removeEventListener('touchmove', moveHandler);
                document.removeEventListener('touchend', endHandler);
            };
            // Add listeners only during drag session
            document.addEventListener('mousemove', moveHandler);
            document.addEventListener('mouseup', endHandler);
            document.addEventListener('touchmove', moveHandler, { passive: false });
            document.addEventListener('touchend', endHandler);
            e.preventDefault();
        };
        // Only attach start events to the element
        element.addEventListener('mousedown', handleStart);
        element.addEventListener('touchstart', handleStart, { passive: false });
    }
    tryDragMove(direction) {
        if (!this.gameState.selectedDice || this.gameState.movesRemaining <= 0)
            return;
        const currentPosition = this.gameState.selectedDice.position;
        const isLastMove = this.gameState.movesRemaining === 1;
        if (this.canMoveInDirection(currentPosition, direction, isLastMove)) {
            this.moveOneStep(direction);
        }
    }
    isValidMoveDestination(targetPosition) {
        if (!this.gameState.selectedDice || this.gameState.movesRemaining <= 0) {
            return false;
        }
        const currentPosition = this.gameState.selectedDice.position;
        const [currentRow, currentCol] = this.positionToRowCol(currentPosition);
        const [targetRow, targetCol] = this.positionToRowCol(targetPosition);
        // Check if target is adjacent (1 step away)
        const rowDiff = targetRow - currentRow;
        const colDiff = targetCol - currentCol;
        const distance = Math.abs(rowDiff) + Math.abs(colDiff);
        if (distance !== 1) {
            return false; // Not adjacent
        }
        // Check if we can move in this direction
        const direction = [
            rowDiff === 0 ? 0 : (rowDiff > 0 ? 1 : -1),
            colDiff === 0 ? 0 : (colDiff > 0 ? 1 : -1)
        ];
        const isLastMove = this.gameState.movesRemaining === 1;
        return this.canMoveInDirection(currentPosition, direction, isLastMove);
    }
    selectDice(diceId) {
        // Don't allow selection if game is over
        if (this.isGameOver()) {
            return;
        }
        if (this.gameState.selectedDice) {
            // Deselect current dice
            this.gameState.selectedDice = null;
            this.gameState.movesRemaining = 0;
            this.gameState.startPosition = null;
        }
        const dice = this.dice.find(d => d.id === diceId);
        if (dice) {
            this.gameState.selectedDice = dice;
            this.gameState.movesRemaining = dice.value;
            this.gameState.startPosition = dice.position;
        }
        this.render();
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
        if (!this.gameState.selectedDice || this.gameState.movesRemaining <= 0)
            return;
        const currentPosition = this.gameState.selectedDice.position;
        const isLastMove = this.gameState.movesRemaining === 1;
        if (!this.canMoveInDirection(currentPosition, direction, isLastMove)) {
            return; // Invalid move
        }
        const [currentRow, currentCol] = this.positionToRowCol(currentPosition);
        const [deltaRow, deltaCol] = direction;
        const newRow = currentRow + deltaRow;
        const newCol = currentCol + deltaCol;
        const newPosition = this.rowColToPosition(newRow, newCol);
        // Move the dice
        this.gameState.selectedDice.position = newPosition;
        this.gameState.movesRemaining--;
        // Check if we've used all moves
        if (this.gameState.movesRemaining === 0) {
            // Check if landed on another dice
            const targetDice = this.dice.find(d => d.position === newPosition && d.id !== this.gameState.selectedDice.id);
            if (targetDice) {
                this.handleDiceCollision(this.gameState.selectedDice, targetDice);
            }
            else {
                // No collision, show final position then return to start
                this.render(); // Show final position first
                setTimeout(() => {
                    this.returnToStart();
                }, 300); // Brief pause to see final position
            }
        }
        else {
            // Still have moves left, just update the display
            this.render();
        }
    }
    handleDiceCollision(movingDice, targetDice) {
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
        // Instant destruction - no animation
        this.dice = this.dice.filter(d => d.id !== movingDice.id && d.id !== targetDice.id);
        // Reset game state
        this.gameState.selectedDice = null;
        this.gameState.movesRemaining = 0;
        this.gameState.startPosition = null;
        this.render();
    }
    animateReplacement(movingDice, targetDice) {
        const difference = Math.abs(movingDice.value - targetDice.value);
        if (difference === 0) {
            // If difference is 0, treat as destruction
            this.animateDestruction(movingDice, targetDice);
            return;
        }
        // Instant replacement - no animation
        targetDice.value = difference;
        this.dice = this.dice.filter(d => d.id !== movingDice.id);
        // Auto-select the new dice only if game is not over
        if (!this.isGameOver()) {
            this.gameState.selectedDice = targetDice;
            this.gameState.movesRemaining = targetDice.value;
            this.gameState.startPosition = targetDice.position;
        }
        else {
            this.gameState.selectedDice = null;
            this.gameState.movesRemaining = 0;
            this.gameState.startPosition = null;
        }
        this.render();
    }
    returnToStart() {
        if (!this.gameState.selectedDice || this.gameState.startPosition === null)
            return;
        const returningDice = this.gameState.selectedDice;
        const startPos = this.gameState.startPosition;
        this.gameState.animating = true;
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
            // Wait for bounce animation, then move back and reselect
            setTimeout(() => {
                // Move dice back to start position
                returningDice.position = startPos;
                // Reselect the dice
                this.gameState.selectedDice = returningDice;
                this.gameState.movesRemaining = returningDice.value;
                this.gameState.startPosition = startPos;
                this.gameState.animating = false;
                this.render();
            }, 300); // Match faster animation duration
        });
    }
}
// Start the game when the page loads
window.addEventListener('DOMContentLoaded', () => {
    new Game();
});
