# 🎮 Pacman Game - Interactive Web Version

A modern, fully interactive Pacman game built with HTML5 Canvas, CSS animations, and vanilla JavaScript. Play the classic arcade game right in your browser with smooth animations, responsive controls, and creative visual effects.

![Pacman Game](https://img.shields.io/badge/Game-Pacman-yellow?style=for-the-badge&logo=pac-man)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)

## 🚀 Play Now

**[🎮 Play Pacman Game](https://yourusername.github.io/pacman)** _(Replace with your GitHub Pages URL)_

## ✨ Features

### 🎯 Core Gameplay
- **Classic Pacman mechanics** - Navigate mazes, collect pellets, avoid ghosts
- **Smooth 60fps gameplay** using requestAnimationFrame
- **Responsive controls** with arrow keys
- **Power pellet system** - Temporarily become invincible and eat ghosts
- **Progressive difficulty** - Multiple levels with increasing challenge
- **Score system** with bonus points and lives

### 🎨 Visual & Audio
- **Animated Pacman character** with mouth opening/closing synchronized to movement
- **CSS-based sprite animations** for all game elements
- **Modern Unicode support** - Uses new 2024 Unicode 16.0 Pacman characters: 𜱫 𜱬 𜱭 𜱮
- **Creative emoji combinations** for enhanced visual appeal
- **Responsive design** - Works on desktop and mobile devices
- **Accessibility features** - High contrast and reduced motion support

### 🤖 Advanced AI
- **Intelligent ghost behavior** - Each ghost has unique personality and strategy
- **Multiple AI modes** - Scatter, chase, frightened, and dead states
- **Advanced pathfinding** - Ghosts navigate efficiently around the maze
- **Dynamic difficulty** - Ghosts become smarter as levels progress

### 💻 Technical Features
- **Modular JavaScript architecture** - Clean, maintainable code
- **Advanced collision detection** - AABB, circle, and grid-based systems
- **Performance optimized** - Efficient rendering and game loop
- **Cross-browser compatible** - Works in all modern browsers
- **Mobile responsive** - Touch-friendly interface

## 🎮 How to Play

### Controls
- **Arrow Keys** - Move Pacman (Up, Down, Left, Right)
- **Spacebar** - Pause/Resume game
- **R Key** - Restart game (when game over)

### Objective
1. **Collect all pellets** in the maze to advance to the next level
2. **Avoid ghosts** - They will cost you a life if touched
3. **Eat power pellets** (large yellow dots) to temporarily turn ghosts blue and edible
4. **Score points** by collecting pellets (10 points) and power pellets (50 points)
5. **Bonus points** for eating ghosts during power mode (200 points each)

### Game Elements
- 🟡 **Pacman** - Your character, moves with arrow keys
- 👻 **Red Ghost** - Aggressive, chases directly
- 💖 **Pink Ghost** - Ambush style, aims ahead of Pacman
- 🐝 **Cyan Ghost** - Patrol behavior, unpredictable
- 🍊 **Orange Ghost** - Random movement pattern
- ⚪ **Pellets** - Collect to score points and clear level
- 🟨 **Power Pellets** - Makes ghosts vulnerable temporarily

## 🛠️ Local Development

### Prerequisites
- Any modern web browser (Chrome, Firefox, Safari, Edge)
- Web server (for local development) - optional but recommended

### Quick Start
1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/pacman.git
   cd pacman
   ```

2. **Open in browser**
   ```bash
   # Option 1: Direct file opening
   open index.html
   
   # Option 2: Local server (recommended)
   python -m http.server 8000
   # Then open http://localhost:8000
   ```

3. **Start playing!** 🎮

### Project Structure
```
pacman/
├── index.html          # Main game page
├── css/
│   ├── game.css       # Main game styling
│   └── sprites.css    # Character animations
├── js/
│   ├── game.js        # Core game logic and loop
│   ├── pacman.js      # Pacman character class
│   ├── ghost.js       # Ghost AI and behavior
│   └── collision.js   # Collision detection system
├── assets/
│   ├── sprites/       # Game sprites (future enhancement)
│   └── sounds/        # Sound effects (future enhancement)
├── examples/          # Code examples and tutorials
│   ├── canvas-setup.html
│   ├── pacman-animation.html
│   ├── keyboard-controls.html
│   ├── collision-detection.html
│   ├── game-loop.html
│   └── unicode-assets.html
└── README.md
```

## 🚀 GitHub Pages Deployment

### Automatic Deployment (Recommended)
1. **Fork this repository** to your GitHub account
2. **Enable GitHub Pages** in repository settings:
   - Go to Settings → Pages
   - Select "Deploy from a branch"
   - Choose "main" branch, "/ (root)" folder
   - Click Save
3. **Your game will be available** at `https://yourusername.github.io/pacman`

### Manual Deployment
1. **Create a new repository** on GitHub
2. **Push your code** to the main branch
3. **Configure GitHub Pages** as described above

### Custom Domain (Optional)
1. **Add a CNAME file** to your repository root with your domain
2. **Configure DNS** to point to `yourusername.github.io`
3. **Enable custom domain** in GitHub Pages settings

## 🔧 Customization

### Adding New Levels
Edit the `createDefaultMap()` function in `js/game.js`:
```javascript
// Add custom maze patterns
const customMaze = [
    [1,1,1,1,1,1,1,1],
    [1,2,2,2,2,2,2,1],
    [1,2,1,3,3,1,2,1],
    // ... your maze pattern
];
```

### Modifying Game Settings
Adjust constants in `js/game.js`:
```javascript
const GAME_CONFIG = {
    CANVAS_WIDTH: 800,    // Game width
    CANVAS_HEIGHT: 600,   // Game height
    GRID_SIZE: 20,        // Cell size
    GAME_SPEED: 200,      // Movement speed
    FPS_TARGET: 60        // Target framerate
};
```

### Adding Sound Effects
1. Add audio files to `assets/sounds/`
2. Load sounds in `js/game.js`:
   ```javascript
   const sounds = {
       chomp: new Audio('assets/sounds/chomp.wav'),
       powerPellet: new Audio('assets/sounds/power.wav')
   };
   ```

### Custom Styling
Modify `css/game.css` and `css/sprites.css` to change:
- Colors and themes
- Animation speeds
- Visual effects
- Responsive breakpoints

## 🎯 Code Examples

The `examples/` directory contains comprehensive tutorials:

- **canvas-setup.html** - HTML5 Canvas basics
- **pacman-animation.html** - CSS and JavaScript animations
- **keyboard-controls.html** - Input handling and smooth movement
- **collision-detection.html** - Various collision detection methods
- **game-loop.html** - Game loop optimization and FPS monitoring
- **unicode-assets.html** - Modern Unicode characters and emoji usage

## 🌐 Browser Support

| Browser | Version | Support |
|---------|---------|---------|
| Chrome  | 88+     | ✅ Full |
| Firefox | 85+     | ✅ Full |
| Safari  | 14+     | ✅ Full |
| Edge    | 88+     | ✅ Full |
| Mobile  | All     | ✅ Responsive |

### Unicode 16.0 Characters
The game uses new 2024 Pacman Unicode characters (𜱫 𜱬 𜱭 𜱮). If not supported by your browser/font, the game automatically falls back to compatible alternatives.

## 🚀 Performance

- **60fps** smooth gameplay on modern devices
- **Efficient collision detection** with spatial optimization
- **Memory management** prevents memory leaks
- **Responsive design** adapts to screen sizes
- **Battery optimized** for mobile devices

## 🤝 Contributing

Contributions are welcome! Here's how to help:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit changes** (`git commit -m 'Add amazing feature'`)
4. **Push to branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

### Development Guidelines
- Follow existing code style
- Add comments for complex logic
- Test on multiple browsers
- Update README if needed
- Keep performance in mind

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🎮 Credits

- **Original Pacman** - Namco (1980)
- **Modern Implementation** - Built with love for the web
- **Unicode Characters** - Unicode Consortium (2024)
- **Inspiration** - Classic arcade gaming culture

## 🔮 Future Enhancements

- [ ] Sound effects and background music
- [ ] Multiple maze designs
- [ ] Online leaderboards
- [ ] Multiplayer support
- [ ] Power-up variations
- [ ] Mobile touch controls
- [ ] Progressive Web App (PWA) support
- [ ] WebGL rendering for enhanced graphics

## 📧 Support

Found a bug or have a suggestion? 

- 🐛 [Report Issues](https://github.com/yourusername/pacman/issues)
- 💡 [Request Features](https://github.com/yourusername/pacman/discussions)
- 📧 Email: your.email@example.com

---

<div align="center">
  
**🎮 Enjoy playing Pacman! 🎮**

Made with ❤️ and JavaScript

[⭐ Star this repo](https://github.com/yourusername/pacman) | [🍴 Fork it](https://github.com/yourusername/pacman/fork) | [🎮 Play now](https://yourusername.github.io/pacman)

</div>