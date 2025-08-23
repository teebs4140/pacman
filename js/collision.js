/**
 * Collision Detection System
 * Advanced collision detection and response
 */

class CollisionSystem {
    constructor() {
        this.collisionCallbacks = {};
    }
    
    // Register callback for collision types
    onCollision(type, callback) {
        if (!this.collisionCallbacks[type]) {
            this.collisionCallbacks[type] = [];
        }
        this.collisionCallbacks[type].push(callback);
    }
    
    // Trigger collision callbacks
    triggerCollision(type, data) {
        if (this.collisionCallbacks[type]) {
            this.collisionCallbacks[type].forEach(callback => callback(data));
        }
    }
    
    // AABB (Axis-Aligned Bounding Box) collision detection
    aabbCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    
    // Circle collision detection
    circleCollision(circle1, circle2) {
        const dx = circle1.x - circle2.x;
        const dy = circle1.y - circle2.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < circle1.radius + circle2.radius;
    }
    
    // Point in rectangle
    pointInRect(point, rect) {
        return point.x >= rect.x &&
               point.x <= rect.x + rect.width &&
               point.y >= rect.y &&
               point.y <= rect.y + rect.height;
    }
    
    // Point in circle
    pointInCircle(point, circle) {
        const dx = point.x - circle.x;
        const dy = point.y - circle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance <= circle.radius;
    }
    
    // Grid-based collision (for game map)
    gridCollision(x, y, gameMap, gridSize) {
        const gridX = Math.floor(x / gridSize);
        const gridY = Math.floor(y / gridSize);
        
        if (gridY >= 0 && gridY < gameMap.length &&
            gridX >= 0 && gridX < gameMap[gridY].length) {
            return gameMap[gridY][gridX];
        }
        return 0; // Empty space if out of bounds
    }
    
    // Check if position is valid (no walls)
    isValidPosition(x, y, size, gameMap, gridSize) {
        // Check multiple points around the entity
        const points = [
            { x: x - size, y: y - size }, // top-left
            { x: x + size, y: y - size }, // top-right
            { x: x - size, y: y + size }, // bottom-left
            { x: x + size, y: y + size }, // bottom-right
            { x: x, y: y }                // center
        ];
        
        for (const point of points) {
            if (point.x < 0 || point.x >= GAME_CONFIG.CANVAS_WIDTH ||
                point.y < 0 || point.y >= GAME_CONFIG.CANVAS_HEIGHT) {
                return false; // Out of bounds
            }
            
            const cell = this.gridCollision(point.x, point.y, gameMap, gridSize);
            if (cell === 1) { // Wall
                return false;
            }
        }
        
        return true;
    }
    
    // Pacman vs Pellet collision
    checkPacmanPelletCollision(pacman, gameMap, gridSize) {
        const gridX = Math.floor(pacman.x / gridSize);
        const gridY = Math.floor(pacman.y / gridSize);
        
        if (gridY >= 0 && gridY < gameMap.length &&
            gridX >= 0 && gridX < gameMap[gridY].length) {
            
            const cell = gameMap[gridY][gridX];
            if (cell === 2 || cell === 3) { // Pellet or power pellet
                // Check if Pacman is close enough to center of grid cell
                const cellCenterX = (gridX + 0.5) * gridSize;
                const cellCenterY = (gridY + 0.5) * gridSize;
                const dx = pacman.x - cellCenterX;
                const dy = pacman.y - cellCenterY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < gridSize * 0.3) {
                    return { x: gridX, y: gridY, type: cell };
                }
            }
        }
        
