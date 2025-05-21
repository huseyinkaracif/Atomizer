const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);

// Socket.io için CORS ayarları ekliyorum
const io = new Server(server, {
  cors: {
    origin: "*", // Geliştirme için tüm originslerden bağlantıya izin veriyoruz
    methods: ["GET", "POST"],
  },
});

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

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
  console.log(
    `Client connected: ${socket.id} - IP: ${socket.handshake.address}`
  );

  // Add client to our map
  clients.set(socket.id, {
    id: socket.id,
    position: { x: 0, y: 0 },
    size: { width: 0, height: 0 },
    connected: Date.now(),
  });

  console.log(`Toplam bağlı client sayısı: ${clients.size}`);

  // Send current scene state to new client
  socket.emit("sceneState", sceneState);
  console.log("Scene state sent to client:", socket.id);

  // Send list of all connected clients to everyone
  io.emit("clientsUpdate", Array.from(clients.values()));
  console.log("Client listesi tüm clientlara gönderildi");

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
    console.log("Scene state update from client:", socket.id, newState);

    // Merge new settings with existing state
    sceneState = { ...sceneState, ...newState };

    // Broadcast updated scene state to all clients
    io.emit("sceneState", sceneState);
    console.log("Updated scene state sent to all clients");
  });

  // Handle client disconnection
  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
    clients.delete(socket.id);
    console.log(`Kalan client sayısı: ${clients.size}`);
    io.emit("clientsUpdate", Array.from(clients.values()));
  });
});

// Add route for root
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Add route for control panel
app.get("/control-panel", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "control-panel.html"));
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Main application: http://localhost:${PORT}`);
  console.log(`Control panel: http://localhost:${PORT}/control-panel.html`);
});
