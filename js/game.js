/**
 * Pacman Game - Main Game Logic and Loop
 * Modern JavaScript implementation with ES6+ features
 */

// Game constants
const GAME_CONFIG = {
    CLASSIC_COLS: 28,
    CLASSIC_ROWS: 31,
    GRID_SIZE: 19,
    get CANVAS_WIDTH() { return this.CLASSIC_COLS * this.GRID_SIZE; },
    get CANVAS_HEIGHT() { return this.CLASSIC_ROWS * this.GRID_SIZE; },
    GAME_SPEED: 200, // pixels per second
    FPS_TARGET: 60,
    MAX_DELTA_TIME: 1/30 // Cap delta time to prevent huge jumps
};

// Game state management
class GameState {
    constructor() {
        this.current = 'loading'; // loading, playing, paused, gameOver, menu
        this.score = 0;
        this.level = 1;
        this.lives = 3;
        this.pelletsRemaining = 0;
        this.powerPelletActive = false;
        this.powerPelletTimer = 0;
        this.gameStartTime = 0;
    }
    
    reset() {
        this.current = 'playing';
        this.score = 0;
        this.level = 1;
        this.lives = 3;
        this.pelletsRemaining = 0;
        this.powerPelletActive = false;
        this.powerPelletTimer = 0;
        this.gameStartTime = Date.now();
    }
    
    addScore(points) {
        this.score += points;
        this.updateUI();
    }
    
    loseLife() {
        this.lives--;
        if (this.lives <= 0) {
            this.current = 'gameOver';
        }
        this.updateUI();
    }
    
    nextLevel() {
        this.level++;
        this.updateUI();
    }
    
    updateUI() {
        // Update UI elements
        const scoreEl = document.getElementById('score');
        const levelEl = document.getElementById('level');
        const livesEl = document.getElementById('lives');
        
        if (scoreEl) scoreEl.textContent = this.score.toLocaleString();
        if (levelEl) levelEl.textContent = this.level;
        if (livesEl) livesEl.textContent = this.lives;
    }
}

