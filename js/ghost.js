/**
 * Ghost AI and Behavior
 * Advanced ghost intelligence and animations
 */

class Ghost {
    constructor(x, y, color, personality = 'aggressive') {
        this.x = x;
        this.y = y;
        this.size = GAME_CONFIG.GRID_SIZE * 0.4;
        this.baseSpeed = GAME_CONFIG.GAME_SPEED * 0.8;
        this.speed = this.baseSpeed;
        this.color = color;
        this.personality = personality;
        this.direction = 0;
        this.gridX = Math.floor(x / GAME_CONFIG.GRID_SIZE);
        this.gridY = Math.floor(y / GAME_CONFIG.GRID_SIZE);
        
        // AI states
        this.mode = 'scatter'; // scatter, chase, frightened, dead
        this.modeTimer = 0;
        this.target = { x: 0, y: 0 };
        this.homeCorner = this.getHomeCorner();
        
        // Animation
        this.animationFrame = 0;
        this.lastDirectionChange = 0;
    }
    
    getHomeCorner() {
        // Define home corners for scatter mode based on color
        const corners = {
            '#FF0000': { x: GAME_CONFIG.CANVAS_WIDTH - 40, y: 40 }, // Red - top right
            '#FFB8FF': { x: 40, y: 40 }, // Pink - top left  
            '#00FFFF': { x: GAME_CONFIG.CANVAS_WIDTH - 40, y: GAME_CONFIG.CANVAS_HEIGHT - 40 }, // Cyan - bottom right
            '#FFB852': { x: 40, y: GAME_CONFIG.CANVAS_HEIGHT - 40 } // Orange - bottom left
        };
        return corners[this.color] || { x: 100, y: 100 };
    }
    
    update(deltaTime, pacman, gameMap) {
        // Update mode timer
        this.modeTimer += deltaTime;
        
        // Update AI behavior based on current mode
        this.updateAI(pacman, gameMap);
        
        // Move ghost
        this.move(deltaTime, gameMap);
        
        // Update animation
        this.animationFrame += deltaTime * 2;
        
        // Update grid position
        this.gridX = Math.floor(this.x / GAME_CONFIG.GRID_SIZE);
        this.gridY = Math.floor(this.y / GAME_CONFIG.GRID_SIZE);
    }
    
    updateAI(pacman, gameMap) {
        switch (this.mode) {
            case 'scatter':
                this.target = this.homeCorner;
                // Switch to chase mode after some time
                if (this.modeTimer > 7) {
                    this.mode = 'chase';
                    this.modeTimer = 0;
                }
                break;
                
            case 'chase':
                this.updateChaseTarget(pacman);
                // Switch back to scatter mode
                if (this.modeTimer > 20) {
                    this.mode = 'scatter';
                    this.modeTimer = 0;
                }
                break;
                
            case 'frightened':
                // Random movement when frightened
                this.target = {
                    x: Math.random() * GAME_CONFIG.CANVAS_WIDTH,
                    y: Math.random() * GAME_CONFIG.CANVAS_HEIGHT
                };
                this.speed = this.baseSpeed * 0.6;
                break;
                
            case 'dead':
                // Return to spawn point
                this.target = { x: GAME_CONFIG.GRID_SIZE * 5, y: GAME_CONFIG.GRID_SIZE * 5 };
                this.speed = this.baseSpeed * 1.5;
                break;
        }
    }
    
    updateChaseTarget(pacman) {
        // Different personalities have different chase behaviors
        switch (this.personality) {
            case 'aggressive': // Red ghost - direct chase
                this.target = { x: pacman.x, y: pacman.y };
                break;
                
            case 'ambush': // Pink ghost - aim ahead of Pacman
                const directions = [
                    { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 0, y: -1 }
                ];
                const dir = directions[pacman.direction] || directions[0];
                this.target = {
                    x: pacman.x + dir.x * GAME_CONFIG.GRID_SIZE * 4,
                    y: pacman.y + dir.y * GAME_CONFIG.GRID_SIZE * 4
                };
                break;
                
            case 'patrol': // Cyan ghost - patrol behavior
                const distance = Math.sqrt(
                    Math.pow(pacman.x - this.x, 2) + Math.pow(pacman.y - this.y, 2)
                );
                if (distance > GAME_CONFIG.GRID_SIZE * 8) {
                    this.target = { x: pacman.x, y: pacman.y };
                } else {
                    this.target = this.homeCorner;
                }
                break;
                
            case 'random': // Orange ghost - somewhat random
                if (Math.random() < 0.7) {
                    this.target = { x: pacman.x, y: pacman.y };
                } else {
                    this.target = {
                        x: Math.random() * GAME_CONFIG.CANVAS_WIDTH,
                        y: Math.random() * GAME_CONFIG.CANVAS_HEIGHT
                    };
                }
                break;
        }
    }
    
