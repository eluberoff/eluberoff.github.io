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
            lastInputMethod: null, // Remember the previous input method to handle mixed navigation
            delayGameOverCheck: false, // Delay game over overlay until animations complete
            trailCells: [], // Array of positions that have been visited during current movement
            history: [] // Array of previous game states for undo functionality
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
        
        // Keep re-rolling until we get an even sum
        let attempts = 0;
        do {
            // Create dice with random values
            this.dice = selectedPositions.map((position, index) => ({
                value: this.getRandomDiceValue(),
                position: position,
                id: `dice-${index}`
            }));
            attempts++;
        } while (this.getDiceSum() % 2 !== 0);
        
        // Store initial configuration for reset
        this.initialDice = this.dice.map(dice => ({ ...dice }));
    }
    isInnerCell(row, col) {
        return row >= 1 && row <= 3 && col >= 1 && col <= 3;
    }
    getDiceAtPosition(position) {
        // Check for transient tile first
        if (this.gameState.transientTile && this.gameState.transientTile.position === position) {
            // Return the original dice that the transient tile represents
            return this.dice.find(dice => dice.id === this.gameState.transientTile.originalDiceId);
        }
        return this.dice.find(dice => dice.position === position);
    }
    getDiceSum() {
        return this.dice.reduce((sum, dice) => sum + dice.value, 0);
    }
    
    clearTransientState() {
        this.gameState.movesRemaining = 0;
        this.gameState.dragging = false;
        this.gameState.transientTile = null;
        // Store the current input method before clearing it
        if (this.gameState.inputMethod) {
            this.gameState.lastInputMethod = this.gameState.inputMethod;
        }
        this.gameState.inputMethod = null;
        this.gameState.delayGameOverCheck = false;
        this.gameState.trailCells = [];
    }
    
    clearSelectedDie() {
        this.gameState.selectedDie = null;
        this.clearTransientState();
    }
    
    hasMovedFromStart() {
        // Returns true if the selected die has moved from its starting position
        return this.gameState.selectedDie && 
               this.gameState.movesRemaining < this.gameState.selectedDie.value;
    }
    
    render() {
        // Check if this is initial render (no grid exists yet)
        const gridContainer = document.getElementById('grid');
        if (!gridContainer) {
            this.renderInitial();
        } else {
            this.renderGrid();
        }
    }
    
    renderInitial() {
        // Render the entire page structure once
        const buttonsHTML = `
            <div class="button-container">
                <button id="resetButton" class="game-btn reset-btn">Reset</button>
                <button id="newGameButton" class="game-btn new-game-btn">New</button>
                <button id="shareButton" class="game-btn share-btn">Share</button>
            </div>
            <div id="shareMessage"></div>
        `;
        
        this.gameContainer.innerHTML = '<div id="grid"></div>' + buttonsHTML;
        this.attachButtonListeners();
        this.renderGrid();
    }
    
    renderGrid() {
        let gridHTML = '';
        
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
                if (this.gameState.transientTile && position === this.gameState.transientTile.position) {
                    cellClasses.push('current-position');
                }
                
                // Show trail highlighting for visited cells
                if (this.gameState.trailCells.includes(position)) {
                    cellClasses.push('trail');
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
                    // Add disabled styling if out of moves and not at original position
                    if (this.gameState.movesRemaining === 0) classes.push('stranded');
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
                        // Make other dice non-interactive if current dice has moved, unless it's a valid capture target
                        if (this.hasMovedFromStart() && !isSelected) {
                            // Check if this dice is a valid capture target (final move landing position)
                            const isValidCaptureTarget = this.gameState.movesRemaining === 1 && 
                                                       validMoves.includes(position);
                            if (!isValidCaptureTarget) {
                                classes.push('non-interactive');
                            }
                        }
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
            
            if (finalScore === 0) {
                // Perfect score celebration!
                gridHTML += `
                    <div id="gameOverOverlay" class="win-celebration">
                        <div class="win-title">🎉 You Win! 🎉</div>
                        <div class="win-subtitle">Perfect Score!</div>
                        <div class="final-dice-container">${finalDiceHTML}</div>
                    </div>
                `;
            } else {
                // Regular game over
                gridHTML += `
                    <div id="gameOverOverlay">
                        <div class="game-over-score">Your score: ${finalScore}</div>
                        <div class="final-dice-container">${finalDiceHTML}</div>
                    </div>
                `;
            }
        }
        
        // Update only the grid content
        const gridContainer = document.getElementById('grid');
        if (gridContainer) {
            gridContainer.innerHTML = gridHTML;
        }
        
        this.attachSquareListeners();
        this.cleanupAnimationClasses();
        
        // Restore focus after render
        this.restoreFocus();
        
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
        this.clearSelectedDie();
        // Clear undo history
        this.gameState.history = [];
        this.updateUndoButton();
        this.render();
    }
    startNewGame() {
        // Generate completely new dice configuration
        this.placeDice();
        // Reset game state
        this.clearSelectedDie();
        // Clear undo history
        this.gameState.history = [];
        this.updateUndoButton();
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
            // Modern clipboard API
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
                this.showShareMessage('Puzzle URL copied to clipboard!');
                return;
            }
        }
        catch (err) {
            this.showShareMessage('Puzzle URL updated. Copy from address bar.');
        }
    }
    
    showShareMessage(message) {
        const messageEl = document.getElementById('shareMessage');
        if (messageEl) {
            messageEl.textContent = message;
            messageEl.style.opacity = '1';
            setTimeout(() => {
                messageEl.style.opacity = '0';
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
        // Clear undo history for new puzzle
        this.gameState.history = [];
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
    setupEventListeners() {
        // Add help modal listeners
        const helpButton = document.getElementById('helpButton');
        const helpModal = document.getElementById('helpModal');
        const closeButton = helpModal?.querySelector('.close');
        
        if (helpButton && helpModal) {
            helpButton.addEventListener('click', () => {
                helpModal.style.display = 'block';
                // Focus the close button when modal opens for keyboard accessibility
                const closeButton = helpModal.querySelector('.close');
                if (closeButton) {
                    setTimeout(() => closeButton.focus(), 100);
                }
            });
        }
        
        // Set up undo button
        const undoButton = document.getElementById('undoButton');
        if (undoButton) {
            undoButton.addEventListener('click', () => {
                this.undo();
            });
            // Initialize button state (disabled at start)
            this.updateUndoButton();
        }
        
        const closeModal = () => {
            helpModal.style.display = 'none';
            // Return focus to help button when modal closes
            helpButton.focus();
        };
        
        if (closeButton && helpModal) {
            closeButton.addEventListener('click', closeModal);
        }
        
        if (helpModal) {
            // Close modal when clicking outside of modal content
            helpModal.addEventListener('click', (e) => {
                if (e.target === helpModal) {
                    closeModal();
                }
            });
        }
        
        // Add click outside to deselect
        document.addEventListener('click', (e) => {
            // Check if click is outside the game grid
            const grid = document.getElementById('grid');
            if (grid && this.gameState.selectedDie && !grid.contains(e.target)) {
                this.clearSelectedDie();
                this.render();
            }
        });
        
        // Add keyboard listeners
        document.addEventListener('keydown', (e) => {
            // Handle Escape key
            if (e.key === 'Escape') {
                // First check if modal is open
                if (helpModal && helpModal.style.display === 'block') {
                    closeModal();
                    return;
                }
                // Then check if game has selected die
                if (this.gameState.selectedDie) {
                    // Reset all game state (die is already at start position)
                    this.clearSelectedDie();
                    this.render();
                    return;
                }
            }
            if (this.gameState.selectedDie) {
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
        // If mid-move, clear transient state first
        if (this.hasMovedFromStart()) {
            this.clearSelectedDie();
        }
        // Sort dice by position: left-to-right, top-to-bottom (reading order)
        const sortedDice = [...this.dice].sort((a, b) => {
            const [rowA, colA] = this.positionToRowCol(a.position);
            const [rowB, colB] = this.positionToRowCol(b.position);
            
            // First sort by row (top to bottom)
            if (rowA !== rowB) {
                return rowA - rowB;
            }
            // Then sort by column (left to right)
            return colA - colB;
        });
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
    
    selectTopLeftDice() {
        // Select the top-left dice (first in reading order)
        if (this.dice.length === 0) return;
        
        const sortedDice = [...this.dice].sort((a, b) => {
            const [rowA, colA] = this.positionToRowCol(a.position);
            const [rowB, colB] = this.positionToRowCol(b.position);
            
            // First sort by row (top to bottom)
            if (rowA !== rowB) {
                return rowA - rowB;
            }
            // Then sort by column (left to right)
            return colA - colB;
        });
        
        this.selectDice(sortedDice[0].id);
    }
    
    getDiceTabIndex(position) {
        // Calculate tabindex based on position (reading order)
        // Help icon is tabindex="1", dice start at tabindex="2"
        const [row, col] = this.positionToRowCol(position);
        return 2 + (row * 5) + col;  // 2-26 for dice positions
    }
    
    restoreFocus() {
        let targetDiceId = null;
        
        // Priority 1: Focus on transient tile if it exists
        if (this.gameState.transientTile) {
            targetDiceId = this.gameState.transientTile.originalDiceId;
        }
        // Priority 2: Focus on selected die if it exists
        else if (this.gameState.selectedDie) {
            targetDiceId = this.gameState.selectedDie.id;
        }
        
        if (targetDiceId) {
            const targetElement = document.querySelector(`[data-dice-id="${targetDiceId}"]`);
            if (targetElement) {
                // Set flag to prevent circular rendering during focus restoration
                this.gameState.restoringFocus = true;
                targetElement.focus();
                this.gameState.restoringFocus = false;
            }
        }
    }
    
    updateDiceSelection() {
        // Update dice visual selection without full re-render
        const diceElements = document.querySelectorAll('.dice');
        diceElements.forEach(diceEl => {
            const diceId = diceEl.dataset.diceId;
            if (diceId === this.gameState.selectedDie?.id) {
                diceEl.classList.add('selected');
            } else {
                diceEl.classList.remove('selected');
            }
        });
    }
    
    attachSquareListeners() {
        const squares = document.querySelectorAll('.cell');
        squares.forEach(square => {
            // Attach unified interaction handler to each square
            this.attachInteractionHandler(square);
        });
        
        // Auto-select dice when they receive focus
        const diceElements = document.querySelectorAll('.dice');
        diceElements.forEach(diceEl => {
            diceEl.addEventListener('focus', (e) => {
                const diceId = diceEl.dataset.diceId;
                if (diceId && !this.gameState.restoringFocus) {
                    this.selectDice(diceId);
                }
            });
        });
        
        // Deselect dice when tabbing to buttons or help
        const helpButton = document.getElementById('helpButton');
        const undoButton = document.getElementById('undoButton');
        const resetButton = document.getElementById('resetButton');
        const newGameButton = document.getElementById('newGameButton');
        const shareButton = document.getElementById('shareButton');
        
        [helpButton, undoButton, resetButton, newGameButton, shareButton].forEach(element => {
            if (element) {
                element.addEventListener('focus', () => {
                    if (this.gameState.selectedDie) {
                        this.clearSelectedDie();
                        this.render();
                    }
                });
            }
        });
    }
    
    attachInteractionHandler(element) {
        const handleStart = (e) => {
            if (this.isGameOver() || this.gameState.dragging || this.gameState.delayGameOverCheck) {
                return;
            }
            
            e.preventDefault();
            e.stopPropagation();
            
            const position = parseInt(element.dataset.position);
            if (isNaN(position)) {
                return;
            }
            
            // Special handling: If last input was keyboard and clicking on a dice, always select it
            const diceAtPosition = this.getDiceAtPosition(position);
            if (this.gameState.lastInputMethod === 'keyboard' && diceAtPosition) {
                this.selectDice(diceAtPosition.id);
                this.gameState.lastInputMethod = null; // Clear after use
                return; // Don't continue with any movement logic
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
            
            // Priority 2: Check for valid move to adjacent empty square
            if (this.gameState.transientTile && this.gameState.movesRemaining > 0) {
                const diceAtPosition = this.getDiceAtPosition(position);
                if (!diceAtPosition) {
                    // Empty square - try to move there (only if adjacent)
                    this.gameState.inputMethod = 'pointer';
                    if (this.moveToPosition(position)) {
                        return; // Successful move, no need for drag setup
                    }
                }
            }
            
            // Priority 3: Check for dice selection
            if (diceAtPosition) {
                // Don't allow switching dice if current dice has already moved
                if (this.hasMovedFromStart() && 
                    this.gameState.selectedDie && 
                    diceAtPosition.id !== this.gameState.selectedDie.id) {
                    // Ignore clicks on other dice when in motion
                    return;
                }
                this.selectDice(diceAtPosition.id);
                // Clear lastInputMethod since we're now using pointer input
                this.gameState.lastInputMethod = null;
                // Continue with drag setup in case user wants to drag
            } else {
                // Clicked on empty space - check if it's a valid move or should deselect
                if (this.gameState.selectedDie && this.gameState.movesRemaining > 0) {
                    const validMoves = this.getValidMoves(this.gameState.transientTile.position, this.gameState.movesRemaining);
                    if (!validMoves.includes(position)) {
                        // Clicked on unreachable empty space - deselect
                        this.clearSelectedDie();
                        this.render();
                        return;
                    }
                }
                // Empty space with no dice selected, do nothing
                return;
            }
            
            // Set up drag session with unique handlers to prevent collision
            let startX, startY;
            let actuallyMoved = false; // Track if user actually performed drag moves
            const sessionId = Date.now() + Math.random(); // Unique session identifier
            
            if (e instanceof TouchEvent) {
                if (e.touches.length > 0) {
                    startX = e.touches[0].clientX;
                    startY = e.touches[0].clientY;
                }
            } else {
                startX = e.clientX;
                startY = e.clientY;
            }
            
            // Create unique move handler for this session
            const sessionMoveHandler = (e) => {
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
                if (!this.gameState.dragging && distance > 5) {
                    this.gameState.dragging = true;
                }
                
                if (this.gameState.dragging) {
                    // Find which cell the touch/mouse is currently over
                    const elementAtPoint = document.elementFromPoint(currentX, currentY);
                    if (elementAtPoint) {
                        const cell = elementAtPoint.closest('.cell');
                        if (cell && cell.dataset.position) {
                            const targetPosition = parseInt(cell.dataset.position);
                            if (!isNaN(targetPosition)) {
                                // Use the same logic as click-to-move
                                this.gameState.inputMethod = 'pointer';
                                if (this.moveToPosition(targetPosition)) {
                                    actuallyMoved = true; // Mark that we actually moved
                                }
                            }
                        }
                    }
                }
            };
            
            // Create unique end handler for this session
            const sessionEndHandler = () => {
                // Only reset if we actually performed drag moves AND have moves remaining
                if (actuallyMoved && this.gameState.movesRemaining > 0 && this.gameState.selectedDie && !this.gameState.delayGameOverCheck) {
                    // Clear selection and transient tile
                    this.clearSelectedDie();
                    this.render();
                }
                
                if (this.gameState.dragging) {
                    this.gameState.dragging = false;
                }
                
                // Remove only this session's listeners
                if ('PointerEvent' in window) {
                    document.removeEventListener('pointermove', sessionMoveHandler);
                    document.removeEventListener('pointerup', sessionEndHandler);
                } else {
                    document.removeEventListener('mousemove', sessionMoveHandler);
                    document.removeEventListener('mouseup', sessionEndHandler);
                    document.removeEventListener('touchmove', sessionMoveHandler);
                    document.removeEventListener('touchend', sessionEndHandler);
                }
            };
            
            // Add unique listeners for this session - use pointer events if available, otherwise mouse/touch
            if ('PointerEvent' in window) {
                document.addEventListener('pointermove', sessionMoveHandler, { passive: false });
                document.addEventListener('pointerup', sessionEndHandler);
            } else {
                document.addEventListener('mousemove', sessionMoveHandler);
                document.addEventListener('mouseup', sessionEndHandler);
                document.addEventListener('touchmove', sessionMoveHandler, { passive: false });
                document.addEventListener('touchend', sessionEndHandler);
            }
        };
        
        // Attach start events to the element - use pointer events if available, otherwise fallback to mouse/touch
        if ('PointerEvent' in window) {
            element.addEventListener('pointerdown', handleStart);
        } else {
            element.addEventListener('mousedown', handleStart);
            element.addEventListener('touchstart', handleStart, { passive: false });
        }
    }
    selectDice(diceId) {
        // Don't allow selection if game is over
        if (this.isGameOver()) {
            return;
        }
        if (this.gameState.selectedDie) {
            // Deselect current dice
            this.clearSelectedDie();
        }
        const dice = this.dice.find(d => d.id === diceId);
        if (dice) {
            this.gameState.selectedDie = dice;
            this.gameState.movesRemaining = dice.value;
            this.gameState.trailCells = []; // Clear trail for new selection
            
            
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
        
        // If a dice is selected with moves remaining 0 and transient tile exists, game is not over
        if (this.gameState.selectedDie && this.gameState.movesRemaining === 0 && this.gameState.transientTile) {
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
    
    saveGameState() {
        // Deep copy the current game state before a capture
        const stateCopy = {
            dice: this.dice.map(die => ({
                id: die.id,
                value: die.value,
                position: die.position
            })),
            initialDice: this.initialDice.map(die => ({
                id: die.id,
                value: die.value,
                position: die.position
            }))
        };
        this.gameState.history.push(stateCopy);
        this.updateUndoButton();
    }
    
    undo() {
        if (this.gameState.history.length === 0) {
            return;
        }
        
        // Restore the previous state
        const previousState = this.gameState.history.pop();
        this.dice = previousState.dice;
        this.initialDice = previousState.initialDice;
        
        // Clear any active movement state
        this.clearSelectedDie();
        
        // Re-render the game
        this.render();
        
        // Update undo button state
        this.updateUndoButton();
    }
    
    updateUndoButton() {
        const undoButton = document.getElementById('undoButton');
        if (undoButton) {
            undoButton.disabled = this.gameState.history.length === 0;
        }
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
        
        
        // Can't move back through trail cells (normal movement)
        if (this.gameState.trailCells.includes(newPosition)) {
            return false;
        }
        
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
        if (!this.gameState.transientTile)
            return;
        const currentPosition = this.gameState.transientTile.position;
        const [currentRow, currentCol] = this.positionToRowCol(currentPosition);
        const [deltaRow, deltaCol] = direction;
        const newRow = currentRow + deltaRow;
        const newCol = currentCol + deltaCol;
        const newPosition = this.rowColToPosition(newRow, newCol);
        
        // Check if we're backtracking to the last position in trail
        const trailLength = this.gameState.trailCells.length;
        if (trailLength > 0 && newPosition === this.gameState.trailCells[trailLength - 1]) {
            // This is a backtrack move - undo the last step
            this.gameState.trailCells.pop(); // Remove the last trail position
            this.gameState.transientTile.position = newPosition;
            this.gameState.movesRemaining++; // Add back a move
            
            // Backtracking - no special handling needed
            
            this.render();
            return;
        }
        
        // Block forward movement if out of moves (only allow backtracking)
        if (this.gameState.movesRemaining === 0) {
            return;
        }
        
        const isLastMove = this.gameState.movesRemaining === 1;
        if (!this.canMoveInDirection(currentPosition, direction, isLastMove)) {
            return; // Invalid move
        }
        
        // Add current position to trail before moving (so we can't move back)
        if (!this.gameState.trailCells.includes(currentPosition)) {
            this.gameState.trailCells.push(currentPosition);
        }
        
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
            // Save game state before collision for undo functionality
            this.saveGameState();
            
            // Handle collision at final position (don't modify die position yet)
            this.handleDiceCollision(movingDice, targetDice, finalPosition);
        }
        else {
            // No collision, stay in current state with transient tile (don't move original dice!)
            // Keep trail intact and selected state for backtracking
            this.render();
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
        // Use the exact same green spin animation as value changes
        const movingElement = document.querySelector(`[data-dice-id="${movingDice.id}"]`);
        const targetElement = document.querySelector(`[data-dice-id="${targetDice.id}"]`);
        
        if (movingElement) {
            movingElement.classList.add('spinning');
        }
        if (targetElement) {
            targetElement.classList.add('spinning');
        }
        
        // Wait for spin animation to complete, then remove dice (no red destruction phase)
        setTimeout(() => {
            this.dice = this.dice.filter(d => d.id !== movingDice.id && d.id !== targetDice.id);
            // Reset game state
            this.clearSelectedDie();
            this.render();
            
            // After deletion, focus the top-left dice if any remain
            if (this.dice.length > 0 && !this.isGameOver()) {
                this.selectTopLeftDice();
            }
        }, 400); // Match the CSS spin animation duration - same as replacement
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
                // Clear transient state first, then re-select the new dice
                this.clearTransientState();
                this.gameState.selectedDie = targetDice;
                this.gameState.movesRemaining = targetDice.value;
                this.gameState.transientTile = {
                    position: targetDice.position,
                    value: targetDice.value,
                    originalDiceId: targetDice.id
                };
            }
            else {
                this.clearSelectedDie();
            }
            
            // Clear input method after move completion, preserving it as lastInputMethod
            if (this.gameState.inputMethod) {
                this.gameState.lastInputMethod = this.gameState.inputMethod;
            }
            this.gameState.inputMethod = null;
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
            // Wait for bounce animation, then handle selection based on input method
            setTimeout(() => {
                if (this.gameState.inputMethod === 'keyboard') {
                    // For keyboard input, re-select the dice to maintain focus
                    this.selectDice(returningDice.id);
                } else {
                    // For pointer input, clear selection completely
                    this.clearSelectedDie();
                    this.render();
                }
            }, 300); // Match faster animation duration
        });
    }
}
// Start the game when the page loads
window.addEventListener('DOMContentLoaded', () => {
    new Game();
});
