// Hardcoded daily puzzles (curated for solvability)
const DAILY_PUZZLES = [
    'MTYsMTgsOCw3fDMsNiw1LDQ=',                         // Day 1 (June 16, 2025)
    'MTYsMTIsMTMsNiw4LDExfDYsNSwyLDQsMiw1',             // Day 2 (June 17, 2025)
    'MTIsMTMsNywxNiwxNyw2fDIsMiw1LDIsMyw0',             // Day 3 (June 18, 2025)
    'OCwxOCwxMiwxNyw2LDEzfDYsMSwzLDYsMSwx',             // Day 4 (June 19, 2025)
    'MTIsNyw2LDgsMTcsMTN8NiwzLDQsNSwyLDY=',             // Day 5 (June 20, 2025)
    'MTEsMTcsMTgsNiw4LDEyfDEsMywyLDIsNSw1',             // Day 6 (June 21, 2025)
    'OCwxMiwxNiwxNyw2LDEzfDYsMSw1LDUsMSwy',             // Day 7 (June 22, 2025)
    'MTgsMTYsNywxMXwyLDMsNCwz',                         // Day 8 (June 23, 2025)
    'Nyw2LDEzLDgsMTJ8NCw0LDYsMywz',                     // Day 9 (June 24, 2025)
    'OCwxOCw3LDE3LDEzLDEyfDMsMyw0LDQsMiw0',             // Day 10 (June 25, 2025)
    'NiwxMyw3LDExLDE2LDE4fDIsNiw0LDEsNSw2',             // Day 11 (June 26, 2025)
    'OCwxNiwxMSwxNyw3LDEzfDYsMSw1LDQsNCwy',             // Day 12 (June 27, 2025)
    'MTgsNiwxNiwxMyw3LDh8NSwyLDEsMSw2LDU=',             // Day 13 (June 28, 2025)
    'MTgsMTcsMTYsMTEsMTMsMTJ8Niw1LDIsNiwyLDM=',         // Day 14 (June 29, 2025)
    'MTgsMTYsNiwxMXw2LDIsMyw1',                         // Day 15 (June 30, 2025)
    'Niw4LDEzLDE4LDE2fDUsNCwzLDYsMg==',                 // Day 16 (July 1, 2025)
    'MTYsMTIsMTgsMTcsOCwxM3wzLDMsNiwyLDQsNA==',         // Day 17 (July 2, 2025)
    'MTEsMTcsOCwxNiwxMiw2fDMsNiw2LDIsMSw2',             // Day 18 (July 3, 2025)
    'MTYsNiwxMiwxNywxMSwxOHwxLDMsMywxLDUsMQ==',         // Day 19 (July 4, 2025)
    'MTEsMTgsNyw2LDEzLDEyfDMsNCwxLDQsNiw2',             // Day 20 (July 5, 2025)
    'MTEsMTgsMTMsMTcsOCwxMnwxLDMsNiw2LDQsNA==',         // Day 21 (July 6, 2025)
    'OCw3LDE2LDZ8NCw1LDMsNg==',                         // Day 22 (July 7, 2025)
    'OCwxMiwxNywxOCw3fDMsNSw2LDIsNg==',                 // Day 23 (July 8, 2025)
    'MTEsMTgsNyw2LDEzLDEyfDUsMywyLDEsMSwy',             // Day 24 (July 9, 2025)
    'MTYsNiw3LDgsMTcsMTN8MiwzLDMsMSwxLDQ=',             // Day 25 (July 10, 2025)
    'NiwxMywxMiwxOCwxNiw4fDEsMywyLDQsNSwx',             // Day 26 (July 11, 2025)
    'NiwxNiwxMSw4LDEyLDE4fDEsNSw2LDYsNSwx',             // Day 27 (July 12, 2025)
    'Niw4LDEzLDE3LDcsMTJ8MywxLDYsNiw0LDQ='              // Day 28 (July 13, 2025)
];

// Demo puzzle for getting started (easy tutorial)
const DEMO_PUZZLE = 'Niw4LDE3fDEsMiwz'; // 1 in B2, 2 in D2, 3 in C4

