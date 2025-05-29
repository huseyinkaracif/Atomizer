const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
  // Optimize for real-time performance
  pingTimeout: 60000,
  pingInterval: 25000,
  upgradeTimeout: 30000,
  allowUpgrades: true,
  transports: ["websocket", "polling"],
});

// Serve static files
app.use(express.static(path.join(__dirname, ".")));

// Store window data
let windows = new Map();
let windowCount = 0;

// Throttling for position updates
const positionUpdateThrottle = new Map();
const POSITION_THROTTLE_MS = 8; // 120fps max

// Batch processing for position updates
let positionUpdateBatch = new Map();
let batchTimeout = null;

function processBatchedUpdates() {
  if (positionUpdateBatch.size === 0) return;

  // Send all batched updates
  for (const [socketId, data] of positionUpdateBatch) {
    const socket = io.sockets.sockets.get(socketId);
    if (socket) {
      socket.broadcast.emit("realtime-position-update", data);
    }
  }

  positionUpdateBatch.clear();
  batchTimeout = null;
}

io.on("connection", (socket) => {
  console.log(`Window connected: ${socket.id}`);

  // Handle new window registration
  socket.on("register-window", (data) => {
    windowCount++;
    const windowData = {
      id: windowCount,
      socketId: socket.id,
      shape: data.shape,
      metaData: data.metaData,
      realtimePosition: data.shape,
    };

    windows.set(socket.id, windowData);

    // Send current windows to new client
    socket.emit("windows-update", Array.from(windows.values()));

    // Notify other windows about new window
    socket.broadcast.emit("window-added", windowData);

    console.log(
      `Window registered: ${windowData.id}, Total windows: ${windows.size}`
    );
  });

  // Handle window shape updates (throttled)
  socket.on("window-update", (data) => {
    const window = windows.get(socket.id);
    if (window) {
      window.shape = data.shape;
      window.realtimePosition = data.shape;

      // Throttle shape updates to prevent spam
      const now = Date.now();
      const lastUpdate = positionUpdateThrottle.get(socket.id) || 0;

      if (now - lastUpdate > 16) {
        // Max 60fps for shape changes
        socket.broadcast.emit("window-shape-changed", {
          id: window.id,
          socketId: socket.id,
          shape: data.shape,
        });
        positionUpdateThrottle.set(socket.id, now);
      }
    }
  });

  // Handle real-time position updates (high frequency, batched)
  socket.on("realtime-position", (data) => {
    const window = windows.get(socket.id);
    if (window) {
      window.realtimePosition = data.position;

      // Add to batch instead of sending immediately
      positionUpdateBatch.set(socket.id, {
        id: window.id,
        socketId: socket.id,
        position: data.position,
      });

      // Process batch on next tick if not already scheduled
      if (!batchTimeout) {
        batchTimeout = setTimeout(processBatchedUpdates, POSITION_THROTTLE_MS);
      }
    }
  });

  // Handle window disconnect
  socket.on("disconnect", () => {
    const window = windows.get(socket.id);
    if (window) {
      windows.delete(socket.id);
      positionUpdateThrottle.delete(socket.id);
      positionUpdateBatch.delete(socket.id);

      // Notify other windows about window removal
      socket.broadcast.emit("window-removed", {
        id: window.id,
        socketId: socket.id,
      });

      console.log(
        `Window disconnected: ${window.id}, Remaining windows: ${windows.size}`
      );
    }
  });

  // Ping-pong for latency monitoring (reduced frequency)
  socket.on("ping", (timestamp) => {
    socket.emit("pong", timestamp);
  });

  // Add heartbeat to keep connection alive
  socket.on("heartbeat", () => {
    socket.emit("heartbeat-ack");
  });
});

// Cleanup stale data periodically
setInterval(() => {
  const now = Date.now();
  for (const [socketId, timestamp] of positionUpdateThrottle) {
    if (now - timestamp > 60000) {
      // 1 minute cleanup
      positionUpdateThrottle.delete(socketId);
    }
  }
}, 30000); // Run every 30 seconds

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Socket.IO server running on http://localhost:${PORT}`);
  console.log(`📱 Open multiple browser windows to see synchronized atoms!`);
  console.log(
    `⚡ Optimized for real-time performance with batching and throttling`
  );
});
