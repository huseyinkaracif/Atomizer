# Three.js Atomizer - Multi-Window Synchronized Atoms

Real-time synchronized atom animations across multiple browser windows using Socket.IO. Each window displays a unique atomic element with scientifically accurate electron configurations!

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Server
```bash
npm start
```

### 3. Open Multiple Windows
Navigate to `http://localhost:3000` and open multiple browser windows to see synchronized atoms!

## ⚛️ Featured Atomic Elements

Each new window displays a different element:

1. **Hydrogen (H)** - 1 proton, 1 electron
2. **Helium (He)** - 2 protons, 2 electrons  
3. **Carbon (C)** - 6 protons, 6 electrons
4. **Oxygen (O)** - 8 protons, 8 electrons
5. **Neon (Ne)** - 10 protons, 10 electrons
6. **Sodium (Na)** - 11 protons, 11 electrons
7. **Silicon (Si)** - 14 protons, 14 electrons
8. **Iron (Fe)** - 26 protons, 26 electrons

Elements cycle through as you open more windows!

## ⚡ Enhanced Features

- **Real-time Synchronization**: Atoms move smoothly across all windows
- **Scientific Accuracy**: Proper electron shell configurations
- **Unique Elements**: Each window shows a different atomic element
- **3D Visualization**: Enhanced 3D orbital movements
- **Dynamic Labels**: Element symbols and names displayed
- **Nucleus Particles**: Individual protons/neutrons visualization
- **Orbital Rings**: Visible electron shell boundaries
- **Pulsing Effects**: Dynamic emissive lighting on electrons
- **High Performance**: 120fps updates with optimized batching
- **Socket.IO Integration**: Professional WebSocket communication

## 🛠️ Technical Enhancements

### Atomic Visualization
- **Nucleus**: Phong material with emissive glow
- **Electrons**: Individual electrons with orbital speeds
- **Proton/Neutron Particles**: Animated nucleus components
- **Orbital Shells**: Accurate electron shell configurations
- **3D Movement**: Complex orbital mathematics with tilts
- **Element-Specific Properties**: Colors, sizes, speeds per element

### Enhanced Lighting
- **Ambient Lighting**: Base illumination
- **Directional Light**: Primary scene lighting
- **Point Lights**: Dynamic colored lighting effects
- **Material Properties**: Shininess, transparency, emissive effects

### Performance Optimizations
- **Batched Updates**: Position updates batched every 8ms
- **Smooth Interpolation**: Advanced easing algorithms
- **Memory Management**: Automatic cleanup of atom components
- **Throttled Updates**: Adaptive update rates

## 🎮 Usage

1. **Start Server**: `npm start`
2. **Open Windows**: Multiple browser tabs/windows at `localhost:3000`
3. **Watch Elements**: Each window shows a different atomic element
4. **Move Windows**: Drag windows to see synchronized movement
5. **Study Atoms**: Observe electron configurations and orbital patterns

## 🔬 Educational Value

Perfect for:
- **Chemistry Education**: Visual electron shell learning
- **Physics Demonstrations**: Orbital mechanics visualization
- **Interactive Learning**: Multi-window atomic models
- **Science Museums**: Engaging atomic displays

## 🎨 Visual Features

- **Element Colors**: Unique color schemes per element
- **Orbital Animations**: Realistic electron movement patterns
- **Nucleus Detail**: Individual proton/neutron visualization
- **Dynamic Scaling**: Pulsing electron effects
- **3D Depth**: Z-axis orbital movements
- **Scientific Labels**: Element symbols and names

## 🚀 Advanced Configuration

### Adding New Elements
Edit `ATOMIC_ELEMENTS` array in `main.js`:
```javascript
{
  name: "ElementName",
  symbol: "XX", 
  protons: 12,
  electrons: 12,
  nucleusColor: 0xffffff,
  electronColor: 0x000000,
  orbitSpeed: 0.02,
  nucleusSize: 30,
  electronSize: 8,
  orbits: [40, 70],
  electronsPerOrbit: [2, 10]
}
```

### Customizing Animations
- Modify `orbitSpeed` for electron speeds
- Adjust `nucleusSize` and `electronSize` for scaling
- Change `orbits` array for shell distances
- Update `electronsPerOrbit` for shell populations

Explore the fascinating world of atomic structure! ⚛️✨

## 🔧 Development

```bash
# Development with auto-restart
npm run dev

# Production
npm start
```

## 📊 Performance Metrics

- **Update Rate**: 120fps position updates
- **Latency**: < 16ms typical
- **Memory**: Automatic cleanup every 30s
- **Throttling**: Adaptive based on window movement

## 🐛 Troubleshooting

### Connection Issues
- Check if port 3000 is available
- Ensure Node.js version 14+ is installed
- Verify no firewall blocking connections

### Animation Stuttering
- Optimizations automatically handle this
- Batching prevents overload during rapid movements
- Queue system ensures smooth performance

### Window Sync Problems
- Socket.IO automatically handles reconnections
- Each window gets unique ID for tracking
- Fallback to localStorage if WebSocket fails

## 🚀 Advanced Configuration

### Server Configuration
Edit `server.js` to modify:
- Port number (default: 3000)
- Update throttling rates
- Batch processing intervals

### Client Configuration  
Edit `WindowManager.js` to adjust:
- Update frequencies
- Falloff values
- Queue sizes

Enjoy your synchronized atom animation! 🎉 