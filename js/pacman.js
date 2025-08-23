/**
 * Pacman Character Class
 * Extended Pacman functionality and animations
 */

// This file extends the basic Pacman functionality in game.js
// Currently, the basic Pacman logic is implemented in the main game file

class PacmanCharacter {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = GAME_CONFIG.GRID_SIZE * 0.4;
        this.speed = GAME_CONFIG.GAME_SPEED;
        this.direction = 0; // 0: right, 1: down, 2: left, 3: up
        this.targetDirection = 0;
        this.mouthOpen = 0;
        this.mouthDirection = 1;
        this.animationSpeed = 0.15;
        this.gridX = Math.floor(x / GAME_CONFIG.GRID_SIZE);
        this.gridY = Math.floor(y / GAME_CONFIG.GRID_SIZE);
        
        // Animation states
        this.isMoving = false;
        this.lastMoveTime = 0;
    }
    
    update(deltaTime, inputKeys) {
        // Enhanced Pacman logic can be added here
        // For now, the basic implementation in game.js is sufficient
        
        // Update mouth animation
        if (this.isMoving) {
            this.mouthOpen += this.mouthDirection * this.animationSpeed;
            if (this.mouthOpen >= 1) {
                this.mouthOpen = 1;
                this.mouthDirection = -1;
            } else if (this.mouthOpen <= 0) {
                this.mouthOpen = 0;
                this.mouthDirection = 1;
            }
        }
        
        // Update grid position
        this.gridX = Math.floor(this.x / GAME_CONFIG.GRID_SIZE);
        this.gridY = Math.floor(this.y / GAME_CONFIG.GRID_SIZE);
    }
    
    render(ctx) {
        // Enhanced rendering can be added here
        // The basic rendering is handled in game.js
        
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.direction * Math.PI / 2);
        
        // Draw Pacman with mouth animation
        ctx.fillStyle = '#FFFF00';
        const mouthAngle = this.mouthOpen * 0.7;
        
        ctx.beginPath();
        ctx.arc(0, 0, this.size, mouthAngle, 2 * Math.PI - mouthAngle);
        ctx.lineTo(0, 0);
        ctx.fill();
        
        // Draw eye with enhanced animation
        ctx.fillStyle = '#000000';
        const eyeSize = this.size * 0.15;
        const eyeOffset = this.size * 0.3;
        
        // Blinking animation
        const blinkCycle = (Date.now() % 3000) / 3000;
        const eyeHeight = blinkCycle > 0.95 ? eyeSize * 0.3 : eyeSize;
        
        ctx.beginPath();
        ctx.ellipse(-eyeOffset, -eyeOffset, eyeSize, eyeHeight, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
    
    // Power-up effects
    enablePowerMode() {
        this.speed *= 1.2;
        // Add visual effects
    }
    
    disablePowerMode() {
        this.speed = GAME_CONFIG.GAME_SPEED;
    }
}

// Export for use in main game
window.PacmanCharacter = PacmanCharacter;

console.log('📦 Pacman Character module loaded');