# Cosmic Particles - Synchronized 3D Scenes

A modern implementation of a multi-window 3D visualization using Three.js and a client-server architecture. This project is inspired by [bgstaal/multipleWindow3dScene](https://github.com/bgstaal/multipleWindow3dScene) but with several significant enhancements.

## Features

- **Client-Server Architecture:** Uses Socket.io for real-time communication instead of localStorage
- **Advanced 3D Visualization:** Beautiful cosmic particle system with shader-based rendering
- **Centralized Control:** Dedicated control panel for managing all connected clients
- **Real-time Settings:** Update particle count, size, speed, and colors across all windows
- **Window Visualization:** See an overview of all connected windows and their positions
- **Responsive Design:** Works across different screen sizes and window configurations

## Technical Stack

- **Backend:** Node.js with Express and Socket.io for real-time communication
- **Frontend:** Three.js for 3D graphics, Vanilla JavaScript for core functionality
- **UI Controls:** dat.GUI for interactive parameter controls

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- NPM (v6 or higher)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/huseyinkaracif/cosmic-particles.git
   cd cosmic-particles
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the server:
   ```
   npm start
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

5. For the dedicated control panel, navigate to:
   ```
   http://localhost:3000/control-panel.html
   ```

## Usage

- **Opening Windows:** Click "Open New Window" or press Ctrl+N to open additional windows
- **Control Panel:** The first window that connects will show control sliders
- **Adjusting Settings:** Changes made in the control panel will be synced to all windows
- **Window Visualization:** Each window is represented in other windows to show their relative positions
- **Keyboard Shortcuts:**
  - Ctrl+N: Open a new window
  - H: Toggle control panel visibility (in the first window)

## How It Works

1. The server manages client connections and distributes scene state updates
2. Each client window connects to the server via Socket.io
3. When window position or size changes, the information is sent to the server
4. The server broadcasts updates to all clients to maintain a synchronized view
5. The 3D scene shows a cosmic particle system that spans across all windows

## Acknowledgments

- Based on the original concept by [Bjørn Staal](https://github.com/bgstaal) in [multipleWindow3dScene](https://github.com/bgstaal/multipleWindow3dScene)
- Uses [Three.js](https://threejs.org/) for 3D rendering
- Uses [Socket.io](https://socket.io/) for real-time communication
- Uses [dat.GUI](https://github.com/dataarts/dat.gui) for the control interface