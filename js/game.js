/**
 * Pacman Game - Main Game Logic and Loop
 * Modern JavaScript implementation with ES6+ features
 */

// Game constants
const GAME_CONFIG = {
    CANVAS_WIDTH: 800,
    CANVAS_HEIGHT: 600,
    GRID_SIZE: 20,
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
    
    init() {
        console.log('🎮 Initializing Pacman Game...');
        
        // Set up canvas
        this.canvas.width = GAME_CONFIG.CANVAS_WIDTH;
        this.canvas.height = GAME_CONFIG.CANVAS_HEIGHT;
        this.canvas.focus();
        
        // Set up input handlers
        this.setupInputHandlers();
        
        // Initialize game objects
        this.initializeGameObjects();
        
        // Start the game loop
        this.start();
        
        console.log('✅ Game initialized successfully!');
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
        // Create a simple game map (will be expanded later)
        const map = [];
        const width = Math.floor(GAME_CONFIG.CANVAS_WIDTH / GAME_CONFIG.GRID_SIZE);
        const height = Math.floor(GAME_CONFIG.CANVAS_HEIGHT / GAME_CONFIG.GRID_SIZE);
        
        for (let y = 0; y < height; y++) {
            map[y] = [];
            for (let x = 0; x < width; x++) {
                // Create borders
                if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
                    map[y][x] = 1; // Wall
                } else if (Math.random() < 0.1) {
                    map[y][x] = 1; // Random walls
                } else if (Math.random() < 0.8) {
                    map[y][x] = 2; // Pellet
                } else if (Math.random() < 0.05) {
                    map[y][x] = 3; // Power pellet
                } else {
                    map[y][x] = 0; // Empty space
                }
            }
        }
        
        // Ensure player starting position is clear
        map[1][1] = 0;
        map[1][2] = 0;
        map[2][1] = 0;
        
        return map;
    }
    
    initializeGameObjects() {
        // Initialize Pacman (basic version for now)
        this.pacman = {
            x: GAME_CONFIG.GRID_SIZE * 1.5,
            y: GAME_CONFIG.GRID_SIZE * 1.5,
            size: GAME_CONFIG.GRID_SIZE * 0.4,
            speed: GAME_CONFIG.GAME_SPEED,
            direction: 0, // 0: right, 1: down, 2: left, 3: up
            targetDirection: 0,
            vx: 0,
            vy: 0,
            mouthOpen: 0,
            mouthDirection: 1,
            gridX: 1,
            gridY: 1
        };
        
        // Initialize basic ghosts
        this.ghosts = [
            {
                x: GAME_CONFIG.GRID_SIZE * 5,
                y: GAME_CONFIG.GRID_SIZE * 5,
                size: GAME_CONFIG.GRID_SIZE * 0.4,
                speed: GAME_CONFIG.GAME_SPEED * 0.8,
                color: '#FF0000',
                direction: 0,
                mode: 'scatter', // scatter, chase, frightened
                gridX: 5,
                gridY: 5
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
        
        // Handle screen wrapping
        if (pacman.x < -pacman.size) {
            pacman.x = GAME_CONFIG.CANVAS_WIDTH + pacman.size;
        } else if (pacman.x > GAME_CONFIG.CANVAS_WIDTH + pacman.size) {
            pacman.x = -pacman.size;
        }
    }
    
    updateGhosts(deltaTime) {
        // Simple ghost AI for now
        this.ghosts.forEach(ghost => {
            // Simple random movement
            if (Math.random() < 0.02) {
                ghost.direction = Math.floor(Math.random() * 4);
            }
            
            const directions = [
                { x: 1, y: 0 },   // right
                { x: 0, y: 1 },   // down
                { x: -1, y: 0 },  // left
                { x: 0, y: -1 }   // up
            ];
            
            const dir = directions[ghost.direction];
            const newX = ghost.x + dir.x * ghost.speed * deltaTime;
            const newY = ghost.y + dir.y * ghost.speed * deltaTime;
            
            if (this.isValidPosition(newX, newY, ghost.size)) {
                ghost.x = newX;
                ghost.y = newY;
                ghost.gridX = Math.floor(ghost.x / GAME_CONFIG.GRID_SIZE);
                ghost.gridY = Math.floor(ghost.y / GAME_CONFIG.GRID_SIZE);
            } else {
                // Change direction if hit wall
                ghost.direction = Math.floor(Math.random() * 4);
            }
        });
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
            } else if (this.gameMap[gridY][gridX] === 3) { // Power pellet
                this.gameMap[gridY][gridX] = 0;
                this.state.addScore(50);
                this.state.pelletsRemaining--;
                this.state.powerPelletActive = true;
                this.state.powerPelletTimer = 8; // 8 seconds
                this.createScoreParticle(pacman.x, pacman.y, 50);
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
        this.resetPositions();
    }
    
    render() {
        // Clear canvas
        this.ctx.fillStyle = '#000011';
        this.ctx.fillRect(0, 0, GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.CANVAS_HEIGHT);
        
        // Render game map
        this.renderMap();
        
        // Render game objects
        this.renderPacman();
        this.renderGhosts();
        this.renderParticles();
        
        // Render debug info
        this.renderDebugInfo();
    }
    
    renderMap() {
        const ctx = this.ctx;
        
        for (let y = 0; y < this.gameMap.length; y++) {
            for (let x = 0; x < this.gameMap[y].length; x++) {
                const cellX = x * GAME_CONFIG.GRID_SIZE;
                const cellY = y * GAME_CONFIG.GRID_SIZE;
                
                switch (this.gameMap[y][x]) {
                    case 1: // Wall
                        ctx.fillStyle = '#0080FF';
                        ctx.fillRect(cellX, cellY, GAME_CONFIG.GRID_SIZE, GAME_CONFIG.GRID_SIZE);
                        break;
                    case 2: // Pellet
                        ctx.fillStyle = '#FFFFFF';
                        ctx.beginPath();
                        ctx.arc(
                            cellX + GAME_CONFIG.GRID_SIZE / 2,
                            cellY + GAME_CONFIG.GRID_SIZE / 2,
                            3, 0, Math.PI * 2
                        );
                        ctx.fill();
                        break;
                    case 3: // Power pellet
                        ctx.fillStyle = '#FFFF00';
                        ctx.beginPath();
                        ctx.arc(
                            cellX + GAME_CONFIG.GRID_SIZE / 2,
                            cellY + GAME_CONFIG.GRID_SIZE / 2,
                            6, 0, Math.PI * 2
                        );
                        ctx.fill();
                        break;
                }
            }
        }
    }
    
    renderPacman() {
        const ctx = this.ctx;
        const pacman = this.pacman;
        
        ctx.save();
        ctx.translate(pacman.x, pacman.y);
        ctx.rotate(pacman.direction * Math.PI / 2);
        
        // Draw Pacman with mouth animation
        ctx.fillStyle = '#FFFF00';
        const mouthAngle = pacman.mouthOpen * 0.7;
        
        ctx.beginPath();
        ctx.arc(0, 0, pacman.size, mouthAngle, 2 * Math.PI - mouthAngle);
        ctx.lineTo(0, 0);
        ctx.fill();
        
        // Draw eye
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(-pacman.size * 0.3, -pacman.size * 0.3, pacman.size * 0.15, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
    
    renderGhosts() {
        const ctx = this.ctx;
        
        this.ghosts.forEach(ghost => {
            ctx.save();
            ctx.translate(ghost.x, ghost.y);
            
            // Ghost body
            ctx.fillStyle = this.state.powerPelletActive ? '#0000FF' : ghost.color;
            ctx.beginPath();
            ctx.arc(0, -ghost.size * 0.2, ghost.size, 0, Math.PI, true);
            ctx.rect(-ghost.size, -ghost.size * 0.2, ghost.size * 2, ghost.size * 1.2);
            ctx.fill();
            
            // Ghost bottom (wavy)
            ctx.beginPath();
            ctx.moveTo(-ghost.size, ghost.size);
            ctx.lineTo(-ghost.size * 0.5, ghost.size * 0.7);
            ctx.lineTo(0, ghost.size);
            ctx.lineTo(ghost.size * 0.5, ghost.size * 0.7);
            ctx.lineTo(ghost.size, ghost.size);
            ctx.lineTo(ghost.size, ghost.size * 0.2);
            ctx.lineTo(-ghost.size, ghost.size * 0.2);
            ctx.fill();
            
            // Eyes
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(-ghost.size * 0.3, -ghost.size * 0.3, ghost.size * 0.2, 0, Math.PI * 2);
            ctx.arc(ghost.size * 0.3, -ghost.size * 0.3, ghost.size * 0.2, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.arc(-ghost.size * 0.3, -ghost.size * 0.3, ghost.size * 0.1, 0, Math.PI * 2);
            ctx.arc(ghost.size * 0.3, -ghost.size * 0.3, ghost.size * 0.1, 0, Math.PI * 2);
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