// Button text constants
const BUTTON_LABELS = {
    UNDO: 'Undo',
    RESTART: 'New Run', 
    HINT: 'Hint',
    NEW_GAME: 'New',
    SHARE: 'Share',
    SAVE: 'Save'
};

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
            // New scoring system
            forwardMoves: 0, // Count of forward moves only (ignoring backtracking)
            undoCount: 0, // Number of undos used
            restartCount: 0, // Number of restarts used  
            hintCount: 0, // Number of hints used
            // Legacy tracking (kept for compatibility)
            totalSteps: 0, // Total number of dice movement steps
            usedAssists: false, // Track if undo, reset, or backtracking was used
            targetPreviewDiceId: null, // Store which die has the target preview
            hintMessageTimeout: null, // Store timeout for hint message
            showMobileTileHints: false, // Only show mobile tile hints after tap, not during drag
            cachedSolutions: null, // Store all solutions for hint randomization
            // Run tracking
            runHistory: [], // Array of completed runs with their stats
            currentRunNumber: 1, // Current run number
            minStepsForPuzzle: null, // Minimum steps for perfect solution
            strandedThresholds: null // Cached stranded score thresholds
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
        this.isDemoMode = this.checkDemoMode();
        
        // Check if we're in dice mode (show pips instead of numbers)
        this.isDiceMode = this.checkDiceMode();
        
        // Detect if we're on a mobile device (iOS or Android)
        this.isMobileDevice = this.detectMobileDevice();
        
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
    
    checkDiceMode() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.has('dice');
    }
    
    checkDemoMode() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.has('demo');
    }

    getDiceCount() {
        const urlParams = new URLSearchParams(window.location.search);
        const diceCount = urlParams.get("diceCount");
        const parsed = diceCount ? parseInt(diceCount, 10) : 6;
        // Validate: must be between 0 and 9 (max inner grid positions)
        return isNaN(parsed) ? 6 : Math.max(0, Math.min(9, parsed));
    }
    
    getMaxDie() {
        const urlParams = new URLSearchParams(window.location.search);
        const maxDie = urlParams.get("maxDie");
        const parsed = maxDie ? parseInt(maxDie, 10) : 6;
        // Validate: must be between 1 and 9 (reasonable range)
        return isNaN(parsed) ? 6 : Math.max(1, Math.min(9, parsed));
    }
    
    calculateStrandedThresholds(strandedCounts) {
        if (!strandedCounts || Object.keys(strandedCounts).length === 0) {
            return null;
        }
        
        // Get total count and sort scores (excluding perfect score of 0)
        const nonZeroScores = Object.keys(strandedCounts)
            .map(Number)
            .filter(score => score > 0)
            .sort((a, b) => b - a); // Descending order (highest first)
            
        if (nonZeroScores.length === 0) return null;
        
        const totalNonZero = nonZeroScores.reduce((sum, score) => sum + strandedCounts[score], 0);
        const maxScore = Math.max(...nonZeroScores);
        
        const thresholds = {};
        const percentiles = {};
        
        // Calculate cumulative percentiles for each score
        let cumulative = 0;
        for (let i = 0; i < nonZeroScores.length; i++) {
            const score = nonZeroScores[i];
            cumulative += strandedCounts[score];
            percentiles[score] = cumulative / totalNonZero;
        }
        
        // Perfect: Always the maximum possible score
        thresholds.perfect = maxScore;
        
        // Amazing: Second-highest score (if different from perfect)
        if (nonZeroScores.length > 1 && nonZeroScores[1] < maxScore) {
            thresholds.amazing = nonZeroScores[1];
        }
        
        // Great: Recursively add scores up to 20% (excluding perfect)
        if (nonZeroScores.length > 1) {
            let cumulative = 0;
            let greatScore = null;
            
            // Start from the highest non-perfect score
            for (let i = 1; i < nonZeroScores.length; i++) {
                const score = nonZeroScores[i];
                cumulative += strandedCounts[score];
                
                const percentile = cumulative / totalNonZero;
                if (percentile <= 0.20) {
                    // This score and above is still under 20%, so we can use it
                    greatScore = score;
                } else {
                    // Adding this score would exceed 20%, so stop at previous
                    break;
                }
            }
            
            if (greatScore !== null) {
                thresholds.great = greatScore;
            }
        }
        
        // Remove "amazing" if it's the same as "great"
        if (thresholds.amazing === thresholds.great) {
            delete thresholds.amazing;
        }
        
        // If there's only one threshold between amazing and great, rename based on percentage
        if ((thresholds.amazing && !thresholds.great) || (!thresholds.amazing && thresholds.great)) {
            const singleThresholdScore = thresholds.amazing || thresholds.great;
            // Calculate cumulative percentage for this score and above
            const cumulativeCount = Object.keys(strandedCounts)
                .map(Number)
                .filter(score => score >= singleThresholdScore)
                .reduce((sum, score) => sum + strandedCounts[score], 0);
            const cumulativePercentage = cumulativeCount / totalNonZero;
            
            // If less than 15%, call it Amazing; otherwise Great
            if (cumulativePercentage < 0.15) {
                thresholds.amazing = singleThresholdScore;
                delete thresholds.great;
            } else {
                thresholds.great = singleThresholdScore;
                delete thresholds.amazing;
            }
        }
        
        // Store percentiles and counts for admin display
        thresholds._percentiles = percentiles;
        thresholds._strandedCounts = strandedCounts;
        thresholds._totalNonZero = totalNonZero;
        
        return thresholds;
    }
    
    cacheStrandedThresholds() {
        if (this.gameState.strandedThresholds) {
            return; // Already cached
        }
        
        // Run a quick analysis to get stranded counts
        const explored = { 
            count: 0, 
            finalOutcomes: 0, 
            solutions: 0, 
            strandedCounts: {}, 
            moveCounts: {},
            strandedExamples: {}, 
            stepExamples: {} 
        };
        const maxStranded = { score: 0, sequence: [], diceValues: [] };
        this.findAllSolutions(null, [], explored, maxStranded);
        
        // Calculate and cache thresholds
        this.gameState.strandedThresholds = this.calculateStrandedThresholds(explored.strandedCounts);
    }
    
    getStrandedThresholdLabel(score) {
        const thresholds = this.gameState.strandedThresholds;
        if (!thresholds) return '';
        
        if (score === thresholds.perfect) return 'Perfect';
        if (score === thresholds.amazing) return 'Amazing';
        if (score === thresholds.great) return 'Great';
        return '';
    }
    
    getStrandedScoreText() {
        const diceEmojis = this.dice.map(dice => this.EMOJI_MAP[dice.value]).join(' + ');
        const finalScore = this.getFinalScore();
        const thresholdLabel = this.getStrandedThresholdLabel(finalScore);
        return `Stranded Score: ${diceEmojis}${thresholdLabel ? ` (${thresholdLabel})` : ''}`;
    }
    
    createStrandedGuidanceHTML(hideMessage = false) {
        const thresholds = this.gameState.strandedThresholds;
        if (!thresholds) return '';
        
        let guidanceHTML = `<div>`;
        
        // Only show the message if not achieved
        if (!hideMessage) {
            guidanceHTML += `
                <div style="font-size: 14px; color: rgba(255,255,255,0.8); margin-bottom: 12px; text-align: center; padding: 0 20px;">
                    Try to clear the whole board, or aim for the highest possible Stranded Score.
                </div>
            `;
        }
        
        // Always show the table
        guidanceHTML += `<div class="scoring-grid">`;
        
        if (thresholds.great) {
            guidanceHTML += `
                <div class="scoring-row">
                    <div class="scoring-label">${thresholds.great}+ stranded</div>
                    <div class="scoring-value">Great</div>
                </div>
            `;
        }
        
        if (thresholds.amazing) {
            guidanceHTML += `
                <div class="scoring-row">
                    <div class="scoring-label">${thresholds.amazing}+ stranded</div>
                    <div class="scoring-value">Amazing</div>
                </div>
            `;
        }
        
        guidanceHTML += `
                </div>
            </div>
        `;
        
        return guidanceHTML;
    }
    
    detectMobileDevice() {
        const userAgent = navigator.userAgent.toLowerCase();
        const isIOS = /iphone|ipad|ipod/.test(userAgent);
        const isAndroid = /android/.test(userAgent);
        return isIOS || isAndroid;
    }
    
    getDailyPuzzleNumber() {
        // Simple epoch-based calculation - no timezone complications
        const LAUNCH_EPOCH = 1750046400000; // June 14, 2025 midnight ET in milliseconds
        const MS_PER_DAY = 24 * 60 * 60 * 1000;
        
        const now = Date.now();
        const daysSinceLaunch = Math.floor((now - LAUNCH_EPOCH) / MS_PER_DAY);
        const puzzleNumber = Math.max(1, daysSinceLaunch + 1); // Ensure minimum puzzle #1
        
        // Cycle through available puzzles (28 puzzles available)
        return ((puzzleNumber - 1) % DAILY_PUZZLES.length) + 1;
    }
    


    
    getDailyPuzzleData() {
        const puzzleNumber = this.getDailyPuzzleNumber();
        const puzzleIndex = puzzleNumber - 1; // Convert to 0-based index
        const encodedPuzzle = DAILY_PUZZLES[puzzleIndex];
        return this.decodePuzzleState(encodedPuzzle);
    }
    
    getFormattedDate() {
        // Use simple date formatting based on user's local timezone
        const today = new Date();
        return today.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long', 
            day: 'numeric'
        });
    }
    
    getCompletionMessage() {
        const moves = this.gameState.forwardMoves;
        const hints = this.gameState.hintCount;
        const runNumber = this.gameState.currentRunNumber;
        const ordinal = this.getOrdinal(runNumber);
        
        let message = `${ordinal} run: cleared in ${moves} moves!`;
        
        // Check if this is a perfect run
        const isPerfect = this.gameState.minStepsForPuzzle && 
            moves === this.gameState.minStepsForPuzzle && 
            hints === 0;
        
        if (isPerfect) {
            message = `${ordinal} run: cleared in ${moves} moves (perfect)!`;
        }
        // Don't show hints in the header - will show as emojis in share message
        
        return message;
    }
    
    getScoringGridHTML() {
        return `
            <div class="scoring-grid">
                <div class="scoring-row">
                    <span class="scoring-label">Hints:</span>
                    <span class="scoring-value">${this.gameState.hintCount}</span>
                </div>
                <div class="scoring-row">
                    <span class="scoring-label">Undos:</span>
                    <span class="scoring-value">${this.gameState.undoCount}</span>
                </div>
            </div>
        `;
    }
    
    getScoringGridText() {
        return `Moves: ${this.gameState.forwardMoves} | Hints: ${this.gameState.hintCount} | Undos: ${this.gameState.undoCount}`;
    }
    
    getScoringGridText() {
        return `Moves: ${this.gameState.forwardMoves} | Hints: ${this.gameState.hintCount} | Undos: ${this.gameState.undoCount}`;
    }
    
    createSeededRandom() {
        // Only used in admin mode for random puzzle generation
        return () => Math.random();
    }
    
    updateGameTitle() {
        const titleElement = document.getElementById('gameTitle');
        const subtitleElement = document.getElementById('puzzleSubtitle');
        
        if (this.isAdminMode) {
            titleElement.textContent = 'Disappearing Dice';
            subtitleElement.textContent = '';
        } else if (this.isDemoMode) {
            titleElement.textContent = 'Disappearing Dice';
            subtitleElement.textContent = 'Getting Started';
        } else {
            const puzzleNumber = this.getDailyPuzzleNumber();
            const formattedDate = this.getFormattedDate();
            titleElement.textContent = `Disappearing Dice #${puzzleNumber}`;
            subtitleElement.textContent = formattedDate;
        }
    }
    
    getRunHistoryHTML() {
        if (this.gameState.runHistory.length === 0) {
            return '';
        }
        
        const runTexts = this.gameState.runHistory.map(run => {
            const ordinal = this.getOrdinal(run.runNumber);
            let runText = `${ordinal} run: cleared in ${run.moves} moves`;
            
            if (run.completed) {
                if (run.perfect) {
                    runText += ' (perfect!)';
                } else if (run.hints === 0) {
                    runText += '';
                } else if (run.hints === 1) {
                    runText += ' (1 hint)';
                } else {
                    runText += ` (${run.hints} hints)`;
                }
            } else {
                runText = `${ordinal} run: ${run.moves} moves (incomplete)`;
            }
            
            return runText;
        });
        
        return `<div style="font-size: 14px; color: #ccc;">${runTexts.join('<br>')}</div>`;
    }
    
    getOrdinal(n) {
        const s = ["th", "st", "nd", "rd"];
        const v = n % 100;
        return n + (s[(v - 20) % 10] || s[v] || s[0]);
    }
    
    init() {
        // Check if there's a shared puzzle in URL
        if (!this.loadFromUrl()) {
            // Check for demo mode first
            if (this.isDemoMode) {
                // Demo mode: use tutorial puzzle
                this.loadDemoPuzzle();
            } else {
                // Both admin and daily mode: try daily puzzle first, fallback to random
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
            this.gameState.totalSteps = 0;
            this.gameState.usedAssists = false;
            // Reset scoring counters for new puzzle
            this.gameState.forwardMoves = 0;
            this.gameState.undoCount = 0;
            this.gameState.restartCount = 0;
            this.gameState.hintCount = 0;
            // Reset run tracking
            this.gameState.runHistory = [];
            this.gameState.currentRunNumber = 1;
            // Clear solution cache for new puzzle
            this.invalidateSolutionCache();
            // Calculate minimum steps for perfect detection
            this.calculateMinimumSteps();
            // Cache stranded thresholds for guidance
            this.cacheStrandedThresholds();
        } else {
            // Fallback to random generation if puzzle data is invalid
            this.placeDice();
        }
    }
    
    loadDemoPuzzle() {
        const puzzleData = this.decodePuzzleState(DEMO_PUZZLE);
        if (puzzleData) {
            // Create dice from demo puzzle data
            this.dice = puzzleData.positions.map((position, index) => ({
                value: puzzleData.values[index],
                position: position,
                id: `dice-${index}`
            }));
            // Store initial configuration for reset
            this.initialDice = this.dice.map(dice => ({ ...dice }));
            // Clear undo history and emoji sequence for demo puzzle
            this.gameState.history = [];
            this.gameState.totalSteps = 0;
            this.gameState.usedAssists = false;
            // Reset scoring counters for new puzzle
            this.gameState.forwardMoves = 0;
            this.gameState.undoCount = 0;
            this.gameState.restartCount = 0;
            this.gameState.hintCount = 0;
            // Reset run tracking
            this.gameState.runHistory = [];
            this.gameState.currentRunNumber = 1;
            // Clear solution cache for new puzzle
            this.invalidateSolutionCache();
            // Calculate minimum steps for perfect detection
            this.calculateMinimumSteps();
            // Cache stranded thresholds for guidance
            this.cacheStrandedThresholds();
        } else {
            // Fallback to random generation if demo puzzle data is invalid
            this.placeDice();
        }
    }
    
    getRandomDiceValue() {
        const maxDie = this.getMaxDie();
        return Math.floor(this.seedRandom() * maxDie) + 1;
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
        const diceCount = this.getDiceCount();
        // Select random positions from the inner 3x3 area
        while (selectedPositions.length < diceCount) {
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
        
        // Reset all scoring counters for new puzzle
        this.gameState.history = [];
        this.gameState.totalSteps = 0;
        this.gameState.usedAssists = false;
        this.gameState.forwardMoves = 0;
        this.gameState.undoCount = 0;
        this.gameState.restartCount = 0;
        this.gameState.hintCount = 0;
        this.gameState.backtrackCount = 0;
        
        // Clear solution cache for new puzzle
        this.invalidateSolutionCache();
        // Cache stranded thresholds for guidance
        this.cacheStrandedThresholds();
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
        this.gameState.showMobileTileHints = false;
        this.clearTargetPreview();
        this.clearPathArrows();
    }
    
    clearSelectedDie() {
        this.gameState.selectedDie = null;
        this.clearTransientState();
        // Note: Target preview is cleared via clearTransientState()
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
    
    generatePipsHTML() {
        // Generate 9 pip divs for the 3x3 grid layout
        let pipsHTML = '';
        for (let i = 1; i <= 9; i++) {
            pipsHTML += `<div class="pip"></div>`;
        }
        return pipsHTML;
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
    
    // Show path arrows from current position to target
    showPathArrows(path) {
        // Clear any existing arrows first
        this.clearPathArrows();
        
        const gridContainer = document.getElementById('grid');
        if (!gridContainer || !path || path.length < 2) return;
        
        // Calculate cell size more carefully
        // Grid has 10px padding, 2px gap between cells
        const gridPadding = 10;
        const gap = 2;
        const availableSpace = gridContainer.clientWidth - (2 * gridPadding);
        const cellSize = (availableSpace - (4 * gap)) / 5; // 4 gaps between 5 cells
        
        // Show arrows for each step in the path (except the last one, which is the target)
        for (let i = 0; i < path.length - 1; i++) {
            const fromPos = path[i];
            const toPos = path[i + 1];
            
            // Convert positions to row/col
            const [fromRow, fromCol] = this.positionToRowCol(fromPos);
            const [toRow, toCol] = this.positionToRowCol(toPos);
            
            // Calculate direction
            const deltaRow = toRow - fromRow;
            const deltaCol = toCol - fromCol;
            
            // Add path trail to intermediate cells (not start or end)
            if (i >= 0 && i < path.length - 2) {
                const nextPos = path[i + 2];
                const [nextRow, nextCol] = this.positionToRowCol(nextPos);
                const nextDeltaRow = nextRow - toRow;
                const nextDeltaCol = nextCol - toCol;
                
                // Add trail class to the intermediate cell
                const cell = document.querySelector(`[data-position="${toPos}"]`);
                if (cell && !this.dice.find(d => d.position === toPos)) {
                    // Determine the trail direction based on incoming and outgoing directions
                    let trailClass = 'path-trail';
                    
                    // Determine which corner is enclosed by the L-shaped path
                    // Based on the sequence of movements through the cell
                    
                    if (deltaRow === -1 && nextDeltaCol === -1) { // up+left: bottom left
                        trailClass += ' trail-bottom-left';
                    } else if (deltaRow === -1 && nextDeltaCol === 1) { // up+right: bottom right
                        trailClass += ' trail-bottom-right';
                    } else if (deltaCol === -1 && nextDeltaRow === 1) { // left+down: bottom right
                        trailClass += ' trail-bottom-right';
                    } else if (deltaCol === -1 && nextDeltaRow === -1) { // left+up: top right
                        trailClass += ' trail-top-right';
                    } else if (deltaRow === 1 && nextDeltaCol === 1) { // down+right: top right
                        trailClass += ' trail-top-right';
                    } else if (deltaRow === 1 && nextDeltaCol === -1) { // down+left: top-left
                        trailClass += ' trail-top-left';
                    } else if (deltaCol === 1 && nextDeltaRow === -1) { // right+up: top left
                        trailClass += ' trail-top-left';
                    } else if (deltaCol === 1 && nextDeltaRow === 1) { // right+down: bottom left
                        trailClass += ' trail-bottom-left';
                    } else {
                        // Straight line (no curve needed)
                        if (deltaRow !== 0) {
                            trailClass += ' trail-vertical';
                        } else {
                            trailClass += ' trail-horizontal';
                        }
                    }
                    
                    cell.classList.add(...trailClass.split(' '));
                }
            }
            
            // Determine arrow symbol
            let arrowSymbol = '';
            if (deltaRow === -1 && deltaCol === 0) { // Up
                arrowSymbol = '↑';
            } else if (deltaRow === 1 && deltaCol === 0) { // Down
                arrowSymbol = '↓';
            } else if (deltaRow === 0 && deltaCol === -1) { // Left
                arrowSymbol = '←';
            } else if (deltaRow === 0 && deltaCol === 1) { // Right
                arrowSymbol = '→';
            }
            
            if (arrowSymbol) {
                // Create triangle element
                const triangle = document.createElement('div');
                triangle.className = 'path-triangle';
                
                // Calculate cell positions including gaps
                const fromCellX = gridPadding + fromCol * (cellSize + gap);
                const fromCellY = gridPadding + fromRow * (cellSize + gap);
                const toCellX = gridPadding + toCol * (cellSize + gap);
                const toCellY = gridPadding + toRow * (cellSize + gap);
                
                // Calculate the exact position on the border between squares
                let posX, posY;
                
                if (deltaRow === -1 && deltaCol === 0) { // Up - on horizontal border above "from" cell
                    posX = fromCellX + cellSize / 2; // Center horizontally in from cell
                    posY = fromCellY - gap / 2 + 1; // On the top border, shifted back (down) 1px
                } else if (deltaRow === 1 && deltaCol === 0) { // Down - on horizontal border below "from" cell
                    posX = fromCellX + cellSize / 2; // Center horizontally in from cell  
                    posY = fromCellY + cellSize + gap / 2 + 3; // On the bottom border, shifted forward 3px
                } else if (deltaRow === 0 && deltaCol === -1) { // Left - on vertical border left of "from" cell
                    posX = fromCellX - gap / 2 + 1; // On the left border, shifted back (right) 1px
                    posY = fromCellY + cellSize / 2; // Center vertically in from cell
                } else if (deltaRow === 0 && deltaCol === 1) { // Right - on vertical border right of "from" cell
                    posX = fromCellX + cellSize + gap / 2 + 3; // On the right border, shifted forward 3px
                    posY = fromCellY + cellSize / 2; // Center vertically in from cell
                }
                
                // Set direction class for CSS triangle styling
                if (deltaRow === -1 && deltaCol === 0) { // Up
                    triangle.classList.add('triangle-up');
                } else if (deltaRow === 1 && deltaCol === 0) { // Down
                    triangle.classList.add('triangle-down');
                } else if (deltaRow === 0 && deltaCol === -1) { // Left
                    triangle.classList.add('triangle-left');
                } else if (deltaRow === 0 && deltaCol === 1) { // Right
                    triangle.classList.add('triangle-right');
                }
                
                // Center the triangle (assuming 12px triangle size)
                triangle.style.left = (posX - 6) + 'px';
                triangle.style.top = (posY - 6) + 'px';
                
                gridContainer.appendChild(triangle);
            }
        }
    }
    
    // Clear all path arrows
    clearPathArrows() {
        const arrows = document.querySelectorAll('.path-arrow');
        const triangles = document.querySelectorAll('.path-triangle');
        const trails = document.querySelectorAll('.path-trail');
        arrows.forEach(arrow => arrow.remove());
        triangles.forEach(triangle => triangle.remove());
        trails.forEach(trail => {
            // Remove all trail classes
            trail.classList.remove('path-trail', 'trail-top-left', 'trail-top-right', 
                'trail-bottom-left', 'trail-bottom-right', 'trail-vertical', 'trail-horizontal');
        });
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
            ? `<button id="newGameButton" class="game-btn new-game-btn">${BUTTON_LABELS.NEW_GAME}</button>`
            : '';
            
        const shareButtonHTML = this.isAdminMode 
            ? `<button id="shareButton" class="game-btn share-btn">${BUTTON_LABELS.SAVE}</button>`
            : '';
            
        const hintButtonHTML = this.isAdminMode 
            ? ''
            : `<button id="hintButton" class="game-btn hint-btn">${BUTTON_LABELS.HINT}</button>`;
            
        const buttonsHTML = `
            <div class="button-container">
                <button id="resetButton" class="game-btn undo-btn">${BUTTON_LABELS.RESTART}</button>
                <button id="undoButton" class="game-btn reset-btn">${BUTTON_LABELS.UNDO}</button>
                ${hintButtonHTML}
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
        
        // Get clickable positions for current transient tile
        const clickablePositions = this.gameState.transientTile && this.gameState.movesRemaining > 0 
            ? this.getClickablePositions(this.gameState.transientTile.position, this.gameState.movesRemaining) 
            : [];
        
        // Get valid moves for desktop hover styling (always show on desktop)
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
                    
                    // Add backtrack-valid class only for the last trail position (valid backtrack)
                    const trailLength = this.gameState.trailCells.length;
                    if (trailLength > 0 && position === this.gameState.trailCells[trailLength - 1]) {
                        cellClasses.push('backtrack-valid');
                    }
                }
                
                // Show desktop hover styling for valid moves (always on desktop)
                if (!this.isMobileDevice && validMoves.includes(position) && !dice) {
                    cellClasses.push('valid-move');
                }
                
                // Show mobile tile highlighting (mobile only, and only after tap not drag)
                if (this.isMobileDevice && this.gameState.showMobileTileHints && clickablePositions.includes(position)) {
                    cellClasses.push('clickable-move');
                }
                
                let cellContent = '';
                
                // Show transient tile if it's at this position
                if (this.gameState.transientTile && this.gameState.transientTile.position === position) {
                    const isSelected = this.gameState.selectedDie?.id === this.gameState.transientTile.originalDiceId;
                    const classes = ['dice'];
                    if (isSelected) classes.push('selected');
                    // Add disabled styling if out of moves and not at original position
                    if (this.gameState.movesRemaining === 0) classes.push('stranded');
                    const diceContent = this.isDiceMode ? this.generatePipsHTML() : this.gameState.transientTile.value;
                    const dataValue = this.isDiceMode ? `data-value="${this.gameState.transientTile.value}"` : '';
                    cellContent = `<div class="${classes.join(' ')}" data-dice-id="${this.gameState.transientTile.originalDiceId}" ${dataValue} tabindex="0">${diceContent}</div>`;
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
                        const diceContent = this.isDiceMode ? this.generatePipsHTML() : dice.value;
                        const dataValue = this.isDiceMode ? `data-value="${dice.value}"` : '';
                        cellContent = `<div class="${classes.join(' ')}" data-dice-id="${dice.id}" ${dataValue} tabindex="0">${diceContent}</div>`;
                    }
                }
                
                // Add shadow dice at start position if dice is moving
                if (this.gameState.selectedDie &&
                    this.gameState.selectedDie.position === position &&
                    this.gameState.transientTile &&
                    this.gameState.transientTile.position !== position &&
                    this.gameState.movesRemaining < this.gameState.selectedDie.value) {
                    const shadowContent = this.isDiceMode ? this.generatePipsHTML() : this.gameState.selectedDie.value;
                    const shadowDataValue = this.isDiceMode ? `data-value="${this.gameState.selectedDie.value}"` : '';
                    cellContent += `<div class="dice shadow" ${shadowDataValue}>${shadowContent}</div>`;
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
                // Perfect score celebration!
                
                // Track completed run
                const isPerfect = this.gameState.minStepsForPuzzle && 
                    this.gameState.forwardMoves === this.gameState.minStepsForPuzzle && 
                    this.gameState.hintCount === 0;
                
                this.gameState.runHistory.push({
                    runNumber: this.gameState.currentRunNumber,
                    moves: this.gameState.forwardMoves,
                    hints: this.gameState.hintCount,
                    completed: true,
                    perfect: isPerfect
                });
                    
                const scoringGridHTML = this.getScoringGridHTML();
                
                gridHTML += `
                    <div id="gameOverOverlay" class="win-celebration">
                        <div class="win-title">Run complete</div>
                        <div class="win-subtitle">${this.getCompletionMessage()}</div>
                        ${scoringGridHTML}
                        <div class="final-dice-container">${finalDiceHTML}</div>
                        <div style="margin-top: 20px; text-align: center;">
                            ${this.isDemoMode ? '' : '<button id="shareSolutionButton" class="game-btn share-btn" style="padding: 12px 24px; min-width: 120px;">Share</button>'}
                            <div id="shareSolutionMessage" style="opacity: 0; height: 0; line-height: 0; position: relative; top: 16px; color: white; text-align: center; font-size: 14px; transition: opacity 0.3s ease;"></div>
                        </div>
                    </div>
                `;
            } else {
                // Stranded score celebration - use consistent text generation
                const strandedSubtitle = this.getStrandedScoreText();
                const finalScore = this.getFinalScore();
                const thresholdLabel = this.getStrandedThresholdLabel(finalScore);
                
                // Create guidance table if thresholds exist
                let guidanceHTML = '';
                if (this.gameState.strandedThresholds && !this.isDemoMode) {
                    // Hide message if achievement unlocked, but always show table
                    guidanceHTML = this.createStrandedGuidanceHTML(!!thresholdLabel);
                }
                
                const strandedDiceDisplay = ''; // No separate dice display
                
                gridHTML += `
                    <div id="gameOverOverlay" class="stranded-celebration">
                        <div class="stranded-title">Run complete</div>
                        <div class="win-subtitle">${strandedSubtitle}</div>
                        ${guidanceHTML}
                        ${strandedDiceDisplay}
                        <div style="margin-top: 20px; text-align: center;">
                            ${this.isDemoMode ? '' : '<button id="shareSolutionButton" class="game-btn share-btn" style="padding: 12px 24px; min-width: 120px;">Share</button>'}
                            <div id="shareSolutionMessage" style="opacity: 0; height: 0; line-height: 0; position: relative; top: 16px; color: white; text-align: center; font-size: 14px; transition: opacity 0.3s ease;"></div>
                        </div>
                    </div>
                `;
            }
        }
        
        // Save existing path arrows/triangles/trails before clearing grid
        const gridContainer = document.getElementById('grid');
        const existingArrows = gridContainer ? Array.from(gridContainer.querySelectorAll('.path-arrow, .path-triangle')) : [];
        const existingTrails = gridContainer ? Array.from(gridContainer.querySelectorAll('.path-trail')) : [];
        const arrowData = existingArrows.map(arrow => ({
            className: arrow.className,
            textContent: arrow.textContent,
            left: arrow.style.left,
            top: arrow.style.top
        }));
        const trailData = existingTrails.map(trail => ({
            position: trail.dataset.position,
            className: trail.className
        }));
        
        // Update only the grid content
        if (gridContainer) {
            gridContainer.innerHTML = gridHTML;
            
            // Restore path arrows after innerHTML replacement
            arrowData.forEach(arrow => {
                const arrowElement = document.createElement('div');
                arrowElement.className = arrow.className;
                arrowElement.textContent = arrow.textContent;
                arrowElement.style.position = 'absolute';
                arrowElement.style.left = arrow.left;
                arrowElement.style.top = arrow.top;
                gridContainer.appendChild(arrowElement);
            });
            
            // Restore trail classes after innerHTML replacement
            trailData.forEach(trail => {
                const cell = gridContainer.querySelector(`[data-position="${trail.position}"]`);
                if (cell) {
                    // Add trail classes without replacing existing classes
                    const trailClasses = trail.className.split(' ').filter(cls => cls.startsWith('trail-') || cls === 'path-trail');
                    cell.classList.add(...trailClasses);
                }
            });
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
        // Track completed run if moves were made
        if (this.gameState.forwardMoves > 0) {
            this.gameState.runHistory.push({
                runNumber: this.gameState.currentRunNumber,
                moves: this.gameState.forwardMoves,
                hints: this.gameState.hintCount,
                completed: false // Didn't complete, just restarted
            });
            this.gameState.currentRunNumber++;
        }
        
        // Mark that reset was used (counts as assist)
        this.gameState.usedAssists = true;
        this.gameState.restartCount++;
        
        // Reset dice to initial configuration (whatever was originally loaded)
        this.dice = this.initialDice.map(dice => ({ ...dice }));
        
        // Invalidate solution cache since dice state changed
        this.invalidateSolutionCache();

        // Reset game state
        this.clearSelectedDie();
        this.clearTargetPreview(); // Clear hint when resetting
        this.clearPathArrows(); // Clear path arrows when resetting
        this.clearHintMessage(); // Clear any hint message
        // Clear undo history
        this.gameState.history = [];
        this.gameState.totalSteps = 0;
        // Reset scoring for new run
        this.gameState.forwardMoves = 0;
        this.gameState.undoCount = 0;
        this.gameState.hintCount = 0;
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
        
        // Invalidate solution cache since dice state changed
        this.invalidateSolutionCache();
        
        // Clear cached thresholds since this is a new puzzle
        this.gameState.strandedThresholds = null;
        // Recalculate thresholds for the new puzzle
        this.cacheStrandedThresholds();
        
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
            puzzleTitle = 'Disappearing Dice';
        } else {
            const puzzleNumber = this.getDailyPuzzleNumber();
            puzzleTitle = `Disappearing Dice #${puzzleNumber}`;
        }
        
        const finalScore = this.getFinalScore();
        let shareText;
        
        if (finalScore === 0) {
            // Perfect score - just current run
            const resultText = this.getCompletionMessage();
            shareText = `${puzzleTitle}\n${resultText}`;
        } else {
            // Stranded score - use consistent text generation
            const strandedText = this.getStrandedScoreText();
            shareText = `${puzzleTitle}\n${strandedText}`;
        }
        
        // Add hints as emojis if more than 0
        if (this.gameState.hintCount > 0) {
            const hintEmojis = '💡'.repeat(this.gameState.hintCount);
            shareText += `\nhints: ${hintEmojis}`;
        }
        
        // Add undos as emojis if more than 0
        if (this.gameState.undoCount > 0) {
            const undoEmojis = '🔄'.repeat(this.gameState.undoCount);
            shareText += `\nundos: ${undoEmojis}`;
        }
        
        // Add current URL to the share message
        const currentUrl = window.location.href;
        shareText += `\n\n${currentUrl}`;
        
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
            
            // Fallback for older browsers or non-secure contexts
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            this.showSolutionShareMessage('Solution copied to clipboard!');
        }
        catch (err) {
            console.error('Copy failed:', err);
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
    
    parseSimpleGridPuzzle(gridString) {
        // Parse 9-digit string like "123000456" as 3x3 grid
        // Maps to inner 3x3 positions: 6,7,8 / 11,12,13 / 16,17,18
        const innerPositions = [6, 7, 8, 11, 12, 13, 16, 17, 18];
        const positions = [];
        const values = [];
        
        for (let i = 0; i < 9; i++) {
            const digit = parseInt(gridString[i]);
            if (digit > 0 && digit <= 9) { // Valid dice value
                positions.push(innerPositions[i]);
                values.push(digit);
            }
        }
        
        if (positions.length === 0) {
            return null; // No valid dice
        }
        
        return { positions, values };
    }
    
    loadFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        const puzzleParam = urlParams.get('puzzle');
        if (!puzzleParam) {
            return false;
        }
        
        // Check if it's a simple 9-digit grid format (e.g., "123000456")
        let puzzleData;
        if (/^\d{9}$/.test(puzzleParam)) {
            puzzleData = this.parseSimpleGridPuzzle(puzzleParam);
        } else {
            puzzleData = this.decodePuzzleState(puzzleParam);
        }
        
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
        // Reset scoring counters for new puzzle
        this.gameState.forwardMoves = 0;
        this.gameState.undoCount = 0;
        this.gameState.restartCount = 0;
        this.gameState.hintCount = 0;
        this.gameState.backtrackCount = 0;
        // Reset run tracking
        this.gameState.runHistory = [];
        this.gameState.currentRunNumber = 1;
        // Clear solution cache for new puzzle
        this.invalidateSolutionCache();
        // Calculate minimum steps for perfect detection
        this.calculateMinimumSteps();
        // Cache stranded thresholds for guidance
        this.cacheStrandedThresholds();
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
            
            // Hide "Getting Started" section in demo mode
            if (this.isDemoMode) {
                const gettingStartedSection = document.getElementById('gettingStartedSection');
                if (gettingStartedSection) {
                    gettingStartedSection.style.display = 'none';
                }
            }
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
                    // Check if the die has moved from its starting position
                    if (this.hasMovedFromStart()) {
                        // Die has moved - just clear movement state but keep die selected
                        this.gameState.movesRemaining = this.gameState.selectedDie.value;
                        this.gameState.transientTile = {
                            position: this.gameState.selectedDie.position,
                            value: this.gameState.selectedDie.value,
                            originalDiceId: this.gameState.selectedDie.id
                        };
                        this.gameState.trailCells = [];
                        this.gameState.showMobileTileHints = false;
                        this.clearTargetPreview(); // Clear hint when pressing Escape
                        this.clearPathArrows(); // Clear path arrows when pressing Escape
                        this.render();
                    } else {
                        // Die hasn't moved - deselect entirely
                        this.clearSelectedDie();
                        this.clearTargetPreview(); // Clear hint when pressing Escape
                        this.clearPathArrows(); // Clear path arrows when pressing Escape
                        this.render();
                    }
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
            
            // Priority 1.5: Check for backtrack attempt (works even with 0 moves remaining)
            if (this.gameState.transientTile) {
                const trailLength = this.gameState.trailCells.length;
                const isBacktrackPosition = trailLength > 0 && position === this.gameState.trailCells[trailLength - 1];
                
                if (isBacktrackPosition) {
                    this.gameState.inputMethod = 'pointer';
                    if (this.moveToPosition(position)) {
                        return; // Successful backtrack, no need for drag setup
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
                
                // Early return if die is already selected and hasn't moved yet (allows drag without clearing arrows)
                if (this.gameState.selectedDie && 
                    diceAtPosition.id === this.gameState.selectedDie.id && 
                    this.gameState.trailCells.length === 0) {
                    // Continue with drag setup without re-selecting
                } else {
                    this.selectDice(diceAtPosition.id);
                }
                // Clear lastInputMethod since we're now using pointer input
                this.gameState.lastInputMethod = null;
                // Continue with drag setup in case user wants to drag
            } else {
                // Clicked on empty space - check if it's a valid move or should deselect
                if (this.gameState.selectedDie) {
                    const clickablePositions = this.gameState.movesRemaining > 0 
                        ? this.getClickablePositions(this.gameState.transientTile.position, this.gameState.movesRemaining)
                        : [];
                    
                    // Also check if this is a valid backtrack position (works even with 0 moves remaining)
                    const trailLength = this.gameState.trailCells.length;
                    const isBacktrackPosition = trailLength > 0 && position === this.gameState.trailCells[trailLength - 1];
                    
                    if (!clickablePositions.includes(position) && !isBacktrackPosition) {
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
                // If we didn't actually drag (just a tap), enable mobile tile hints
                if (!actuallyMoved && this.isMobileDevice && this.gameState.selectedDie) {
                    this.gameState.showMobileTileHints = true;
                    this.render(); // Re-render to show the tile hints
                }
                
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
            this.clearPathArrows(); // Clear path arrows when selecting different die
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
            
            // For keyboard input, immediately show mobile tile hints
            if (this.gameState.inputMethod === 'keyboard' && this.isMobileDevice) {
                this.gameState.showMobileTileHints = true;
            }
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

    getClickablePositions(fromPosition, movesRemaining) {
        const clickablePositions = [];
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]]; // up, down, left, right
        const isLastMove = movesRemaining === 1;
        
        for (const direction of directions) {
            const [currentRow, currentCol] = this.positionToRowCol(fromPosition);
            const [deltaRow, deltaCol] = direction;
            const newRow = currentRow + deltaRow;
            const newCol = currentCol + deltaCol;
            
            // Check bounds
            if (newRow < 0 || newRow >= 5 || newCol < 0 || newCol >= 5) {
                continue;
            }
            
            const newPosition = this.rowColToPosition(newRow, newCol);
            const diceAtPosition = this.getDiceAtPosition(newPosition);
            
            // Can't move back through trail cells (keep trail styling, don't add clickable styling)
            if (this.gameState.trailCells.includes(newPosition)) {
                continue;
            }
            
            // For non-final moves: only empty adjacent squares are clickable
            // For final moves: both empty squares AND squares with dice are clickable
            if (isLastMove || !diceAtPosition) {
                clickablePositions.push(newPosition);
            }
        }
        
        return clickablePositions;
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
            totalSteps: this.gameState.totalSteps,
            // Save the die value that was moved for undo tracking
            movedDieValue: this.gameState.selectedDie ? this.gameState.selectedDie.value : 0
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
        this.gameState.undoCount++;
        
        // Restore the previous state
        const previousState = this.gameState.history.pop();
        
        // Decrement forwardMoves by the die value that was moved
        if (previousState.movedDieValue) {
            this.gameState.forwardMoves -= previousState.movedDieValue;
        }
        
        this.dice = previousState.dice;
        // Don't restore initialDice - it should never change from original puzzle
        this.gameState.totalSteps = previousState.totalSteps;
        // Don't restore scoring counters - they should never decrease
        
        // Invalidate solution cache since dice state changed
        this.invalidateSolutionCache();
        
        // Clear any active movement state
        this.clearSelectedDie();
        this.clearTargetPreview(); // Clear hint when undoing
        this.clearPathArrows(); // Clear path arrows when undoing
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
        this.gameState.hintCount++;
        
        // Get all solutions using caching
        const solutions = this.getSolutionsWithCaching();
        
        if (solutions.length === 0) {
            this.showHintMessage("No solutions exist from here. Press undo to go back a step.");
            return; // No solutions available
        }
        
        // Calculate step counts for each solution and prefer suboptimal ones
        const solutionsWithSteps = solutions.map(solution => {
            const totalSteps = solution.reduce((total, moveDesc) => {
                // Extract the first number in parentheses (moving die's value)
                const match = moveDesc.match(/\((\d+)\)/);
                const steps = match ? parseInt(match[1]) : 0;
                return total + steps;
            }, 0);
            return { solution, totalSteps };
        });
        
        // Find minimum step count
        const minSteps = Math.min(...solutionsWithSteps.map(s => s.totalSteps));
        
        // Prefer first suboptimal solution, or first optimal if all are optimal
        const suboptimalSolutions = solutionsWithSteps.filter(s => s.totalSteps > minSteps);
        const chosenSolution = suboptimalSolutions.length > 0 
            ? suboptimalSolutions[0].solution 
            : solutionsWithSteps[0].solution;
        
        const firstSolution = chosenSolution;
        const firstMove = firstSolution[0];
        
        // Parse the first move to extract the starting position
        // Format is like: "A1(3) -> B2(4)"
        const moveMatch = firstMove.match(/^([A-E][1-5])\(\d+\)/);
        if (!moveMatch) {
            return; // Couldn't parse move
        }
        
        const startPos = moveMatch[1]; // e.g., "A1"
        
        // Convert chess notation back to position number
        const col = startPos.charCodeAt(0) - 'A'.charCodeAt(0); // A=0, B=1, etc.
        const row = parseInt(startPos[1]) - 1; // 1=0, 2=1, etc. (we use natural numbering)
        const position = row * 5 + col;
        
        // Find the die at this position
        const hintDie = this.dice.find(die => die.position === position);
        
        if (hintDie) {
            // Clear any current selection and select the hint die
            this.clearSelectedDie();
            
            // Parse the target position from the first move
            const targetMatch = firstMove.match(/-> ([A-E][1-5])\(\d+\)/);
            let targetDie = null;
            let targetPosition = null;
            if (targetMatch) {
                const targetPos = targetMatch[1];
                const targetCol = targetPos.charCodeAt(0) - 'A'.charCodeAt(0);
                const targetRow = parseInt(targetPos[1]) - 1;
                targetPosition = targetRow * 5 + targetCol;
                targetDie = this.dice.find(die => die.position === targetPosition);
            }
            
            // Use setTimeout to avoid race conditions with other click handlers
            setTimeout(() => {
                this.selectDice(hintDie.id);
                
                // Show path arrows instead of target preview
                if (targetDie && targetPosition !== null) {
                    const path = this.findValidPath(position, targetPosition, this, hintDie.value);
                    if (path) {
                        this.showPathArrows(path);
                    }
                }
            }, 10); // Small delay to ensure other event handlers complete first
        }
    }
    
    updateUndoButton() {
        const undoButton = document.getElementById('undoButton');
        if (undoButton) {
            // Disable undo button when no history available or game is over
            undoButton.disabled = this.gameState.history.length === 0 || this.isGameOver();
        }
    }
    
    updateStartOverButton() {
        const startOverButton = document.getElementById('resetButton');
        if (startOverButton) {
            // Disable restart button when no moves have been made
            const hasMadeAnyMoves = this.gameState.history.length > 0 || 
                                  this.gameState.selectedDie || 
                                  this.gameState.totalSteps > 0;
            startOverButton.disabled = !hasMadeAnyMoves;
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
            // Hint button only disabled when game is over
            hintButton.disabled = this.isGameOver();
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
            this.gameState.forwardMoves--; // Decrement forward moves counter
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
        
        // Track forward move
        this.gameState.forwardMoves++;
        
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
        this.clearPathArrows(); // Clear path arrows when collision occurs
        
        // Add the moving die's value to step count (this represents the move that just completed)
        this.gameState.totalSteps += movingDice.value;
        
        // Track emoji for this collision
        // Always add the die that moved
        
        if (movingDice.value === targetDice.value) {
            // Same values: both dice disappear → add explosion emoji
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
            
            // Invalidate solution cache since dice state changed
            this.invalidateSolutionCache();
            
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
        
        // Invalidate solution cache since dice state changed
        this.invalidateSolutionCache();
        
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
    
    // === SOLUTION CACHING METHODS ===
    
    getSolutionsWithCaching() {
        // Check if we have cached solutions
        if (this.gameState.cachedSolutions !== null) {
            return this.gameState.cachedSolutions;
        }
        
        // Calculate and cache solutions
        const solutions = this.findAllSolutions();
        this.gameState.cachedSolutions = solutions;
        return solutions;
    }
    
    invalidateSolutionCache() {
        this.gameState.cachedSolutions = null;
    }
    
    calculateMinimumSteps() {
        const solutions = this.getSolutionsWithCaching();
        if (solutions.length === 0) {
            this.gameState.minStepsForPuzzle = null;
            return;
        }
        
        // Calculate total steps for each solution
        const stepsArray = solutions.map(solution => {
            return solution.reduce((total, moveDesc) => {
                // Extract the first number in parentheses (moving die's value)
                const match = moveDesc.match(/\((\d+)\)/);
                const steps = match ? parseInt(match[1]) : 0;
                return total + steps;
            }, 0);
        });
        
        // Find minimum steps
        this.gameState.minStepsForPuzzle = Math.min(...stepsArray);
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
    
    // Find the actual path from one position to another (returns array of positions)
    findValidPath(fromPosition, toPosition, gameState, stepsRemaining, visitedPositions = new Set(), currentPath = []) {
        // Base case: if we've reached the target
        if (fromPosition === toPosition) {
            if (stepsRemaining === 0) {
                return [...currentPath, fromPosition]; // Return the complete path
            }
            return null; // Must use exact number of steps
        }
        
        // Base case: if we're out of steps
        if (stepsRemaining <= 0) {
            return null;
        }
        
        // Base case: if we've been to this position before (avoid loops)
        if (visitedPositions.has(fromPosition)) {
            return null;
        }
        
        // Add current position to visited and path
        const newVisited = new Set(visitedPositions);
        newVisited.add(fromPosition);
        const newPath = [...currentPath, fromPosition];
        
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
            const pathResult = this.findValidPath(newPosition, toPosition, gameState, stepsRemaining - 1, newVisited, newPath);
            if (pathResult) {
                return pathResult; // Return the first valid path found
            }
        }
        
        return null; // No valid path found
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
    
    findAllSolutions(gameState = null, moveSequence = [], explored = null, maxStranded = null) {
        if (!gameState) {
            gameState = {
                dice: this.dice.map(die => ({
                    id: die.id,
                    value: die.value,
                    position: die.position
                }))
            };
        }
        
        // Initialize explored counter and max stranded tracker if this is the root call
        if (explored === null) {
            explored = { 
                count: 0, 
                finalOutcomes: 0, 
                solutions: 0, 
                strandedCounts: {}, 
                moveCounts: {},
                strandedExamples: {}, // Representative solutions for each stranded score
                stepExamples: {} // Representative solutions for each step count
            };
        }
        if (maxStranded === null) {
            maxStranded = { score: 0, sequence: [], diceValues: [] };
        }
        
        // Increment the count of explored move sequences (for debugging)
        explored.count++;
        
        // Base case: if score is 0, we found a solution
        const currentScore = gameState.dice.reduce((sum, die) => sum + die.value, 0);
        if (currentScore === 0) {
            explored.finalOutcomes++;
            explored.solutions++;
            
            // Track perfect solutions in stranded counts too
            if (explored.strandedCounts[0]) {
                explored.strandedCounts[0]++;
            } else {
                explored.strandedCounts[0] = 1;
                // Store first example of perfect solution
                explored.strandedExamples[0] = moveSequence.slice();
            }
            
            // Track total steps (sum of face values) for this solution
            const totalSteps = moveSequence.reduce((total, moveDesc) => {
                // Extract the first number in parentheses (moving die's value)
                const match = moveDesc.match(/\((\d+)\)/);
                const steps = match ? parseInt(match[1]) : 0;
                return total + steps;
            }, 0);
            if (explored.moveCounts[totalSteps]) {
                explored.moveCounts[totalSteps]++;
            } else {
                explored.moveCounts[totalSteps] = 1;
                // Store first example of this step count
                explored.stepExamples[totalSteps] = moveSequence.slice();
            }
            
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
        
        // If no valid moves, check if this is a new maximum stranded score
        if (validMoves.length === 0) {
            explored.finalOutcomes++;
            
            // Track stranded score count
            if (explored.strandedCounts[currentScore]) {
                explored.strandedCounts[currentScore]++;
            } else {
                explored.strandedCounts[currentScore] = 1;
                // Store first example of this stranded score
                explored.strandedExamples[currentScore] = moveSequence.slice();
            }
            
            if (currentScore > maxStranded.score) {
                maxStranded.score = currentScore;
                maxStranded.sequence = moveSequence.slice();
                maxStranded.diceValues = gameState.dice.map(die => die.value).sort((a, b) => a - b);
            }
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
            const solutions = this.findAllSolutions(newState, newMoveSequence, explored, maxStranded);
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
        
        // Create visual grid
        displayText += `<div style="font-family: monospace; margin: 10px 0; line-height: 1.2; white-space: pre;">`;
        displayText += `  A B C D E<br>`;
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
        
        const explored = { 
            count: 0, 
            finalOutcomes: 0, 
            solutions: 0, 
            strandedCounts: {}, 
            moveCounts: {},
            strandedExamples: {}, 
            stepExamples: {} 
        };
        const maxStranded = { score: 0, sequence: [], diceValues: [] };
        const solutions = this.getSolutionsWithCaching();
        
        // For admin display, always run detailed analysis
        this.findAllSolutions(null, [], explored, maxStranded);
        
        const solutionCount = solutions.length;
        const exploredCount = explored.count;
        const percentage = explored.finalOutcomes > 0 ? ((solutionCount / explored.finalOutcomes) * 100).toFixed(3) : '0.000';
        
        const deadEndCount = explored.finalOutcomes - solutionCount;
        displayText += `<strong>Found ${solutionCount} solution${solutionCount !== 1 ? 's' : ''} & ${deadEndCount} dead end${deadEndCount !== 1 ? 's' : ''} (${percentage}%)</strong>`;
        
        // Removed individual solution lists and max stranded display
        // Representative solutions will be shown inline with statistics below
        
        // Show stranded score distribution as table
        if (explored.strandedCounts && Object.keys(explored.strandedCounts).length > 0) {
            displayText += `<br><br><strong>Stranded score distribution:</strong><br>`;
            displayText += `<table style="border-collapse: collapse; margin: 8px auto;">`;
            displayText += `<tr style="background: rgba(255,255,255,0.1);"><th style="padding: 6px 12px; border: 1px solid #666; text-align: left;">Description</th><th style="padding: 6px 12px; border: 1px solid #666; text-align: right;">Count</th><th style="padding: 6px 12px; border: 1px solid #666; text-align: left;">Example</th></tr>`;
            
            // Sort by score for better readability
            const sortedScores = Object.keys(explored.strandedCounts).map(Number).sort((a, b) => a - b);
            sortedScores.forEach(score => {
                const count = explored.strandedCounts[score];
                const label = score === 0 ? 'Perfect' : `${score} Stranded`;
                let example = '';
                
                // Add representative solution
                if (explored.strandedExamples[score]) {
                    const exampleSolution = explored.strandedExamples[score];
                    if (exampleSolution.length > 0) {
                        example = exampleSolution.join(', ');
                    }
                }
                
                displayText += `<tr><td style="padding: 6px 12px; border: 1px solid #666;">${label}</td><td style="padding: 6px 12px; border: 1px solid #666; text-align: right;">${count}</td><td style="padding: 6px 12px; border: 1px solid #666; font-style: italic;">${example}</td></tr>`;
            });
            displayText += `</table>`;
        }
        
        // Show cached thresholds (from initial puzzle analysis)
        if (this.gameState.strandedThresholds) {
            const thresholds = this.gameState.strandedThresholds;
            displayText += `<br><strong>Calculated Thresholds (cached from initial puzzle):</strong><br>`;
            displayText += `<div style="font-family: monospace; background: rgba(255,255,255,0.1); padding: 8px; border-radius: 4px; margin: 8px 0;">`;
            
            if (thresholds.great && thresholds._percentiles) {
                // Calculate cumulative percentage for "at least" this score
                const greatPercentile = thresholds._percentiles[thresholds.great];
                const greatPercentage = (greatPercentile * 100).toFixed(1);
                displayText += `Great: ${thresholds.great}+ stranded (${greatPercentage}%)<br>`;
            }
            
            if (thresholds.amazing && thresholds._percentiles) {
                // Calculate cumulative percentage for "at least" this score
                const amazingCount = thresholds._strandedCounts[thresholds.amazing];
                const amazingAndHigherCount = Object.keys(thresholds._strandedCounts)
                    .map(Number)
                    .filter(score => score >= thresholds.amazing)
                    .reduce((sum, score) => sum + thresholds._strandedCounts[score], 0);
                const amazingPercentage = ((amazingAndHigherCount / thresholds._totalNonZero) * 100).toFixed(1);
                displayText += `Amazing: ${thresholds.amazing}+ stranded (${amazingPercentage}%)<br>`;
            }
            
            if (thresholds.perfect && thresholds._strandedCounts) {
                const perfectCount = thresholds._strandedCounts[thresholds.perfect];
                const perfectPercentage = ((perfectCount / thresholds._totalNonZero) * 100).toFixed(1);
                displayText += `Perfect: exactly ${thresholds.perfect} (${perfectPercentage}%)<br>`;
            }
            
            displayText += `</div>`;
        }
        
        // Show step count distribution as table (perfect solutions only)
        if (explored.moveCounts && Object.keys(explored.moveCounts).length > 0) {
            displayText += `<br><br><strong>Step count distribution:</strong><br>`;
            displayText += `<table style="border-collapse: collapse; margin: 8px auto;">`;
            displayText += `<tr style="background: rgba(255,255,255,0.1);"><th style="padding: 6px 12px; border: 1px solid #666; text-align: left;">Description</th><th style="padding: 6px 12px; border: 1px solid #666; text-align: right;">Count</th><th style="padding: 6px 12px; border: 1px solid #666; text-align: left;">Example</th></tr>`;
            
            // Sort by step count for better readability
            const sortedSteps = Object.keys(explored.moveCounts).map(Number).sort((a, b) => a - b);
            sortedSteps.forEach(steps => {
                const count = explored.moveCounts[steps];
                const label = steps === 1 ? '1 step' : `${steps} steps`;
                let example = '';
                
                // Add representative solution
                if (explored.stepExamples[steps]) {
                    const exampleSolution = explored.stepExamples[steps];
                    if (exampleSolution.length > 0) {
                        example = exampleSolution.join(', ');
                    }
                }
                
                displayText += `<tr><td style="padding: 6px 12px; border: 1px solid #666;">${label}</td><td style="padding: 6px 12px; border: 1px solid #666; text-align: right;">${count}</td><td style="padding: 6px 12px; border: 1px solid #666; font-style: italic;">${example}</td></tr>`;
            });
            displayText += `</table>`;
        }
        
        displayText += `</div>`;
        this.solutionDisplay.innerHTML = displayText;
    }
}
// Start the game when the page loads
window.addEventListener('DOMContentLoaded', () => {
    new Game();
});
