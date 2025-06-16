// Hardcoded daily puzzles (curated for solvability)
const DAILY_PUZZLES = [
    'MTgsMTIsOCw3LDExLDE2fDMsNSwyLDYsNCw0',           // Day 1 (June 16, 2025)
    'MTYsMTIsMTMsNiw4LDExfDYsNSwyLDQsMiw1',           // Day 2
    'MTIsMTMsNywxNiwxNyw2fDIsMiw1LDIsMyw0',           // Day 3
    'OCwxOCwxMiwxNyw2LDEzfDYsMSwzLDYsMSwx',           // Day 4
    'MTEsOCwxMyw2LDEyLDE2fDMsMSw1LDUsMywy',           // Day 5 (fixed)
    'NiwxMyw3LDExLDE2LDE4fDIsNiw0LDEsNSw2',           // Day 6
    'MTEsMTcsMTgsNiw4LDEyfDEsMywyLDIsNSw1',           // Day 7
    'OCwxNiwxMSwxNyw3LDEzfDYsMSw1LDQsNCwy',           // Day 8
    'MTEsMTcsOCwxNiwxMiw2fDMsNiw2LDIsMSw2',           // Day 9
    'MTEsMTgsNyw2LDEzLDEyfDUsMywyLDEsMSwy',           // Day 10
    'MTYsNiw3LDgsMTcsMTN8MiwzLDMsMSwxLDQ=',           // Day 11 (URL decoded)
    'MTEsMTIsNiw4LDEzLDd8MSwzLDMsMSw0LDY=',           // Day 12 (URL decoded)
    'MTYsNiwxMiwxNywxMSwxOHwxLDMsMywxLDUsMQ==',       // Day 13 (URL decoded)
    'MTMsMTcsMTgsMTEsNywxNnw2LDUsMSwxLDMsNA==',       // Day 14 (URL decoded)
    'MTIsMTEsMTYsMTgsOCwxN3wxLDIsNSwxLDMsNA==',       // Day 15 (URL decoded)
    'MTYsNiwxMywxMiw4LDd8NCwxLDEsMSw0LDM='            // Day 16 (URL decoded)
];

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
            history: [], // Array of previous game states for undo functionality
            emojiSequence: [], // Array of emojis representing the moves made during the game
            totalSteps: 0, // Total number of dice movement steps
            usedAssists: false, // Track if undo, reset, or backtracking was used
            targetPreviewDiceId: null, // Store which die has the target preview
            hintMessageTimeout: null // Store timeout for hint message
        };
        
        // Emoji mapping for move tracking
        this.EMOJI_MAP = {
            1: '1️⃣',
            2: '2️⃣', 
            3: '3️⃣',
            4: '4️⃣',
            5: '5️⃣',
            6: '6️⃣',
            capture: '❇️',
            explosion: '💥'
        };
        
        // Check if we're in admin mode
        this.isAdminMode = this.checkAdminMode();
        
        // Initialize seeded random number generator for daily puzzles
        this.seedRandom = this.createSeededRandom();
        
        this.gameContainer = document.getElementById('gameContent');
        this.solutionDisplay = null; // Cache for solution display element
        this.init();
    }
    checkAdminMode() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.has('admin');
    }
    
    getTodayEasternDate() {
        const today = new Date();
        return new Date(today.toLocaleString("en-US", {timeZone: "America/New_York"}));
    }
    
    getDailyPuzzleNumber() {
        // Calculate days since game launch (June 16, 2025 = puzzle #1)
        const launchDate = new Date('2025-06-16T00:00:00-05:00'); // EDT
        const todayEastern = this.getTodayEasternDate();
        
        // Reset to start of day for accurate day counting
        const todayStart = new Date(todayEastern.getFullYear(), todayEastern.getMonth(), todayEastern.getDate());
        const launchStart = new Date(launchDate.getFullYear(), launchDate.getMonth(), launchDate.getDate());
        
        const daysDiff = Math.floor((todayStart - launchStart) / (1000 * 60 * 60 * 24));
        const puzzleNumber = Math.max(1, daysDiff + 1); // Ensure minimum puzzle #1
        
        // Cycle through available puzzles (16 puzzles available)
        return ((puzzleNumber - 1) % DAILY_PUZZLES.length) + 1;
    }
    
    getDailyPuzzleData() {
        const puzzleNumber = this.getDailyPuzzleNumber();
        const puzzleIndex = puzzleNumber - 1; // Convert to 0-based index
        const encodedPuzzle = DAILY_PUZZLES[puzzleIndex];
        return this.decodePuzzleState(encodedPuzzle);
    }
    
    getFormattedDate() {
        const easternDate = this.getTodayEasternDate();
        return easternDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long', 
            day: 'numeric',
            timeZone: 'America/New_York'
        });
    }
    
    createSeededRandom() {
        // Only used in admin mode for random puzzle generation
        return () => Math.random();
    }
    
    updateGameTitle() {
        const titleElement = document.getElementById('gameTitle');
        const subtitleElement = document.getElementById('puzzleSubtitle');
        
        if (this.isAdminMode) {
            titleElement.textContent = 'Dicey';
            subtitleElement.textContent = '';
        } else {
            const puzzleNumber = this.getDailyPuzzleNumber();
            const formattedDate = this.getFormattedDate();
            titleElement.textContent = `Dicey #${puzzleNumber}`;
            subtitleElement.textContent = formattedDate;
        }
    }
    
    init() {
        // Check if there's a shared puzzle in URL
        if (!this.loadFromUrl()) {
            // No shared puzzle, use daily puzzle or generate random one
            if (this.isAdminMode) {
                // Admin mode: generate random puzzle
                this.placeDice();
            } else {
                // Daily mode: use hardcoded daily puzzle
                this.loadDailyPuzzle();
            }
        }
        this.updateGameTitle();
        this.render();
        this.setupEventListeners();
    }
    
    loadDailyPuzzle() {
        const puzzleData = this.getDailyPuzzleData();
        if (puzzleData) {
            // Create dice from daily puzzle data
            this.dice = puzzleData.positions.map((position, index) => ({
                value: puzzleData.values[index],
                position: position,
                id: `dice-${index}`
            }));
            // Store initial configuration for reset
            this.initialDice = this.dice.map(dice => ({ ...dice }));
            // Clear undo history and emoji sequence for daily puzzle
            this.gameState.history = [];
            this.gameState.emojiSequence = [];
            this.gameState.totalSteps = 0;
            this.gameState.usedAssists = false;
        } else {
            // Fallback to random generation if puzzle data is invalid
            this.placeDice();
        }
    }
    getRandomDiceValue() {
        return Math.floor(this.seedRandom() * 6) + 1;
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
            const randomIndex = Math.floor(this.seedRandom() * innerPositions.length);
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
        // Note: Target preview is NOT cleared here - only in specific circumstances
    }
    
    setTargetPreview(diceId) {
        // Store the target preview in game state
        this.gameState.targetPreviewDiceId = diceId;
        
        // Apply the preview class
        this.applyTargetPreview();
    }
    
    clearTargetPreview() {
        // Clear from game state
        this.gameState.targetPreviewDiceId = null;
        
        // Remove target preview class from all dice
        const targetElements = document.querySelectorAll('.target-preview');
        targetElements.forEach(element => {
            element.classList.remove('target-preview');
        });
    }
    
    applyTargetPreview() {
        // Remove target preview from all dice first
        const targetElements = document.querySelectorAll('.target-preview');
        targetElements.forEach(element => {
            element.classList.remove('target-preview');
        });
        
        // Apply target preview to the stored dice ID if it exists
        if (this.gameState.targetPreviewDiceId) {
            const targetElement = document.querySelector(`[data-dice-id="${this.gameState.targetPreviewDiceId}"]`);
            if (targetElement) {
                targetElement.classList.add('target-preview');
            }
        }
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
        
        // Reapply target preview after rendering (since DOM elements get recreated)
        this.applyTargetPreview();
    }
    
    renderInitial() {
        // Render the entire page structure once
        const newButtonHTML = this.isAdminMode 
            ? '<button id="newGameButton" class="game-btn new-game-btn">New</button>'
            : '';
            
        const shareButtonHTML = this.isAdminMode 
            ? '<button id="shareButton" class="game-btn share-btn">Share</button>'
            : '';
            
        const buttonsHTML = `
            <div class="button-container">
                <button id="undoButton" class="game-btn undo-btn" disabled>Undo</button>
                <button id="resetButton" class="game-btn reset-btn" disabled>Restart</button>
                <button id="hintButton" class="game-btn hint-btn" disabled>Hint</button>
                ${newButtonHTML}
                ${shareButtonHTML}
            </div>
            <div id="shareMessage"></div>
        `;
        
        this.gameContainer.innerHTML = '<div id="grid"></div>' + buttonsHTML;
        this.attachButtonListeners();
        this.renderGrid();
        
        // Create solution display element if in admin mode
        if (this.isAdminMode) {
            this.solutionDisplay = document.createElement('div');
            this.solutionDisplay.id = 'solutionDisplay';
            this.gameContainer.appendChild(this.solutionDisplay);
            this.updateSolutionDisplay();
        }
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
                `<div class="final-dice">${this.EMOJI_MAP[dice.value]}</div>`
            ).join('');
            
            if (finalScore === 0) {
                // Perfect score celebration with emoji sequence!
                const emojiSequenceHTML = this.gameState.emojiSequence.length > 0 
                    ? `<div class="emoji-sequence">${this.gameState.emojiSequence.join('')}</div>`
                    : '';
                    
                gridHTML += `
                    <div id="gameOverOverlay" class="win-celebration">
                        <div class="win-title">Success!</div>
                        <div class="win-subtitle">Cleared in ${this.gameState.totalSteps} moves${this.gameState.usedAssists ? '' : ' (first try!)'}</div>
                        ${emojiSequenceHTML}
                        <div class="final-dice-container">${finalDiceHTML}</div>
                        <div style="margin-top: 20px; text-align: center;">
                            <button id="shareSolutionButton" class="game-btn share-btn" style="padding: 12px 24px; min-width: 120px;">Share</button>
                            <div id="shareSolutionMessage" style="opacity: 0; height: 0; line-height: 0; position: relative; top: 16px; color: white; text-align: center; font-size: 14px; transition: opacity 0.3s ease;"></div>
                        </div>
                    </div>
                `;
            } else {
                // Stranded score celebration
                gridHTML += `
                    <div id="gameOverOverlay" class="stranded-celebration">
                        <div class="stranded-title">Stranded Score:</div>
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
                    // Update buttons when game over screen appears
                    this.updateButtons();
                    // Set up share solution button if it exists (for win popup)
                    const shareSolutionButton = document.getElementById('shareSolutionButton');
                    if (shareSolutionButton) {
                        shareSolutionButton.addEventListener('click', () => {
                            this.shareSolution();
                        });
                    }
                }
            }, 100); // Quick delay to let the final state be visible first
        }
    }
    attachButtonListeners() {
        const resetButton = document.getElementById('resetButton');
        const newGameButton = document.getElementById('newGameButton');
        const shareButton = document.getElementById('shareButton');
        const shareSolutionButton = document.getElementById('shareSolutionButton');
        const undoButton = document.getElementById('undoButton');
        const hintButton = document.getElementById('hintButton');
        
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
        if (undoButton) {
            undoButton.addEventListener('click', () => {
                this.undo();
            });
        }
        if (hintButton) {
            hintButton.addEventListener('click', () => {
                this.showHint();
            });
        }
    }
    resetToInitialState() {
        // Mark that reset was used (counts as assist)
        this.gameState.usedAssists = true;
        
        // Reset dice to initial configuration (whatever was originally loaded)
        this.dice = this.initialDice.map(dice => ({ ...dice }));

        // Reset game state
        this.clearSelectedDie();
        this.clearTargetPreview(); // Clear hint when resetting
        this.clearHintMessage(); // Clear any hint message
        // Clear undo history and emoji sequence
        this.gameState.history = [];
        this.gameState.emojiSequence = [];
        this.gameState.totalSteps = 0;
        this.updateButtons();
        this.render();
        this.updateSolutionDisplay(); // Update solutions after reset
    }
    startNewGame() {
        // Only allow new games in admin mode
        if (!this.isAdminMode) {
            return;
        }
        
        // Generate completely new dice configuration (admin mode only)
        this.placeDice();
        // Reset game state
        this.clearSelectedDie();
        // Clear undo history and emoji sequence
        this.gameState.history = [];
        this.gameState.emojiSequence = [];
        this.gameState.totalSteps = 0;
        this.gameState.usedAssists = false;
        this.updateButtons();
        // Clear URL parameters for new game
        this.clearUrlParameters();
        this.render();
        this.updateSolutionDisplay(); // Update solutions after new game
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
    
    shareSolution() {
        // Create the solution share message
        let puzzleTitle;
        if (this.isAdminMode) {
            puzzleTitle = 'Dicey';
        } else {
            const puzzleNumber = this.getDailyPuzzleNumber();
            puzzleTitle = `Dicey #${puzzleNumber}`;
        }
        
        const stepsText = `Solved in ${this.gameState.totalSteps} moves${this.gameState.usedAssists ? '' : ' (first try)'}`;
        const emojiSequence = this.gameState.emojiSequence.join('');
        
        const shareText = `${puzzleTitle}\n${stepsText}\n${emojiSequence}`;
        
        this.copyToClipboardSolution(shareText);
    }
    
    async copyToClipboardSolution(text) {
        try {
            // Modern clipboard API
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
                this.showSolutionShareMessage('Solution copied to clipboard!');
                return;
            }
        }
        catch (err) {
            this.showSolutionShareMessage('Could not copy to clipboard');
        }
    }
    
    showSolutionShareMessage(message) {
        const messageEl = document.getElementById('shareSolutionMessage');
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
        // Clear undo history and emoji sequence for new puzzle
        this.gameState.history = [];
        this.gameState.emojiSequence = [];
        this.gameState.totalSteps = 0;
        this.gameState.usedAssists = false;
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
        
        // Set up undo button (now handled in attachButtonListeners)
        this.updateButtons();
        
        const closeModal = (returnFocus = false) => {
            helpModal.style.display = 'none';
            // Only return focus to help button if explicitly requested (keyboard navigation)
            if (returnFocus) {
                helpButton.focus();
            }
        };
        
        if (closeButton && helpModal) {
            closeButton.addEventListener('click', () => closeModal(false)); // No focus return on click
            closeButton.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    closeModal(true); // Return focus on keyboard close
                }
            });
        }
        
        if (helpModal) {
            // Close modal when clicking outside of modal content
            helpModal.addEventListener('click', (e) => {
                if (e.target === helpModal) {
                    closeModal(false); // No focus return on outside click
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
                    closeModal(true); // Return focus on keyboard close
                    return;
                }
                // Then check if game has selected die
                if (this.gameState.selectedDie) {
                    // Reset all game state (die is already at start position)
                    this.clearSelectedDie();
                    this.clearTargetPreview(); // Clear hint when pressing Escape
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
                if (!this.gameState.transientTile) return;
                
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
                // Only reset if we actually performed drag moves
                if (actuallyMoved && this.gameState.selectedDie && !this.gameState.delayGameOverCheck) {
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
            // Deselect current dice and clear target preview (selecting different die)
            this.clearSelectedDie();
            this.clearTargetPreview();
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
        // If a dice is selected with moves remaining 0 and transient tile exists, game is not over
        if (this.gameState.selectedDie && this.gameState.movesRemaining === 0 && this.gameState.transientTile) {
            return false;
        }
        
        // Check if the current score is 0 (perfect solution found)
        const currentScore = this.dice.reduce((sum, die) => sum + die.value, 0);
        if (currentScore === 0) {
            return true; // Game won!
        }
        
        // Check if any dice can reach any other dice (any moves possible)
        const gameState = {
            dice: this.dice.map(die => ({
                id: die.id,
                value: die.value,
                position: die.position
            }))
        };
        
        for (let i = 0; i < this.dice.length; i++) {
            for (let j = 0; j < this.dice.length; j++) {
                if (i !== j && this.canDiceReachDiceWithPath(this.dice[i], this.dice[j], gameState)) {
                    return false; // Found a possible move
                }
            }
        }
        return true; // No dice can reach any other dice - truly no moves possible
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
            emojiSequence: [...this.gameState.emojiSequence],
            totalSteps: this.gameState.totalSteps
        };
        this.gameState.history.push(stateCopy);
        this.updateButtons();
    }
    
    undo() {
        if (this.gameState.history.length === 0) {
            return;
        }
        
        // Mark that undo was used (counts as assist)
        this.gameState.usedAssists = true;
        
        // Restore the previous state
        const previousState = this.gameState.history.pop();
        this.dice = previousState.dice;
        // Don't restore initialDice - it should never change from original puzzle
        this.gameState.emojiSequence = previousState.emojiSequence;
        this.gameState.totalSteps = previousState.totalSteps;
        
        // Clear any active movement state
        this.clearSelectedDie();
        this.clearTargetPreview(); // Clear hint when undoing
        this.clearHintMessage(); // Clear any hint message
        
        // Re-render the game
        this.render();
        
        // Update undo button state
        this.updateButtons();
        this.updateSolutionDisplay(); // Update solutions after undo
    }
    
    showHint() {
        // Mark that hint was used (counts as assist)
        this.gameState.usedAssists = true;
        
        // Find the first solution
        const solutions = this.findAllSolutions();
        console.log('Hint: Found', solutions.length, 'solutions');
        
        if (solutions.length === 0) {
            console.log('Hint: No solutions available');
            this.showHintMessage("No solutions exist from here. Press undo to go back a step.");
            return; // No solutions available
        }
        
        // Get the first move of the first solution
        const firstSolution = solutions[0];
        const firstMove = firstSolution[0];
        console.log('Hint: First move is:', firstMove);
        
        // Parse the first move to extract the starting position
        // Format is like: "A1(3) -> B2(4)"
        const moveMatch = firstMove.match(/^([A-E][1-5])\(\d+\)/);
        if (!moveMatch) {
            console.log('Hint: Could not parse move:', firstMove);
            return; // Couldn't parse move
        }
        
        const startPos = moveMatch[1]; // e.g., "A1"
        console.log('Hint: Starting position:', startPos);
        
        // Convert chess notation back to position number
        const col = startPos.charCodeAt(0) - 'A'.charCodeAt(0); // A=0, B=1, etc.
        const row = parseInt(startPos[1]) - 1; // 1=0, 2=1, etc. (we use natural numbering)
        const position = row * 5 + col;
        console.log('Hint: Calculated position:', position, 'from row:', row, 'col:', col);
        
        // Find the die at this position
        const hintDie = this.dice.find(die => die.position === position);
        console.log('Hint: Found die:', hintDie);
        
        if (hintDie) {
            // Clear any current selection and select the hint die
            this.clearSelectedDie();
            console.log('Hint: Selecting die with id:', hintDie.id);
            
            // Parse the target position from the first move
            const targetMatch = firstMove.match(/-> ([A-E][1-5])\(\d+\)/);
            let targetDie = null;
            if (targetMatch) {
                const targetPos = targetMatch[1];
                const targetCol = targetPos.charCodeAt(0) - 'A'.charCodeAt(0);
                const targetRow = parseInt(targetPos[1]) - 1;
                const targetPosition = targetRow * 5 + targetCol;
                targetDie = this.dice.find(die => die.position === targetPosition);
                console.log('Hint: Target die:', targetDie);
            }
            
            // Use setTimeout to avoid race conditions with other click handlers
            setTimeout(() => {
                this.selectDice(hintDie.id);
                if (targetDie) {
                    this.setTargetPreview(targetDie.id);
                }
                console.log('Hint: Selection completed for die:', hintDie.id);
            }, 10); // Small delay to ensure other event handlers complete first
        } else {
            console.log('Hint: No die found at position', position);
            console.log('Current dice positions:', this.dice.map(d => ({id: d.id, pos: d.position, chess: this.positionToChessNotation(d.position)})));
        }
    }
    
    updateUndoButton() {
        const undoButton = document.getElementById('undoButton');
        if (undoButton) {
            undoButton.disabled = this.gameState.history.length === 0;
        }
    }
    
    updateStartOverButton() {
        const startOverButton = document.getElementById('resetButton');
        if (startOverButton) {
            // Same logic as undo button - enabled when there's move history
            startOverButton.disabled = this.gameState.history.length === 0;
        }
    }
    
    showHintMessage(message) {
        const messageEl = document.getElementById('shareMessage');
        if (messageEl) {
            // Clear any existing timeout
            if (this.gameState.hintMessageTimeout) {
                clearTimeout(this.gameState.hintMessageTimeout);
                this.gameState.hintMessageTimeout = null;
            }
            
            messageEl.textContent = message;
            messageEl.style.opacity = '1';
            
            // Hide the message after 3 seconds
            this.gameState.hintMessageTimeout = setTimeout(() => {
                messageEl.style.opacity = '0';
                this.gameState.hintMessageTimeout = null;
            }, 3000);
        }
    }
    
    clearHintMessage() {
        // Clear the timeout if it exists
        if (this.gameState.hintMessageTimeout) {
            clearTimeout(this.gameState.hintMessageTimeout);
            this.gameState.hintMessageTimeout = null;
        }
        
        // Hide the message immediately
        const messageEl = document.getElementById('shareMessage');
        if (messageEl) {
            messageEl.style.opacity = '0';
        }
    }
    
    updateHintButton() {
        const hintButton = document.getElementById('hintButton');
        if (hintButton) {
            // Hint button disabled when game is over OR no moves have been made yet
            hintButton.disabled = this.isGameOver() || this.gameState.history.length === 0;
        }
    }
    
    updateButtons() {
        this.updateUndoButton();
        this.updateStartOverButton();
        this.updateHintButton();
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
            this.gameState.usedAssists = true; // Mark that backtracking was used
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
        
        // Clear target preview when move completes with collision
        this.clearTargetPreview();
        
        // Add the moving die's value to step count (this represents the move that just completed)
        this.gameState.totalSteps += movingDice.value;
        
        // Track emoji for this collision
        // Always add the die that moved
        this.gameState.emojiSequence.push(this.EMOJI_MAP[movingDice.value]);
        
        if (movingDice.value === targetDice.value) {
            // Same values: both dice disappear → add explosion emoji
            this.gameState.emojiSequence.push(this.EMOJI_MAP.explosion);
        }
        
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
            this.updateSolutionDisplay(); // Update solutions after dice removal
            
            // After deletion, leave no die selected
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
            this.updateSolutionDisplay(); // Update solutions after dice value change
        }, 400); // Match the CSS animation duration
    }
    moveToPosition(targetPosition) {
        if (!this.gameState.transientTile) {
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
    
    // === SOLUTION FINDER METHODS ===
    
    positionToChessNotation(position) {
        const [row, col] = this.positionToRowCol(position);
        const file = String.fromCharCode('A'.charCodeAt(0) + col); // A-E
        const rank = (row + 1).toString(); // 1-5 (natural row numbering)
        return file + rank;
    }
    
    // Check if there's a valid path from one position to another without crossing other dice
    canReachWithValidPath(fromPosition, toPosition, gameState, stepsRemaining, visitedPositions = new Set()) {
        // Base case: if we've reached the target
        if (fromPosition === toPosition) {
            return stepsRemaining === 0; // Must use exact number of steps
        }
        
        // Base case: if we're out of steps
        if (stepsRemaining <= 0) {
            return false;
        }
        
        // Base case: if we've been to this position before (avoid loops)
        if (visitedPositions.has(fromPosition)) {
            return false;
        }
        
        // Add current position to visited
        const newVisited = new Set(visitedPositions);
        newVisited.add(fromPosition);
        
        // Get all adjacent positions
        const [row, col] = this.positionToRowCol(fromPosition);
        const directions = [
            [-1, 0], // up
            [1, 0],  // down
            [0, -1], // left
            [0, 1]   // right
        ];
        
        for (const [deltaRow, deltaCol] of directions) {
            const newRow = row + deltaRow;
            const newCol = col + deltaCol;
            
            // Check bounds
            if (newRow < 0 || newRow >= 5 || newCol < 0 || newCol >= 5) {
                continue;
            }
            
            const newPosition = this.rowColToPosition(newRow, newCol);
            
            // Check if there's a die at this position (blocking our path)
            const diceAtPosition = gameState.dice.find(die => die.position === newPosition);
            
            // We can only move to a position with a die if it's our final destination
            // Otherwise, dice block our path
            if (diceAtPosition && newPosition !== toPosition) {
                continue; // This position is blocked
            }
            
            // Recursively check if we can reach the target from this new position
            if (this.canReachWithValidPath(newPosition, toPosition, gameState, stepsRemaining - 1, newVisited)) {
                return true;
            }
        }
        
        return false; // No valid path found
    }
    
    // Enhanced version of canDiceReachDice that uses actual pathfinding
    canDiceReachDiceWithPath(fromDice, toDice, gameState) {
        const distance = this.getTaxicabDistance(fromDice.position, toDice.position);
        const moves = fromDice.value;
        
        // Quick elimination: if distance > moves or wrong parity, impossible
        if (distance > moves || (distance % 2 !== moves % 2)) {
            return false;
        }
        
        // Now check if there's actually a valid path
        return this.canReachWithValidPath(fromDice.position, toDice.position, gameState, moves);
    }
    
    simulateMove(gameState, fromDiceIndex, toDiceIndex) {
        // Create a deep copy of the game state
        const newState = {
            dice: gameState.dice.map(die => ({
                id: die.id,
                value: die.value,
                position: die.position
            }))
        };
        
        const fromDice = newState.dice[fromDiceIndex];
        const toDice = newState.dice[toDiceIndex];
        
        // Calculate collision result
        if (fromDice.value === toDice.value) {
            // Same values - both dice disappear
            // Remove both dice (remove higher index first to avoid index shifting)
            const indicesToRemove = [fromDiceIndex, toDiceIndex].sort((a, b) => b - a);
            indicesToRemove.forEach(index => newState.dice.splice(index, 1));
        } else {
            // Different values - replace with difference
            const newValue = Math.abs(fromDice.value - toDice.value);
            // Remove the moving die, update the target die
            newState.dice.splice(fromDiceIndex, 1);
            // Find the target die in the modified array
            const adjustedToIndex = toDiceIndex > fromDiceIndex ? toDiceIndex - 1 : toDiceIndex;
            newState.dice[adjustedToIndex].value = newValue;
        }
        
        return newState;
    }
    
    findAllSolutions(gameState = null, moveSequence = []) {
        if (!gameState) {
            gameState = {
                dice: this.dice.map(die => ({
                    id: die.id,
                    value: die.value,
                    position: die.position
                }))
            };
        }
        
        // Base case: if score is 0, we found a solution
        const currentScore = gameState.dice.reduce((sum, die) => sum + die.value, 0);
        if (currentScore === 0) {
            return [moveSequence.slice()]; // Return copy of current sequence
        }
        
        // Find all valid moves: dice that can reach other dice with actual pathfinding
        const validMoves = [];
        for (let i = 0; i < gameState.dice.length; i++) {
            for (let j = 0; j < gameState.dice.length; j++) {
                if (i !== j) {
                    const fromDie = gameState.dice[i];
                    const toDie = gameState.dice[j];
                    
                    // Check if there's a valid path (this includes distance and parity checking)
                    if (this.canDiceReachDiceWithPath(fromDie, toDie, gameState)) {
                        const distance = this.getTaxicabDistance(fromDie.position, toDie.position);
                        validMoves.push({
                            fromIndex: i,
                            toIndex: j,
                            fromDie: fromDie,
                            toDie: toDie,
                            distance: distance
                        });
                    }
                }
            }
        }
        
        // If no valid moves, this branch has no solution
        if (validMoves.length === 0) {
            return [];
        }
        
        // Try each valid move
        const allSolutions = [];
        
        for (const move of validMoves) {
            const fromPos = this.positionToChessNotation(move.fromDie.position);
            const toPos = this.positionToChessNotation(move.toDie.position);
            const moveDesc = `${fromPos}(${move.fromDie.value}) -> ${toPos}(${move.toDie.value})`;
            
            // Simulate the move
            const newState = this.simulateMove(gameState, move.fromIndex, move.toIndex);
            const newMoveSequence = [...moveSequence, moveDesc];
            
            // Recursively find solutions from this new state
            const solutions = this.findAllSolutions(newState, newMoveSequence);
            allSolutions.push(...solutions);
        }
        
        return allSolutions;
    }
    
    // Fast version that stops after finding first solution (for game-over detection)
    hasAnySolution(gameState = null, moveSequence = []) {
        if (!gameState) {
            gameState = {
                dice: this.dice.map(die => ({
                    id: die.id,
                    value: die.value,
                    position: die.position
                }))
            };
        }
        
        // Base case: if score is 0, we found a solution
        const currentScore = gameState.dice.reduce((sum, die) => sum + die.value, 0);
        if (currentScore === 0) {
            return true; // Found at least one solution
        }
        
        // Find all valid moves: dice that can reach other dice with actual pathfinding
        const validMoves = [];
        for (let i = 0; i < gameState.dice.length; i++) {
            for (let j = 0; j < gameState.dice.length; j++) {
                if (i !== j) {
                    const fromDie = gameState.dice[i];
                    const toDie = gameState.dice[j];
                    
                    // Check if there's a valid path (this includes distance and parity checking)
                    if (this.canDiceReachDiceWithPath(fromDie, toDie, gameState)) {
                        validMoves.push({
                            fromIndex: i,
                            toIndex: j,
                            fromDie: fromDie,
                            toDie: toDie
                        });
                    }
                }
            }
        }
        
        // If no valid moves, this branch has no solution
        if (validMoves.length === 0) {
            return false;
        }
        
        // Try each valid move until we find any solution
        for (const move of validMoves) {
            // Simulate the move
            const newState = this.simulateMove(gameState, move.fromIndex, move.toIndex);
            
            // Recursively check if this path leads to any solution
            if (this.hasAnySolution(newState, moveSequence)) {
                return true; // Found at least one solution, stop searching
            }
        }
        
        return false; // No solutions found
    }
    
    updateSolutionDisplay() {
        if (!this.isAdminMode || !this.solutionDisplay) {
            return;
        }
        
        // Show current puzzle state
        let displayText = `<div style="margin-top: 20px; padding: 10px; background: #444; border-radius: 5px; font-size: 12px; color: #ccc;">`;
        displayText += `<strong>Admin Mode - Current Puzzle:</strong><br>`;
        
        // Create visual grid
        displayText += `<div style="font-family: monospace; margin: 10px 0;">`;
        displayText += `   A B C D E<br>`;
        for (let row = 0; row < 5; row++) {
            const rank = row + 1;
            displayText += `${rank}  `;
            for (let col = 0; col < 5; col++) {
                const position = row * 5 + col;
                const die = this.dice.find(d => d.position === position);
                if (die) {
                    displayText += `${die.value} `;
                } else {
                    displayText += `. `;
                }
            }
            displayText += `<br>`;
        }
        displayText += `</div>`;
        
        displayText += `Dice: `;
        this.dice.forEach(die => {
            const pos = this.positionToChessNotation(die.position);
            displayText += `${pos}(${die.value}) `;
        });
        displayText += `<br><br>`;
        
        const solutions = this.findAllSolutions();
        const solutionCount = solutions.length;
        
        displayText += `<strong>Found ${solutionCount} possible solution${solutionCount !== 1 ? 's' : ''}</strong>`;
        
        if (solutionCount > 0 && solutionCount <= 10) {
            // Show actual solutions if there are 10 or fewer
            displayText += `<br><br>`;
            solutions.forEach((solution, index) => {
                displayText += `<strong>Solution ${index + 1}:</strong> ${solution.join(', ')}<br>`;
            });
        } else if (solutionCount > 10) {
            // Just show the first 10 for brevity
            displayText += `<br><br>`;
            solutions.slice(0, 10).forEach((solution, index) => {
                displayText += `<strong>Solution ${index + 1}:</strong> ${solution.join(', ')}<br>`;
            });
            displayText += `<em>... and ${solutionCount - 10} more solutions</em>`;
        }
        
        displayText += `</div>`;
        this.solutionDisplay.innerHTML = displayText;
    }
}
// Start the game when the page loads
window.addEventListener('DOMContentLoaded', () => {
    new Game();
});