// Main Game class
class PacmanGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.state = new GameState();
        
        // Game timing
        this.lastFrameTime = 0;
        this.animationId = null;
        this.fps = 0;
        this.frameCount = 0;
        this.lastFPSUpdate = 0;
        
        // Game objects (will be populated by other modules)
        this.pacman = null;
        this.ghosts = [];
        this.pellets = [];
        this.powerPellets = [];
        this.walls = [];
        this.particles = [];
        
        // Offscreen layers for performance
        this.layers = {
            maze: document.createElement('canvas'),
            pellets: document.createElement('canvas')
        };
        this.powerPelletPositions = [];
        this._bgGradient = null;
        this._vignette = null;

        // Visual settings
        this.settings = { lowGlow: false };
        
        // Input handling
        this.keys = {
            up: false,
            down: false,
            left: false,
            right: false,
            space: false
        };
        
        this.gameMap = this.createDefaultMap();
        
        // Initialize
        this.init();
    }
    
    // Toggle visual intensity and rebuild static layers
    setLowGlow(enabled) {
        this.settings.lowGlow = !!enabled;
        this.buildStaticLayers();
    }
    
    init() {
        console.log('🎮 Initializing Pacman Game...');
        
        // Mobile-friendly: compute GRID_SIZE to fit viewport and size canvas
        this.resizeToViewport(true);
        this.canvas.focus();
        const ui = document.getElementById('gameUI');
        if (ui) ui.style.width = `${this.canvas.width}px`;
        // Expose canvas width for CSS positioning if needed
        document.documentElement.style.setProperty('--canvas-width', `${this.canvas.width}px`);
        
        // Set up input handlers
        this.setupInputHandlers();
        this.attachTouchControls();
        
        // Initialize game objects
        this.initializeGameObjects();
        this.updateTunnelRows();
        
        // Prepare gradients and static layers
        this.prepareBackgroundGradients();
        this.buildStaticLayers();
        
        // Start the game loop
        this.start();
        
        console.log('✅ Game initialized successfully!');
    }
    
    // Attach D-pad and swipe gestures (mobile)
    attachTouchControls() {
        const mobile = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
        if (mobile) {
            // Default to Low Glow on mobile
            this.settings.lowGlow = true;
            const toggle = document.getElementById('lowGlowToggle');
            if (toggle) toggle.checked = true;
        }

        // Action buttons only
        document.getElementById('btnPause')?.addEventListener('touchstart', (e) => { e.preventDefault(); this.togglePause(); this.hapticPulse('medium'); }, { passive: false });
        document.getElementById('btnRestart')?.addEventListener('touchstart', (e) => { e.preventDefault(); this.restart(); this.hapticPulse('medium'); }, { passive: false });

        // Swipe detection on canvas
        let sx = 0, sy = 0; const threshold = 20; // px
        this.canvas.addEventListener('touchstart', (e) => {
            const t = e.changedTouches[0]; sx = t.clientX; sy = t.clientY;
        }, { passive: true });
        this.canvas.addEventListener('touchend', (e) => {
            const t = e.changedTouches[0]; const dx = t.clientX - sx; const dy = t.clientY - sy;
            if (Math.abs(dx) < threshold && Math.abs(dy) < threshold) return;
            if (Math.abs(dx) > Math.abs(dy)) this.applyDirection(dx > 0 ? 'right' : 'left');
            else this.applyDirection(dy > 0 ? 'down' : 'up');
            this.hapticPulse('light');
        }, { passive: true });
    }

    // Apply a direction intent from touch/D-pad
    applyDirection(dir) {
        this.keys.up = this.keys.down = this.keys.left = this.keys.right = false;
        if (dir === 'up') this.keys.up = true;
        if (dir === 'down') this.keys.down = true;
        if (dir === 'left') this.keys.left = true;
        if (dir === 'right') this.keys.right = true;
    }

    // Compute GRID_SIZE for viewport and size canvas; rebuild layers on resize
    resizeToViewport(initial = false) {
        const cols = this.gameMap[0].length;
        const rows = this.gameMap.length;
        const vw = window.innerWidth; const vh = window.innerHeight;
        const gridW = Math.floor((vw - 20) / cols);
        const gridH = Math.floor((vh - 150) / rows);
        const newGS = Math.max(12, Math.min(gridW, gridH));
        if (newGS && GAME_CONFIG.GRID_SIZE !== newGS) GAME_CONFIG.GRID_SIZE = newGS;
        this.canvas.width = cols * GAME_CONFIG.GRID_SIZE;
        this.canvas.height = rows * GAME_CONFIG.GRID_SIZE;
        const ui = document.getElementById('gameUI');
        if (ui) ui.style.width = `${this.canvas.width}px`;
        document.documentElement.style.setProperty('--canvas-width', `${this.canvas.width}px`);
        if (!initial && this.pacman) {
            const gs = GAME_CONFIG.GRID_SIZE;
            this.pacman.x = (this.pacman.gridX + 0.5) * gs;
            this.pacman.y = (this.pacman.gridY + 0.5) * gs;
            this.ghosts.forEach(g => {
                if (typeof g.gridX === 'number' && typeof g.gridY === 'number') {
                    g.x = (g.gridX + 0.5) * gs;
                    g.y = (g.gridY + 0.5) * gs;
                }
            });
            this.prepareBackgroundGradients();
            this.buildStaticLayers();
        }
        if (initial) window.addEventListener('resize', () => this.resizeToViewport(false));
    }

    // Basic haptic feedback using Vibration API (Android/Chrome). Safe no-op if unsupported.
    hapticPulse(kind = 'light') {
        try {
            const mobile = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
            if (!mobile || !('vibrate' in navigator)) return;
            switch (kind) {
                case 'medium': navigator.vibrate(30); break;
                case 'heavy': navigator.vibrate([20, 20, 20]); break;
                case 'light':
                default:
                    navigator.vibrate(15);
            }
        } catch (e) {
            // ignore
        }
    }
    
    setupInputHandlers() {
        // Keyboard input
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
        
        // Prevent context menu
        this.canvas.addEventListener('contextmenu', e => e.preventDefault());
        
        // Focus management
        this.canvas.setAttribute('tabindex', '0');
        this.canvas.addEventListener('click', () => this.canvas.focus());
    }
    
    // Detect side tunnel rows where both borders are open (non-walls)
    updateTunnelRows() {
        this.tunnelRows = new Set();
        const cols = this.gameMap[0].length;
        for (let y = 0; y < this.gameMap.length; y++) {
            if (this.gameMap[y][0] !== 1 && this.gameMap[y][cols - 1] !== 1) {
                this.tunnelRows.add(y);
            }
        }
    }
    
    handleKeyDown(event) {
        switch(event.key) {
            case 'ArrowUp':
                event.preventDefault();
                this.keys.up = true;
                break;
            case 'ArrowDown':
                event.preventDefault();
                this.keys.down = true;
                break;
            case 'ArrowLeft':
                event.preventDefault();
                this.keys.left = true;
                break;
            case 'ArrowRight':
                event.preventDefault();
                this.keys.right = true;
                break;
            case ' ':
                event.preventDefault();
                this.keys.space = true;
                this.togglePause();
                break;
            case 'r':
            case 'R':
                if (this.state.current === 'gameOver') {
                    this.restart();
                }
                break;
        }
    }
    
    handleKeyUp(event) {
        switch(event.key) {
            case 'ArrowUp':
                this.keys.up = false;
                break;
            case 'ArrowDown':
                this.keys.down = false;
                break;
            case 'ArrowLeft':
                this.keys.left = false;
                break;
            case 'ArrowRight':
                this.keys.right = false;
                break;
            case ' ':
                this.keys.space = false;
                break;
        }
    }
    
    createDefaultMap() {
        // Canonical arcade maze (ASCII 28×29 -> 0/1/2/3)
        const ascii = [
            "############################",
            "#............##............#",
            "#.####.#####.##.#####.####.#",
            "#o####.#####.##.#####.####o#",
            "#.####.#####.##.#####.####.#",
            "#..........................#",
            "#.####.##.########.##.####.#",
            "#.####.##.########.##.####.#",
            "#......##....##....##......#",
            "######.##### ## #####.######",
            "######.##### ## #####.######",
            "######.##          ##.######",
            "######.## ######## ##.######",
            "######.## #      # ##.######",
            "#............##............#",
            "######.## #      # ##.######",
            "######.## ######## ##.######",
            "######.##          ##.######",
            "######.## ######## ##.######",
            "######.## ######## ##.######",
            "#............##............#",
            "#.####.#####.##.#####.####.#",
            "#.####.#####.##.#####.####.#",
            "#o..##.......  .......##..o#",
            "###.##.##.########.##.##.###",
            "#......##....##....##......#",
            "#.##########.##.##########.#",
            "#..........................#",
            "############################"
        ];
        const rows = ascii.length;
        const cols = ascii[0].length;
        // Update game config canvas dimensions
        GAME_CONFIG.CLASSIC_COLS = cols;
        GAME_CONFIG.CLASSIC_ROWS = rows;
        const map = Array.from({ length: rows }, () => Array(cols).fill(1));
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                const ch = ascii[y][x];
                map[y][x] = ch === '#'
                    ? 1
                    : ch === '.'
                    ? 2
                    : ch === 'o'
                    ? 3
                    : 0;
            }
        }
        return map;
    }
    
    initializeGameObjects() {
        // Initialize Pacman near bottom center on a corridor
        const cols = this.gameMap[0].length;
        const rows = this.gameMap.length;
        const startGX = Math.floor(cols / 2);
        const startGY = rows - 2; // perimeter path row
        this.pacman = {
            x: GAME_CONFIG.GRID_SIZE * (startGX + 0.5),
            y: GAME_CONFIG.GRID_SIZE * (startGY + 0.5),
            size: GAME_CONFIG.GRID_SIZE * 0.4,
            speed: GAME_CONFIG.GAME_SPEED,
            direction: 2, // Start facing left
            targetDirection: 2,
            vx: 0,
            vy: 0,
            mouthOpen: 0,
            mouthDirection: 1,
            gridX: startGX,
            gridY: startGY
        };
        
        // Initialize 4 ghosts around ghost house center
        const ghostHouseCenterX = Math.floor(cols / 2) + 0.5;
        const ghostHouseCenterY = Math.floor(rows / 2) + 0.5;
        
        this.ghosts = [
            {
                // Blinky (Red) - Aggressive chaser
                x: GAME_CONFIG.GRID_SIZE * ghostHouseCenterX,
                y: GAME_CONFIG.GRID_SIZE * (ghostHouseCenterY - 1),
                size: GAME_CONFIG.GRID_SIZE * 0.4,
                speed: GAME_CONFIG.GAME_SPEED * 0.8,
                color: '#FF0000',
                name: 'Blinky',
                personality: 'aggressive',
                direction: 3, // Start facing up
                mode: 'scatter',
                gridX: Math.floor(ghostHouseCenterX),
                gridY: Math.floor(ghostHouseCenterY - 1),
                modeTimer: 0,
                inGhostHouse: false
            },
            {
                // Pinky (Pink) - Ambush style
                x: GAME_CONFIG.GRID_SIZE * (ghostHouseCenterX - 1),
                y: GAME_CONFIG.GRID_SIZE * ghostHouseCenterY,
                size: GAME_CONFIG.GRID_SIZE * 0.4,
                speed: GAME_CONFIG.GAME_SPEED * 0.8,
                color: '#FFB8FF',
                name: 'Pinky',
                personality: 'ambush',
                direction: 0, // Start facing right
                mode: 'scatter',
                gridX: Math.floor(ghostHouseCenterX - 1),
                gridY: Math.floor(ghostHouseCenterY),
                modeTimer: 2, // Delayed start
                inGhostHouse: true
            },
            {
                // Inky (Cyan) - Complex behavior
                x: GAME_CONFIG.GRID_SIZE * ghostHouseCenterX,
                y: GAME_CONFIG.GRID_SIZE * ghostHouseCenterY,
                size: GAME_CONFIG.GRID_SIZE * 0.4,
                speed: GAME_CONFIG.GAME_SPEED * 0.8,
                color: '#00FFFF',
                name: 'Inky',
                personality: 'patrol',
                direction: 2, // Start facing left
                mode: 'scatter',
                gridX: Math.floor(ghostHouseCenterX),
                gridY: Math.floor(ghostHouseCenterY),
                modeTimer: 4, // More delayed start
                inGhostHouse: true
            },
            {
                // Clyde (Orange) - Random behavior
                x: GAME_CONFIG.GRID_SIZE * (ghostHouseCenterX + 1),
                y: GAME_CONFIG.GRID_SIZE * ghostHouseCenterY,
                size: GAME_CONFIG.GRID_SIZE * 0.4,
                speed: GAME_CONFIG.GAME_SPEED * 0.8,
                color: '#FFB852',
                name: 'Clyde',
                personality: 'random',
                direction: 2, // Start facing left
                mode: 'scatter',
                gridX: Math.floor(ghostHouseCenterX + 1),
                gridY: Math.floor(ghostHouseCenterY),
                modeTimer: 6, // Most delayed start
                inGhostHouse: true
            }
        ];
        
        // Count pellets for win condition
        this.countPellets();
        
        // Update initial UI
        this.state.updateUI();
    }
    
    countPellets() {
        let pelletCount = 0;
        for (let y = 0; y < this.gameMap.length; y++) {
            for (let x = 0; x < this.gameMap[y].length; x++) {
                if (this.gameMap[y][x] === 2 || this.gameMap[y][x] === 3) {
                    pelletCount++;
                }
            }
        }
        this.state.pelletsRemaining = pelletCount;
    }
    
    start() {
        console.log('🚀 Starting game loop...');
        this.state.current = 'playing';
        this.state.gameStartTime = performance.now();
        this.lastFrameTime = performance.now();
        this.gameLoop(this.lastFrameTime);
    }
    
    gameLoop(currentTime) {
        // Calculate delta time
        let deltaTime = (currentTime - this.lastFrameTime) / 1000;
        deltaTime = Math.min(deltaTime, GAME_CONFIG.MAX_DELTA_TIME);
        this.lastFrameTime = currentTime;
        
        // Update FPS counter
        this.updateFPS(currentTime);
        
        // Only update and render if game is playing
        if (this.state.current === 'playing') {
            this.update(deltaTime);
            this.render();
        } else if (this.state.current === 'paused') {
            this.render();
            this.showPauseScreen();
        } else if (this.state.current === 'gameOver') {
            this.render();
            this.showGameOverScreen();
        }
        
        // Continue the loop
        this.animationId = requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    updateFPS(currentTime) {
        this.frameCount++;
        if (currentTime - this.lastFPSUpdate >= 1000) {
            this.fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastFPSUpdate));
            this.frameCount = 0;
            this.lastFPSUpdate = currentTime;
        }
    }
    
    update(deltaTime) {
        // Update Pacman
        this.updatePacman(deltaTime);
        
        // Update ghosts
        this.updateGhosts(deltaTime);
        
        // Update power pellet timer
        if (this.state.powerPelletActive) {
            this.state.powerPelletTimer -= deltaTime;
            if (this.state.powerPelletTimer <= 0) {
                this.state.powerPelletActive = false;
                
                // Return ghosts to normal mode
                this.ghosts.forEach(ghost => {
                    if (ghost.mode === 'frightened') {
                        ghost.mode = 'scatter';
                        ghost.speed = GAME_CONFIG.GAME_SPEED * 0.8; // Normal speed
                        ghost.scatterTimer = 3; // Short scatter period
                    }
                });
            }
        }
        
        // Check collisions
        this.checkCollisions();
        
        // Update particles
        this.updateParticles(deltaTime);
        
        // Check win condition
        if (this.state.pelletsRemaining <= 0) {
            this.nextLevel();
        }
    }
    
    updatePacman(deltaTime) {
        const pacman = this.pacman;
        
        // Handle input and direction changes
        let newDirection = pacman.direction;
        if (this.keys.up) newDirection = 3;
        if (this.keys.down) newDirection = 1;
        if (this.keys.left) newDirection = 2;
        if (this.keys.right) newDirection = 0;
        
        // Calculate movement
        const directions = [
            { x: 1, y: 0 },   // right
            { x: 0, y: 1 },   // down
            { x: -1, y: 0 },  // left
            { x: 0, y: -1 }   // up
        ];
        
        const dir = directions[newDirection];
        const newX = pacman.x + dir.x * pacman.speed * deltaTime;
        const newY = pacman.y + dir.y * pacman.speed * deltaTime;

        // Side tunnel wrap (only on rows with openings on both borders)
        const gs = GAME_CONFIG.GRID_SIZE;
        const cols = this.gameMap[0].length;
        const row = Math.floor(pacman.y / gs);
        if (this.tunnelRows && this.tunnelRows.has(row)) {
            if (dir.x < 0 && pacman.x - pacman.size <= 0) {
                pacman.direction = newDirection;
                pacman.x = (cols - 1 + 0.5) * gs;
                pacman.y = (row + 0.5) * gs;
                pacman.gridX = Math.floor(pacman.x / gs);
                pacman.gridY = row;
                return;
            } else if (dir.x > 0 && pacman.x + pacman.size >= cols * gs) {
                pacman.direction = newDirection;
                pacman.x = 0.5 * gs;
                pacman.y = (row + 0.5) * gs;
                pacman.gridX = Math.floor(pacman.x / gs);
                pacman.gridY = row;
                return;
            }
        }
        
        // Check if new position is valid (no walls)
        if (this.isValidPosition(newX, newY, pacman.size)) {
            pacman.direction = newDirection;
            pacman.x = newX;
            pacman.y = newY;
            
            // Update grid position
            pacman.gridX = Math.floor(pacman.x / GAME_CONFIG.GRID_SIZE);
            pacman.gridY = Math.floor(pacman.y / GAME_CONFIG.GRID_SIZE);
            
            // Animate mouth
            pacman.mouthOpen += pacman.mouthDirection * 0.15;
            if (pacman.mouthOpen >= 1) {
                pacman.mouthOpen = 1;
                pacman.mouthDirection = -1;
            } else if (pacman.mouthOpen <= 0) {
                pacman.mouthOpen = 0;
                pacman.mouthDirection = 1;
            }
        }
        
        // Left/right screen wrapping handled by tunnels
    }
    
    updateGhosts(deltaTime) {
        this.ghosts.forEach(ghost => {
            // Update ghost mode timer
            ghost.modeTimer -= deltaTime;
            
            // Handle ghost house exit timing
            if (ghost.inGhostHouse && ghost.modeTimer <= 0) {
                ghost.inGhostHouse = false;
                ghost.y = GAME_CONFIG.GRID_SIZE * 11.5; // Move to just outside ghost house
                ghost.direction = 3; // Face up
                ghost.mode = 'scatter';
            }
            
            // Skip movement if still waiting in ghost house
            if (ghost.inGhostHouse) {
                return;
            }
            
            // Update AI behavior based on personality and mode
            this.updateGhostAI(ghost, deltaTime);
            
            // Move ghost
            const directions = [
                { x: 1, y: 0 },   // right
                { x: 0, y: 1 },   // down
                { x: -1, y: 0 },  // left
                { x: 0, y: -1 }   // up
            ];
            
            const dir = directions[ghost.direction];
            const newX = ghost.x + dir.x * ghost.speed * deltaTime;
            const newY = ghost.y + dir.y * ghost.speed * deltaTime;
            
            // Handle tunnel wrapping (only on rows with openings)
            const gs = GAME_CONFIG.GRID_SIZE;
            const cols = this.gameMap[0].length;
            const row = Math.floor(ghost.y / gs);
            if (this.tunnelRows && this.tunnelRows.has(row)) {
                if (newX < -gs && ghost.direction === 2) {
                    ghost.x = cols * gs + gs;
                    return;
                } else if (newX > cols * gs + gs && ghost.direction === 0) {
                    ghost.x = -gs;
                    return;
                }
            }
            
            if (this.isValidPosition(newX, newY, ghost.size)) {
                ghost.x = newX;
                ghost.y = newY;
                ghost.gridX = Math.floor(ghost.x / GAME_CONFIG.GRID_SIZE);
                ghost.gridY = Math.floor(ghost.y / GAME_CONFIG.GRID_SIZE);
            } else {
                // Choose new direction when hitting wall
                this.chooseGhostDirection(ghost);
            }
        });
    }
    
    updateGhostAI(ghost, deltaTime) {
        // Get target based on mode and personality
        let target = this.getGhostTarget(ghost);
        
        // Switch between scatter and chase modes
        if (ghost.mode === 'scatter') {
            // Scatter for 7 seconds, then chase for 20 seconds
            if (!ghost.scatterTimer) ghost.scatterTimer = 7;
            ghost.scatterTimer -= deltaTime;
            if (ghost.scatterTimer <= 0) {
                ghost.mode = 'chase';
                ghost.chaseTimer = 20;
            }
        } else if (ghost.mode === 'chase') {
            if (!ghost.chaseTimer) ghost.chaseTimer = 20;
            ghost.chaseTimer -= deltaTime;
            if (ghost.chaseTimer <= 0) {
                ghost.mode = 'scatter';
                ghost.scatterTimer = 7;
            }
        }
        
        // Update direction towards target occasionally
        if (!ghost.lastDirectionUpdate) ghost.lastDirectionUpdate = 0;
        ghost.lastDirectionUpdate += deltaTime;
        
        if (ghost.lastDirectionUpdate > 0.5) { // Update direction every 0.5 seconds
            ghost.lastDirectionUpdate = 0;
            this.chooseGhostDirection(ghost, target);
        }
    }
    
    getGhostTarget(ghost) {
        const pacman = this.pacman;
        
        if (ghost.mode === 'frightened') {
            // Random target when frightened
            return {
                x: Math.random() * GAME_CONFIG.CANVAS_WIDTH,
                y: Math.random() * GAME_CONFIG.CANVAS_HEIGHT
            };
        }
        
        if (ghost.mode === 'scatter') {
            // Go to home corner
            const corners = {
                'Blinky': { x: GAME_CONFIG.CANVAS_WIDTH - 40, y: 40 },
                'Pinky': { x: 40, y: 40 },
                'Inky': { x: GAME_CONFIG.CANVAS_WIDTH - 40, y: GAME_CONFIG.CANVAS_HEIGHT - 40 },
                'Clyde': { x: 40, y: GAME_CONFIG.CANVAS_HEIGHT - 40 }
            };
            return corners[ghost.name] || { x: pacman.x, y: pacman.y };
        }
        
        // Chase mode - behavior based on personality
        switch (ghost.personality) {
            case 'aggressive': // Blinky - direct chase
                return { x: pacman.x, y: pacman.y };
                
            case 'ambush': // Pinky - aim 4 tiles ahead of Pacman
                const directions = [
                    { x: 4 * GAME_CONFIG.GRID_SIZE, y: 0 },
                    { x: 0, y: 4 * GAME_CONFIG.GRID_SIZE },
                    { x: -4 * GAME_CONFIG.GRID_SIZE, y: 0 },
                    { x: 0, y: -4 * GAME_CONFIG.GRID_SIZE }
                ];
                const dir = directions[pacman.direction];
                return {
                    x: pacman.x + dir.x,
                    y: pacman.y + dir.y
                };
                
            case 'patrol': // Inky - complex behavior
                const distance = Math.sqrt(
                    Math.pow(pacman.x - ghost.x, 2) + Math.pow(pacman.y - ghost.y, 2)
                );
                if (distance > 8 * GAME_CONFIG.GRID_SIZE) {
                    return { x: pacman.x, y: pacman.y };
                } else {
                    return { x: 40, y: GAME_CONFIG.CANVAS_HEIGHT - 40 }; // Retreat
                }
                
            case 'random': // Clyde - random with some chase
                if (Math.random() < 0.7) {
                    return { x: pacman.x, y: pacman.y };
                } else {
                    return {
                        x: Math.random() * GAME_CONFIG.CANVAS_WIDTH,
                        y: Math.random() * GAME_CONFIG.CANVAS_HEIGHT
                    };
                }
                
            default:
                return { x: pacman.x, y: pacman.y };
        }
    }
    
    chooseGhostDirection(ghost, target = null) {
        if (!target) {
            target = this.getGhostTarget(ghost);
        }
        
        const directions = [
            { x: 1, y: 0, dir: 0 },   // right
            { x: 0, y: 1, dir: 1 },   // down
            { x: -1, y: 0, dir: 2 },  // left
            { x: 0, y: -1, dir: 3 }   // up
        ];
        
        let bestDirection = ghost.direction;
        let bestDistance = Infinity;
        
        directions.forEach(d => {
            // Don't reverse direction unless necessary
            if (d.dir === (ghost.direction + 2) % 4 && Math.random() > 0.2) return;
            
            const newX = ghost.x + d.x * ghost.speed * 0.1;
            const newY = ghost.y + d.y * ghost.speed * 0.1;
            
            if (this.isValidPosition(newX, newY, ghost.size)) {
                const distance = Math.sqrt(
                    Math.pow(target.x - newX, 2) + Math.pow(target.y - newY, 2)
                );
                
                if (distance < bestDistance) {
                    bestDistance = distance;
                    bestDirection = d.dir;
                }
            }
        });
        
        ghost.direction = bestDirection;
    }
    
    updateParticles(deltaTime) {
        // Update particle effects (placeholder for now)
        this.particles = this.particles.filter(particle => {
            particle.life -= deltaTime;
            return particle.life > 0;
        });
    }
    
    isValidPosition(x, y, size) {
        // Check boundaries
        if (x - size < 0 || x + size > GAME_CONFIG.CANVAS_WIDTH ||
            y - size < 0 || y + size > GAME_CONFIG.CANVAS_HEIGHT) {
            return false;
        }
        
        // Check walls in game map
        const gridX = Math.floor(x / GAME_CONFIG.GRID_SIZE);
        const gridY = Math.floor(y / GAME_CONFIG.GRID_SIZE);
        
        if (gridY >= 0 && gridY < this.gameMap.length &&
            gridX >= 0 && gridX < this.gameMap[gridY].length) {
            return this.gameMap[gridY][gridX] !== 1; // Not a wall
        }
        
        return true;
    }
    
    checkCollisions() {
        const pacman = this.pacman;
        
        // Check pellet collection
        const gridX = Math.floor(pacman.x / GAME_CONFIG.GRID_SIZE);
        const gridY = Math.floor(pacman.y / GAME_CONFIG.GRID_SIZE);
        
        if (gridY >= 0 && gridY < this.gameMap.length &&
            gridX >= 0 && gridX < this.gameMap[gridY].length) {
            
            if (this.gameMap[gridY][gridX] === 2) { // Pellet
                this.gameMap[gridY][gridX] = 0;
                this.state.addScore(10);
                this.state.pelletsRemaining--;
                this.createScoreParticle(pacman.x, pacman.y, 10);
                this.clearPelletAt(gridX, gridY);
            } else if (this.gameMap[gridY][gridX] === 3) { // Power pellet
                this.gameMap[gridY][gridX] = 0;
                this.state.addScore(50);
                this.state.pelletsRemaining--;
                this.state.powerPelletActive = true;
                this.state.powerPelletTimer = 8; // 8 seconds
                this.createScoreParticle(pacman.x, pacman.y, 50);
                this.clearPelletAt(gridX, gridY);
                // Remove from power pellet positions cache
                this.powerPelletPositions = this.powerPelletPositions.filter(p => {
                    const gx = Math.floor(p.x / GAME_CONFIG.GRID_SIZE);
                    const gy = Math.floor(p.y / GAME_CONFIG.GRID_SIZE);
                    return !(gx === gridX && gy === gridY);
                });
                
                // Set all ghosts to frightened mode
                this.ghosts.forEach(ghost => {
                    if (!ghost.inGhostHouse && ghost.mode !== 'dead') {
                        ghost.mode = 'frightened';
                        ghost.speed = GAME_CONFIG.GAME_SPEED * 0.6; // Slower when frightened
                        ghost.direction = (ghost.direction + 2) % 4; // Reverse direction
                    }
                });
            }
        }
        
        // Check ghost collisions
        this.ghosts.forEach(ghost => {
            const dx = pacman.x - ghost.x;
            const dy = pacman.y - ghost.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < pacman.size + ghost.size) {
                if (this.state.powerPelletActive) {
                    // Eat ghost
                    this.state.addScore(200);
                    // Reset ghost position (simple respawn)
                    ghost.x = GAME_CONFIG.GRID_SIZE * 5;
                    ghost.y = GAME_CONFIG.GRID_SIZE * 5;
                } else {
                    // Lose life
                    this.state.loseLife();
                    this.resetPositions();
                }
            }
        });
    }
    
    createScoreParticle(x, y, score) {
        // Add visual feedback for scoring (placeholder)
        console.log(`+${score} at (${Math.round(x)}, ${Math.round(y)})`);
    }
    
    resetPositions() {
        // Reset Pacman and ghost positions after collision
        this.pacman.x = GAME_CONFIG.GRID_SIZE * 1.5;
        this.pacman.y = GAME_CONFIG.GRID_SIZE * 1.5;
        
        this.ghosts.forEach((ghost, index) => {
            ghost.x = GAME_CONFIG.GRID_SIZE * (5 + index);
            ghost.y = GAME_CONFIG.GRID_SIZE * 5;
        });
    }
    
    nextLevel() {
        console.log('🎉 Level Complete!');
        this.state.nextLevel();
        this.gameMap = this.createDefaultMap();
        this.countPellets();
        this.updateTunnelRows();
        this.buildStaticLayers();
        this.resetPositions();
    }
    
    render() {
        // Background (cached)
        this.ctx.fillStyle = this._bgGradient || '#000010';
        this.ctx.fillRect(0, 0, GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.CANVAS_HEIGHT);

        // Map layers
        this.renderMap();

        // Dynamic objects
        this.renderPacman();
        this.renderGhosts();
        this.renderParticles();

        // Vignette overlay (cached)
        if (this._vignette) {
            this.ctx.fillStyle = this._vignette;
            this.ctx.fillRect(0, 0, GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.CANVAS_HEIGHT);
        }

        // Debug
        this.renderDebugInfo();
    }
    
    renderMap() {
        // Draw cached layers
        this.ctx.drawImage(this.layers.maze, 0, 0);
        this.ctx.drawImage(this.layers.pellets, 0, 0);
        
        // Animate power pellets lightly
        if (this.powerPelletPositions.length) {
            const t = performance.now() / 1000;
            const pulse = 0.9 + (this.settings.lowGlow ? 0.05 : 0.25) * Math.sin(t * 5);
            this.ctx.shadowColor = '#ffff66';
            this.ctx.shadowBlur = this.settings.lowGlow ? 2 : 6;
            this.powerPelletPositions.forEach(({x, y}) => {
                this.ctx.fillStyle = '#ffef6e';
                this.ctx.beginPath();
                this.ctx.arc(x, y, 6 * pulse, 0, Math.PI * 2);
                this.ctx.fill();
            });
            this.ctx.shadowBlur = 0;
        }
    }

    // Build static offscreen layers from the current map
    buildStaticLayers() {
        const W = GAME_CONFIG.CANVAS_WIDTH;
        const H = GAME_CONFIG.CANVAS_HEIGHT;
        const gs = GAME_CONFIG.GRID_SIZE;
        const rows = this.gameMap.length;
        const cols = this.gameMap[0]?.length || 0;

        this.layers.maze.width = W; this.layers.maze.height = H;
        this.layers.pellets.width = W; this.layers.pellets.height = H;
        this.powerPelletPositions = [];

        const mctx = this.layers.maze.getContext('2d');
        mctx.clearRect(0, 0, W, H);
        mctx.lineJoin = 'round';
        mctx.lineCap = 'round';

        const glowPrimary = '#2fb5ff';
        const glowInner = '#1050ff';
        const baseStroke = '#0e3bd6';

        const drawEdge = (x1, y1, x2, y2) => {
            const scale = this.settings.lowGlow ? 0.5 : 1;
            // Outer glow
            mctx.shadowColor = glowPrimary;
            mctx.shadowBlur = 3 * scale;
            mctx.strokeStyle = glowPrimary;
            mctx.lineWidth = 3.5 * scale;
            mctx.beginPath();
            mctx.moveTo(x1, y1);
            mctx.lineTo(x2, y2);
            mctx.stroke();

            // Inner glow
            mctx.shadowColor = glowInner;
            mctx.shadowBlur = 2 * scale;
            mctx.strokeStyle = glowInner;
            mctx.lineWidth = 2.5 * scale;
            mctx.beginPath();
            mctx.moveTo(x1, y1);
            mctx.lineTo(x2, y2);
            mctx.stroke();

            // Core
            mctx.shadowBlur = 0;
            mctx.strokeStyle = baseStroke;
            mctx.lineWidth = 1.2 * scale;
            mctx.beginPath();
            mctx.moveTo(x1, y1);
            mctx.lineTo(x2, y2);
            mctx.stroke();
        };

        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                if (this.gameMap[y][x] !== 1) continue;
                const cx = x * gs;
                const cy = y * gs;
                const up = y > 0 ? this.gameMap[y - 1][x] === 1 : false;
                const down = y < rows - 1 ? this.gameMap[y + 1][x] === 1 : false;
                const left = x > 0 ? this.gameMap[y][x - 1] === 1 : false;
                const right = x < cols - 1 ? this.gameMap[y][x + 1] === 1 : false;
                if (!up) drawEdge(cx + 3, cy + 3, cx + gs - 3, cy + 3);
                if (!down) drawEdge(cx + 3, cy + gs - 3, cx + gs - 3, cy + gs - 3);
                if (!left) drawEdge(cx + 3, cy + 3, cx + 3, cy + gs - 3);
                if (!right) drawEdge(cx + gs - 3, cy + 3, cx + gs - 3, cy + gs - 3);
            }
        }

        // Pellets layer
        const pctx = this.layers.pellets.getContext('2d');
        pctx.clearRect(0, 0, W, H);
        pctx.fillStyle = '#ffffff';
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                const cell = this.gameMap[y][x];
                if (cell === 2 || cell === 3) {
                    const cx = x * gs + gs / 2;
                    const cy = y * gs + gs / 2;
                    if (cell === 2) {
                        pctx.beginPath();
                        pctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
                        pctx.fill();
                    } else {
                        pctx.fillStyle = '#ffef6e';
                        pctx.beginPath();
                        pctx.arc(cx, cy, 4, 0, Math.PI * 2);
                        pctx.fill();
                        pctx.fillStyle = '#ffffff';
                        this.powerPelletPositions.push({ x: cx, y: cy });
                    }
                }
            }
        }
    }

    // Clear a pellet cell on the offscreen pellet layer
    clearPelletAt(gridX, gridY) {
        const gs = GAME_CONFIG.GRID_SIZE;
        const pctx = this.layers.pellets.getContext('2d');
        pctx.clearRect(gridX * gs, gridY * gs, gs, gs);
    }

    // Cache background gradients once
    prepareBackgroundGradients() {
        const cx = GAME_CONFIG.CANVAS_WIDTH * 0.5;
        const cy = GAME_CONFIG.CANVAS_HEIGHT * 0.45;
        const inner = Math.min(GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.CANVAS_HEIGHT) * 0.1;
        const outer = Math.max(GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.CANVAS_HEIGHT) * 0.8;
        const bg = this.ctx.createRadialGradient(cx, cy, inner, cx, cy, outer);
        bg.addColorStop(0, '#000015');
        bg.addColorStop(1, '#000006');
        this._bgGradient = bg;

        const vcx = GAME_CONFIG.CANVAS_WIDTH / 2;
        const vcy = GAME_CONFIG.CANVAS_HEIGHT / 2;
        const vInner = Math.min(GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.CANVAS_HEIGHT) * 0.55;
        const vOuter = Math.min(GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.CANVAS_HEIGHT) * 0.9;
        const vg = this.ctx.createRadialGradient(vcx, vcy, vInner, vcx, vcy, vOuter);
        vg.addColorStop(0, 'rgba(0,0,0,0)');
        vg.addColorStop(1, 'rgba(0,0,0,0.4)');
        this._vignette = vg;
    }
    
    // Helper function to draw rounded rectangles
    drawRoundedRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        ctx.fill();
    }
    
    renderPacman() {
        const ctx = this.ctx;
        const p = this.pacman;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.direction * Math.PI / 2);

        const mouthAngle = p.mouthOpen * 0.7 + 0.05; // slight minimum opening for style

        // Glow and body
        ctx.shadowColor = '#ffd54f';
        ctx.shadowBlur = this.settings.lowGlow ? 4 : 12;
        const bodyGrad = ctx.createRadialGradient(0, -p.size * 0.6, p.size * 0.2, 0, 0, p.size);
        bodyGrad.addColorStop(0, '#fff176');
        bodyGrad.addColorStop(1, '#ffeb3b');
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.arc(0, 0, p.size, mouthAngle, 2 * Math.PI - mouthAngle);
        ctx.lineTo(0, 0);
        ctx.fill();

        // Outline for definition
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#c9a800';
        ctx.lineWidth = this.settings.lowGlow ? 1 : 2;
        ctx.beginPath();
        ctx.arc(0, 0, p.size, mouthAngle, 2 * Math.PI - mouthAngle);
        ctx.lineTo(0, 0);
        ctx.closePath();
        ctx.stroke();

        // Eye (slightly glossy)
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(-p.size * 0.28, -p.size * 0.32, p.size * 0.14, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.beginPath();
        ctx.arc(-p.size * 0.24, -p.size * 0.36, p.size * 0.06, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
    
    renderGhosts() {
        const ctx = this.ctx;
        
        this.ghosts.forEach(g => {
            ctx.save();
            ctx.translate(g.x, g.y);

            // Determine color based on mode
            const baseColor = this.state.powerPelletActive ? '#224BFF' : g.color;
            const highlight = this.state.powerPelletActive ? '#91a4ff' : '#ffffff';

            // Body gradient for depth
            const grad = ctx.createLinearGradient(0, -g.size, 0, g.size);
            grad.addColorStop(0, highlight + '11');
            grad.addColorStop(0.2, highlight + '22');
            grad.addColorStop(1, baseColor);

            // Glow
            ctx.shadowColor = baseColor;
            ctx.shadowBlur = this.settings.lowGlow ? 4 : 10;

            // Head (semi-circle) and torso
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(0, -g.size * 0.2, g.size, Math.PI, 0, false);
            ctx.lineTo(g.size, g.size * 0.9);
            ctx.lineTo(-g.size, g.size * 0.9);
            ctx.closePath();
            ctx.fill();

            // Wavy bottom
            ctx.shadowBlur = 0;
            ctx.fillStyle = baseColor;
            const bumps = 4;
            const width = g.size * 2;
            const leftX = -g.size;
            const bottomY = g.size * 0.9;
            ctx.beginPath();
            ctx.moveTo(leftX, bottomY);
            for (let i = 0; i < bumps; i++) {
                const sx = leftX + (i * width) / bumps;
                const mx = leftX + ((i + 0.5) * width) / bumps;
                const ex = leftX + ((i + 1) * width) / bumps;
                ctx.quadraticCurveTo(mx, bottomY + g.size * 0.25, ex, bottomY);
            }
            ctx.lineTo(g.size, bottomY);
            ctx.lineTo(g.size, -g.size * 0.2);
            ctx.lineTo(-g.size, -g.size * 0.2);
            ctx.closePath();
            ctx.fill();

            // Eyes
            const eyeY = -g.size * 0.15;
            const eyeOffset = g.size * 0.42;
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(-eyeOffset, eyeY, g.size * 0.28, 0, Math.PI * 2);
            ctx.arc(eyeOffset, eyeY, g.size * 0.28, 0, Math.PI * 2);
            ctx.fill();

            // Pupils with direction offset
            ctx.fillStyle = '#0b1957';
            let px = 0, py = 0;
            switch (g.direction) {
                case 0: px = g.size * 0.12; break; // right
                case 1: py = g.size * 0.12; break; // down
                case 2: px = -g.size * 0.12; break; // left
                case 3: py = -g.size * 0.12; break; // up
            }
            ctx.beginPath();
            ctx.arc(-eyeOffset + px, eyeY + py, g.size * 0.16, 0, Math.PI * 2);
            ctx.arc(eyeOffset + px, eyeY + py, g.size * 0.16, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        });
    }
    
    renderParticles() {
        // Render particle effects (placeholder)
        this.particles.forEach(particle => {
            // Particle rendering logic
        });
    }
    
    renderDebugInfo() {
        if (console.debug) {
            const ctx = this.ctx;
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '12px monospace';
            ctx.fillText(`FPS: ${this.fps}`, 10, 20);
            ctx.fillText(`Pellets: ${this.state.pelletsRemaining}`, 10, 35);
            ctx.fillText(`Power: ${this.state.powerPelletActive ? 'ON' : 'OFF'}`, 10, 50);
        }
    }
    
    showPauseScreen() {
        document.getElementById('pauseScreen').style.display = 'block';
    }
    
    hidePauseScreen() {
        document.getElementById('pauseScreen').style.display = 'none';
    }
    
    showGameOverScreen() {
        const gameOverEl = document.getElementById('gameOver');
        const finalScoreEl = document.getElementById('finalScore');
        
        if (gameOverEl && finalScoreEl) {
            finalScoreEl.textContent = this.state.score.toLocaleString();
            gameOverEl.style.display = 'block';
        }
    }
    
    hideGameOverScreen() {
        const gameOverEl = document.getElementById('gameOver');
        if (gameOverEl) {
            gameOverEl.style.display = 'none';
        }
    }
    
    togglePause() {
        if (this.state.current === 'playing') {
            this.state.current = 'paused';
            this.showPauseScreen();
            console.log('⏸️ Game Paused');
        } else if (this.state.current === 'paused') {
            this.state.current = 'playing';
            this.hidePauseScreen();
            console.log('▶️ Game Resumed');
        }
    }
    
    restart() {
        console.log('🔄 Restarting game...');
        this.hideGameOverScreen();
        this.state.reset();
        this.gameMap = this.createDefaultMap();
        this.initializeGameObjects();
        this.countPellets();
        this.updateTunnelRows();
        this.buildStaticLayers();
    }
    
    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        console.log('🛑 Game destroyed');
    }
}

// Global game instance
let game = null;

// Initialize game when DOM is loaded
function initializeGame() {
    if (game) {
        game.destroy();
    }
    
    game = new PacmanGame();
    
    // Make functions globally available
    window.game = game;
    window.togglePause = () => game.togglePause();
    window.resetGame = () => game.restart();
    
    console.log('🎮 Pacman Game Ready!');
}

// Auto-initialize if DOM is already loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeGame);
} else {
    initializeGame();
}

// Export for other modules
window.PacmanGame = PacmanGame;
window.GAME_CONFIG = GAME_CONFIG;
