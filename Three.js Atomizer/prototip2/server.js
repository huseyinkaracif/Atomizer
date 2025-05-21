const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

// Create Express app and HTTP server
const app = express();
const server = http.createServer(app);

// Socket.io configuration with CORS
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins for development
    methods: ["GET", "POST"],
  },
  pingTimeout: 60000, // Increase ping timeout
  pingInterval: 25000, // Decrease ping interval
  transports: ["websocket", "polling"], // Allow both transport methods
});

// Request logging middleware with more details
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.url;
  const ip = req.ip || req.connection.remoteAddress;
  const userAgent = req.headers["user-agent"] || "Unknown";

  console.log(
    `[${timestamp}] ${method} ${url} - IP: ${ip} - UA: ${userAgent.substring(
      0,
      50
    )}...`
  );

  // Add response logging
  const originalSend = res.send;
  res.send = function (body) {
    console.log(
      `[${timestamp}] Response ${res.statusCode} to ${method} ${url}`
    );
    return originalSend.call(this, body);
  };

  next();
});

// Serve static files from public directory
app.use(express.static(path.join(__dirname, "public")));

// Store connected clients and scene state
const clients = new Map();
let sceneState = {
  atom: {
    electronCount: 8,
    electronSize: 2.0,
    electronSpeed: 0.3,
    electronColor: "#1a88ff",
    nucleusSize: 15,
    protonCount: 8,
    neutronCount: 8,
    protonColor: "#ff3333",
    neutronColor: "#eeeeee",
    orbitRadius: 100,
    orbitWidth: 0.5,
  },
  camera: {
    rotation: 0.002,
    zoom: 1.0,
  },
  background: {
    color: "#000000",
  },
  animation: {
    electronGlow: true,
    orbitTrails: true,
    particleEffects: true,
    animationSpeed: 1.0,
  },
};

// Helper function to check if a value is an object
function isObject(item) {
  return item && typeof item === "object" && !Array.isArray(item);
}

// Deep merge utility
function deepMerge(target, source) {
  let output = { ...target };
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach((key) => {
      if (isObject(source[key])) {
        if (!(key in target) || !isObject(target[key])) {
          output[key] = source[key];
        } else {
          output[key] = deepMerge(target[key], source[key]);
        }
      } else {
        output[key] = source[key];
      }
    });
  }
  return output;
}

// Socket.io connection handling
io.on("connection", (socket) => {
  try {
    const clientIp =
      socket.handshake.headers["x-forwarded-for"] || socket.handshake.address;
    const clientType = socket.handshake.query.clientType || "client"; // Get clientType

    console.log(
      `${
        clientType === "control-panel" ? "Control Panel" : "Client"
      } connected: ${socket.id} - IP: ${clientIp}`
    );

    if (clientType !== "control-panel") {
      // Add client to our map if it's not a control panel
      clients.set(socket.id, {
        id: socket.id,
        position: { x: 0, y: 0 },
        size: { width: 0, height: 0 },
        connected: Date.now(),
        ip: clientIp,
        type: clientType,
      });
      console.log(`Total connected visualization clients: ${clients.size}`);
      // Send list of all connected clients (excluding control panels) to everyone
      io.emit("clientsUpdate", Array.from(clients.values()));
    } else {
      // For control panel, still useful to send the current client list once for display
      socket.emit("clientsUpdate", Array.from(clients.values()));
    }

    // Send current scene state to new client/control panel
    socket.emit("sceneState", sceneState);
    console.log(`Scene state sent to ${clientType}: ${socket.id}`);

    // Handle client window updates
    socket.on("windowUpdate", (data) => {
      try {
        if (!data || typeof data !== "object") {
          console.error(`Invalid windowUpdate data from ${socket.id}:`, data);
          return;
        }

        if (clients.has(socket.id)) {
          const client = clients.get(socket.id);

          // Update client position and size
          if (data.position) client.position = data.position;
          if (data.size) client.size = data.size;

          // Broadcast updated clients to everyone
          io.emit("clientsUpdate", Array.from(clients.values()));
        }
      } catch (error) {
        console.error(`Error handling windowUpdate from ${socket.id}:`, error);
      }
    });

    // Handle scene state updates from control panel
    socket.on("updateSceneState", (newState) => {
      try {
        if (!newState || typeof newState !== "object") {
          console.error(
            `Invalid updateSceneState data from ${socket.id}:`,
            newState
          );
          return;
        }

        console.log(`Scene state update from ${clientType}: ${socket.id}`);
        console.log("Current sceneState:", JSON.stringify(sceneState));
        console.log("Received newState:", JSON.stringify(newState));

        // Merge new settings with existing state using deep merge
        sceneState = deepMerge(sceneState, newState);
        console.log(
          "Updated sceneState after merge:",
          JSON.stringify(sceneState)
        );

        // Broadcast updated scene state to all clients
        io.emit("sceneState", sceneState);
        console.log(
          `Updated scene state sent to all clients (${clients.size} clients)`
        );
      } catch (error) {
        console.error(
          `Error handling updateSceneState from ${socket.id}:`,
          error
        );
      }
    });

    // Handle client disconnection
    socket.on("disconnect", (reason) => {
      console.log(
        `${
          clientType === "control-panel" ? "Control Panel" : "Client"
        } disconnected: ${socket.id} - Reason: ${reason}`
      );
      if (clientType !== "control-panel" && clients.has(socket.id)) {
        clients.delete(socket.id);
        console.log(`Remaining visualization clients: ${clients.size}`);
        io.emit("clientsUpdate", Array.from(clients.values()));
      }
    });

    // Handle errors
    socket.on("error", (error) => {
      console.error(`Socket error for ${clientType} ${socket.id}:`, error);
    });
  } catch (error) {
    console.error("Error handling socket connection:", error);
  }
});

// Add route for root - main application
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Add route for control panel
app.get("/control-panel", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "control-panel.html"));
});

// Handle 404 errors
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, "public", "index.html"));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).send("Server error occurred");
});

// Start server
const PORT = process.env.PORT || 3000;

// Handle server startup errors
server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(
      `Port ${PORT} is already in use. Please use a different port.`
    );
  } else {
    console.error("Server error:", error);
  }
  process.exit(1);
});

server.listen(PORT, () => {
  console.log(`---------------------------------------`);
  console.log(`Server running on port ${PORT}`);
  console.log(`Main application: http://localhost:${PORT}`);
  console.log(`Control panel: http://localhost:${PORT}/control-panel.html`);
  console.log(`---------------------------------------`);
});
