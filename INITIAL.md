## FEATURE:

Interactive web-based Pacman replica game with smooth animations, responsive controls, and GitHub Pages deployment. The game features:

- **Animated Pacman character** with mouth opening/closing synchronized to movement direction
- **Arrow key controls** for fluid movement (up, down, left, right)
- **Creative visual design** using modern Unicode Pacman characters (𜱫 𜱬 𜱭 𜱮) and emoji combinations
- **Game mechanics**: pellet collection, ghost AI, collision detection, scoring system
- **Cross-platform compatibility**: runs in any modern browser, deployable to GitHub Pages
- **Performance optimized**: 60fps game loop using requestAnimationFrame

## EXAMPLES:

Examples to be created in the `examples/` folder:

1. **Basic Canvas Setup** (`examples/canvas-setup.html`)
   - HTML5 Canvas initialization and context setup
   - Basic drawing functions and coordinate system

2. **Pacman Mouth Animation** (`examples/pacman-animation.html`)
   - CSS clip-path animation for mouth opening/closing
   - Sprite sheet animation techniques
   - Direction-based animation switching

3. **Arrow Key Controls** (`examples/keyboard-controls.html`)
   - Event listeners for keydown/keyup
   - Smooth movement with velocity and direction state
   - Preventing default browser behaviors

4. **Collision Detection System** (`examples/collision-detection.html`)
   - AABB (Axis-Aligned Bounding Box) collision detection
   - Grid-based collision for walls and pellets
   - Efficient collision checking algorithms

5. **Game Loop Implementation** (`examples/game-loop.html`)
   - requestAnimationFrame loop structure
   - Delta time calculations for consistent speed
   - Update and render separation

6. **Creative Unicode Assets** (`examples/unicode-assets.html`)
   - New 2024 Pacman Unicode characters demonstration
   - Emoji combinations for game elements
   - Custom CSS styling for game assets

## DOCUMENTATION:

Key documentation sources to reference during development:

### Core Game Development
- **MDN Game Development Tutorials**: https://developer.mozilla.org/en-US/docs/Games
- **HTML5 Canvas API Documentation**: https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API
- **Chris Courses Pacman Tutorial**: Comprehensive video tutorial covering complete Pacman implementation
- **CSS-Tricks Game Animation Guide**: https://css-tricks.com/pac-man-in-css/

### Animation & Graphics
- **Canvas Animation Techniques**: https://cwestblog.com/2017/02/02/canvas-animating-pacman-head-in-js/
- **Sprite Sheet Animation Methods**: Traditional and modern approaches
- **CSS Clip-Path Animation**: For smooth mouth animations
- **RequestAnimationFrame Best Practices**: Performance optimization guides

### Collision Detection & Physics
- **HTML5 Canvas 2D Collision Detection**: https://blog.sklambert.com/html5-canvas-game-2d-collision-detection/
- **Game Physics Implementation**: Collision response and boundary detection
- **Optimization Techniques**: Quadtrees and spatial partitioning for performance

### GitHub Pages Deployment
- **GitHub Pages Documentation**: https://docs.github.com/en/pages
- **HTML5 Game Hosting Guide**: https://end3r.com/blog/2014/02/host-your-html5-games-on-github-pages/
- **Static Site Deployment Best Practices**: Configuration and optimization

### Unicode & Assets
- **Unicode 16.0 Pacman Characters**: Official 2024 additions to Unicode standard
- **Emoji Game Assets**: Creative combinations for visual elements
- **SVG and Icon Resources**: IconScout, Flaticon, Icons8 for additional assets

## OTHER CONSIDERATIONS:

### Technical Gotchas & Requirements
- **Browser Compatibility**: Ensure Canvas and modern JavaScript features work across browsers
- **Mobile Responsiveness**: Touch controls as fallback for mobile devices (future enhancement)
- **Asset Loading**: Implement proper asset preloading to prevent visual glitches
- **Performance Monitoring**: Profile collision detection to maintain 60fps on lower-end devices

### Game Design Considerations
- **Collision Precision**: Grid-based movement vs. pixel-perfect collision (choose grid for authenticity)
- **Animation Timing**: Synchronize mouth animation speed with movement speed for visual consistency
- **Sound Integration**: Prepare architecture for future sound effects (Web Audio API)
- **Progressive Enhancement**: Start with core gameplay, add polish features incrementally

### Deployment & Hosting
- **GitHub Pages Limitations**: Static hosting only - no server-side logic needed
- **Domain Configuration**: Option to use custom domain for professional presentation
- **Build Process**: Simple static files, no complex build pipeline required
- **Version Control**: Use semantic versioning for game updates

### Code Architecture
- **Modular Design**: Separate classes for Pacman, Ghosts, Map, GameEngine
- **State Management**: Clean separation between game state and rendering
- **Code Splitting**: Organize by feature (movement, collision, rendering, input)
- **Testing Strategy**: Unit tests for core game logic, integration tests for user interactions

### Common AI Assistant Oversights
- **Keyboard Event Handling**: Remember to prevent default behaviors and handle key repeat
- **Animation Frame Management**: Don't forget to cleanup intervals and event listeners
- **Canvas Context State**: Always save/restore canvas state when changing drawing properties
- **Unicode Character Support**: Test new 2024 Pacman characters across different browsers/fonts
- **Mobile Viewport**: Configure proper viewport meta tag for consistent mobile experience