        return null;
    }
    
    // Pacman vs Ghost collision
    checkPacmanGhostCollision(pacman, ghost) {
        const dx = pacman.x - ghost.x;
        const dy = pacman.y - ghost.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const minDistance = pacman.size + ghost.size;
        
        if (distance < minDistance * 0.8) { // Slightly more forgiving collision
            return {
                pacman: pacman,
                ghost: ghost,
                distance: distance
            };
        }
        
        return null;
    }
    
    // Advanced collision detection with swept AABBs (for moving objects)
    sweptAABB(rect1, vel1, rect2, vel2, deltaTime) {
        // Relative velocity
        const relativeVelX = vel1.x - vel2.x;
        const relativeVelY = vel1.y - vel2.y;
        
        // Expanded target rectangle
        const expandedRect = {
            x: rect2.x - rect1.width,
            y: rect2.y - rect1.height,
            width: rect2.width + rect1.width,
            height: rect2.height + rect1.height
        };
        
        // Check if the ray from rect1 center intersects expanded rectangle
        if (relativeVelX === 0 && relativeVelY === 0) {
            // Objects not moving relative to each other
            return this.aabbCollision(rect1, rect2) ? 0 : -1;
        }
        
        // Calculate entry and exit times for both axes
        const entryTimeX = relativeVelX > 0 ? 
            (expandedRect.x - rect1.x) / relativeVelX : 
            (expandedRect.x + expandedRect.width - rect1.x) / relativeVelX;
            
        const exitTimeX = relativeVelX > 0 ? 
            (expandedRect.x + expandedRect.width - rect1.x) / relativeVelX : 
            (expandedRect.x - rect1.x) / relativeVelX;
            
        const entryTimeY = relativeVelY > 0 ? 
            (expandedRect.y - rect1.y) / relativeVelY : 
            (expandedRect.y + expandedRect.height - rect1.y) / relativeVelY;
            
        const exitTimeY = relativeVelY > 0 ? 
            (expandedRect.y + expandedRect.height - rect1.y) / relativeVelY : 
            (expandedRect.y - rect1.y) / relativeVelY;
        
        // Find the latest entry time and earliest exit time
        const entryTime = Math.max(entryTimeX, entryTimeY);
        const exitTime = Math.min(exitTimeX, exitTimeY);
        
        // Check if collision will occur
        if (entryTime > exitTime || entryTime < 0 || entryTime > deltaTime) {
            return -1; // No collision
        }
        
        return entryTime; // Time until collision
    }
    
    // Spatial partitioning for efficient collision detection (for many objects)
    createSpatialGrid(width, height, cellSize) {
        return {
            width: Math.ceil(width / cellSize),
            height: Math.ceil(height / cellSize),
            cellSize: cellSize,
            grid: {},
            
            clear() {
                this.grid = {};
            },
            
            insert(object, x, y) {
                const cellX = Math.floor(x / this.cellSize);
                const cellY = Math.floor(y / this.cellSize);
                const key = `${cellX},${cellY}`;
                
                if (!this.grid[key]) {
                    this.grid[key] = [];
                }
                this.grid[key].push(object);
            },
            
            getNearby(x, y, radius = 1) {
                const objects = [];
                const cellX = Math.floor(x / this.cellSize);
                const cellY = Math.floor(y / this.cellSize);
                
                for (let dy = -radius; dy <= radius; dy++) {
                    for (let dx = -radius; dx <= radius; dx++) {
                        const key = `${cellX + dx},${cellY + dy}`;
                        if (this.grid[key]) {
                            objects.push(...this.grid[key]);
                        }
                    }
                }
                
                return objects;
            }
        };
    }
    
    // Collision response helpers
    resolveCollision(obj1, obj2, collision) {
        // Simple elastic collision response
        const dx = obj2.x - obj1.x;
        const dy = obj2.y - obj1.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance === 0) return; // Avoid division by zero
        
        // Normalize
        const nx = dx / distance;
        const ny = dy / distance;
        
        // Separate objects
        const overlap = (obj1.size + obj2.size) - distance;
        const separationX = nx * overlap * 0.5;
        const separationY = ny * overlap * 0.5;
        
        obj1.x -= separationX;
        obj1.y -= separationY;
        obj2.x += separationX;
        obj2.y += separationY;
        
        // Exchange velocities (if objects have velocity)
        if (obj1.vx !== undefined && obj1.vy !== undefined &&
            obj2.vx !== undefined && obj2.vy !== undefined) {
            
            const tempVx = obj1.vx;
            const tempVy = obj1.vy;
            
            obj1.vx = obj2.vx;
            obj1.vy = obj2.vy;
            obj2.vx = tempVx;
            obj2.vy = tempVy;
        }
    }
}

// Singleton collision system
const collisionSystem = new CollisionSystem();

// Export for use in main game
window.CollisionSystem = CollisionSystem;
window.collisionSystem = collisionSystem;

console.log('💥 Collision detection system loaded');