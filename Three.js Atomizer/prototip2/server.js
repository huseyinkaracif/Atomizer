const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// Store connected clients and scene state
const clients = new Map();
let sceneState = {
  particles: {
    count: 1000,
    size: 2.0,
    speed: 0.3,
    color: "#1a88ff",
  },
  camera: {
    rotation: 0.002,
    zoom: 1.0,
  },
  background: {
    color: "#000000",
  },
};

// Socket.io connection handling
io.on("connection", (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Add client to our map
  clients.set(socket.id, {
    id: socket.id,
    position: { x: 0, y: 0 },
    size: { width: 0, height: 0 },
    connected: Date.now(),
  });

  // Send current scene state to new client
  socket.emit("sceneState", sceneState);

  // Send list of all connected clients to everyone
  io.emit("clientsUpdate", Array.from(clients.values()));

  // Handle client window updates
  socket.on("windowUpdate", (data) => {
    if (clients.has(socket.id)) {
      const client = clients.get(socket.id);
      client.position = data.position;
      client.size = data.size;

      // Broadcast updated clients to everyone
      io.emit("clientsUpdate", Array.from(clients.values()));
    }
  });

  // Handle scene state updates from control panel
  socket.on("updateSceneState", (newState) => {
    // Merge new settings with existing state
    sceneState = { ...sceneState, ...newState };

    // Broadcast updated scene state to all clients
    io.emit("sceneState", sceneState);
    console.log("Scene state updated:", sceneState);
  });

  // Handle client disconnection
  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
    clients.delete(socket.id);
    io.emit("clientsUpdate", Array.from(clients.values()));
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