    move(deltaTime, gameMap) {
        // Simple pathfinding toward target
        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        
        // Choose best direction
        let bestDirection = this.direction;
        let bestScore = -Infinity;
        
        const directions = [
            { x: 1, y: 0 },   // right
            { x: 0, y: 1 },   // down  
            { x: -1, y: 0 },  // left
            { x: 0, y: -1 }   // up
        ];
        
        for (let i = 0; i < directions.length; i++) {
            // Don't reverse direction unless necessary
            if (i === (this.direction + 2) % 4) continue;
            
            const dir = directions[i];
            const newX = this.x + dir.x * this.speed * deltaTime;
            const newY = this.y + dir.y * this.speed * deltaTime;
            
            // Check if move is valid
            if (this.isValidPosition(newX, newY, gameMap)) {
                // Calculate score based on distance to target
                const newDx = this.target.x - newX;
                const newDy = this.target.y - newY;
                const distanceToTarget = Math.sqrt(newDx * newDx + newDy * newDy);
                const score = -distanceToTarget + Math.random() * 10; // Add slight randomness
                
                if (score > bestScore) {
                    bestScore = score;
                    bestDirection = i;
                }
            }
        }
        
        // Move in chosen direction
        this.direction = bestDirection;
        const dir = directions[this.direction];
        const newX = this.x + dir.x * this.speed * deltaTime;
        const newY = this.y + dir.y * this.speed * deltaTime;
        
        if (this.isValidPosition(newX, newY, gameMap)) {
            this.x = newX;
            this.y = newY;
        } else {
            // If stuck, try a random direction
            this.direction = Math.floor(Math.random() * 4);
        }
    }
    
    isValidPosition(x, y, gameMap) {
        // Check boundaries
        if (x - this.size < 0 || x + this.size > GAME_CONFIG.CANVAS_WIDTH ||
            y - this.size < 0 || y + this.size > GAME_CONFIG.CANVAS_HEIGHT) {
            return false;
        }
        
        // Check walls
        const gridX = Math.floor(x / GAME_CONFIG.GRID_SIZE);
        const gridY = Math.floor(y / GAME_CONFIG.GRID_SIZE);
        
        if (gridY >= 0 && gridY < gameMap.length &&
            gridX >= 0 && gridX < gameMap[gridY].length) {
            return gameMap[gridY][gridX] !== 1; // Not a wall
        }
        
        return true;
    }
    
    render(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Ghost body color based on mode
        let bodyColor = this.color;
        if (this.mode === 'frightened') {
            // Flash between blue and white when frightened
            const flashCycle = Math.floor(this.animationFrame * 4) % 2;
            bodyColor = flashCycle === 0 ? '#0000FF' : '#FFFFFF';
        } else if (this.mode === 'dead') {
            bodyColor = 'transparent';
        }
        
        // Ghost body (rounded top)
        if (this.mode !== 'dead') {
            ctx.fillStyle = bodyColor;
            ctx.beginPath();
            ctx.arc(0, -this.size * 0.2, this.size, 0, Math.PI, true);
            ctx.rect(-this.size, -this.size * 0.2, this.size * 2, this.size * 1.2);
            ctx.fill();
            
            // Ghost bottom (wavy animation)
            const waveOffset = Math.sin(this.animationFrame * 3) * 2;
            ctx.beginPath();
            ctx.moveTo(-this.size, this.size);
            ctx.lineTo(-this.size * 0.5, this.size * 0.7 + waveOffset);
            ctx.lineTo(0, this.size);
            ctx.lineTo(this.size * 0.5, this.size * 0.7 - waveOffset);
            ctx.lineTo(this.size, this.size);
            ctx.lineTo(this.size, this.size * 0.2);
            ctx.lineTo(-this.size, this.size * 0.2);
            ctx.fill();
        }
        
        // Eyes
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(-this.size * 0.3, -this.size * 0.3, this.size * 0.2, 0, Math.PI * 2);
        ctx.arc(this.size * 0.3, -this.size * 0.3, this.size * 0.2, 0, Math.PI * 2);
        ctx.fill();
        
        // Eye pupils
        ctx.fillStyle = '#000000';
        const eyeDirection = this.mode === 'frightened' ? 0 : this.direction;
        const eyeOffsetX = [0.05, 0, -0.05, 0][eyeDirection] * this.size;
        const eyeOffsetY = [0, 0.05, 0, -0.05][eyeDirection] * this.size;
        
        ctx.beginPath();
        ctx.arc(-this.size * 0.3 + eyeOffsetX, -this.size * 0.3 + eyeOffsetY, this.size * 0.1, 0, Math.PI * 2);
        ctx.arc(this.size * 0.3 + eyeOffsetX, -this.size * 0.3 + eyeOffsetY, this.size * 0.1, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
    
    // Mode changes
    frighten() {
        if (this.mode !== 'dead') {
            this.mode = 'frightened';
            this.modeTimer = 0;
            this.speed = this.baseSpeed * 0.6;
            // Reverse direction
            this.direction = (this.direction + 2) % 4;
        }
    }
    
    kill() {
        this.mode = 'dead';
        this.modeTimer = 0;
        this.speed = this.baseSpeed * 1.5;
    }
    
    revive() {
        this.mode = 'scatter';
        this.modeTimer = 0;
        this.speed = this.baseSpeed;
    }
}

// Export for use in main game
window.Ghost = Ghost;

console.log('👻 Ghost AI module loaded');