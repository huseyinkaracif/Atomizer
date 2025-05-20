# Three.js Atomizer

This project aims to create a vivid and interactive atom model simulation using Three.js. The project visualizes atomic nucleus, electrons, and their orbits in real-time.

## Features

- **3D Atom Model**: Detailed nucleus, electron orbits, and particle effects
- **Synchronized Windows**: Real-time synchronization between atom models opened in different windows
- **Central Control Panel**: Ability to control all atom parameters from a single place
- **Real-Time Settings**: Instantly modify properties like electron count, particle count, rotation speed
- **Window Tracking**: Monitor positions and states of all windows containing the atom simulation

## Technologies

- [Three.js](https://threejs.org/) - 3D graphics library
- [Broadcast Channel API](https://developer.mozilla.org/en-US/docs/Web/API/Broadcast_Channel_API) - Cross-window communication
- [DAT.GUI](https://github.com/dataarts/dat.gui) - User interface controls

## Projects

### Prototype 1

The first prototype includes basic atom model simulation and cross-window synchronization features.

Files:
- `index.html` - Main atom viewing page
- `atom.js` - Atom model and 3D visualization
- `window-tracker.js` - Window tracking and synchronization
- `browser-monitor.html` - Control panel
- `server.js` - Control panel functionality
- `broadcast.js` - Cross-window messaging

## Installation

1. Clone the project to your computer
2. Run the project using a web server (e.g., Live Server VSCode extension)
3. Open the `browser-monitor.html` file to see the control panel
4. Open the `index.html` file in multiple windows to view the atom

## Usage

1. Adjust atom parameters through `browser-monitor.html`:
   - Electron Count
   - Nucleotide Count
   - Nucleus Rotation Speed
   - Electron Speed
   - Orbit Radius

2. All windows will automatically synchronize and display the same settings.

3. You can monitor all open windows and their positions from the control panel.

## Screenshots

*Screenshots to be added*

## Future Features

- [ ] More advanced atom models
- [ ] Different element simulations
- [ ] Custom particle effects
- [ ] Window Sync
- [ ] New Animations

## License

MIT

## Contact

GitHub: [Your GitHub Profile](https://github.com/huseyinkaracif) 