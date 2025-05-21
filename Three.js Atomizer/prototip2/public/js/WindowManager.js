class WindowManager {
  constructor() {
    this.socket = null;
    this.connectedClients = [];
    this.windowId = null;
    this.windowInfo = {
      position: { x: 0, y: 0 },
      size: { width: 0, height: 0 },
    };
    this.windowChangeCallbacks = [];
    this.windowShapeChangeCallbacks = [];
    this.connectionStatusChangeCallbacks = [];
    this.sceneStateChangeCallbacks = [];

    // Update window position and size at regular intervals
    setInterval(() => this.checkForWindowChanges(), 100);
  }

  // Connect to the Socket.io server
  connect() {
    // Create Socket.io connection to the server
    this.socket = io();

    // Set up event listeners
    this.socket.on("connect", () => {
      console.log("Connected to server with ID:", this.socket.id);
      this.windowId = this.socket.id;
      this.updateWindowInfo();
      this.updateConnectionStatus(true);

      // Update UI elements
      document.getElementById("windowId").textContent =
        this.windowId.substring(0, 8) + "...";
      document.getElementById("status").textContent = "Connected";
      document.getElementById("status").classList.add("connected");
    });

    this.socket.on("disconnect", () => {
      console.log("Disconnected from server");
      this.updateConnectionStatus(false);

      // Update UI
      document.getElementById("status").textContent = "Disconnected";
      document.getElementById("status").classList.remove("connected");
      document.getElementById("status").classList.add("disconnected");
    });

    // Listen for updates to the list of connected clients
    this.socket.on("clientsUpdate", (clients) => {
      this.connectedClients = clients;
      document.getElementById("clientCount").textContent = clients.length;
      this.notifyWindowsChanged();
    });

    // Listen for scene state updates
    this.socket.on("sceneState", (sceneState) => {
      this.notifySceneStateChanged(sceneState);
    });

    // Add window event listeners
    window.addEventListener("beforeunload", () => {
      if (this.socket) {
        this.socket.disconnect();
      }
    });
  }

  // Check if the window position or size has changed
  checkForWindowChanges() {
    const newInfo = {
      position: {
        x: window.screenX || window.screenLeft,
        y: window.screenY || window.screenTop,
      },
      size: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
    };

    // Check if position or size has changed
    if (
      newInfo.position.x !== this.windowInfo.position.x ||
      newInfo.position.y !== this.windowInfo.position.y ||
      newInfo.size.width !== this.windowInfo.size.width ||
      newInfo.size.height !== this.windowInfo.size.height
    ) {
      // Update window info
      this.windowInfo = newInfo;
      this.updateWindowInfo();
      this.notifyWindowShapeChanged();

      // Update UI
      document.getElementById(
        "windowPosition"
      ).textContent = `X:${newInfo.position.x}, Y:${newInfo.position.y}`;
      document.getElementById(
        "windowSize"
      ).textContent = `${newInfo.size.width}x${newInfo.size.height}`;
    }
  }

  // Send window info to the server
  updateWindowInfo() {
    if (this.socket && this.socket.connected) {
      this.socket.emit("windowUpdate", this.windowInfo);
    }
  }

  // Send updated scene state to the server
  updateSceneState(sceneState) {
    if (this.socket && this.socket.connected) {
      this.socket.emit("updateSceneState", sceneState);
    }
  }

  // Register callback for window changes (connections/disconnections)
  onWindowsChanged(callback) {
    this.windowChangeCallbacks.push(callback);
    return this;
  }

  // Register callback for window shape changes (position/size)
  onWindowShapeChanged(callback) {
    this.windowShapeChangeCallbacks.push(callback);
    return this;
  }

  // Register callback for connection status changes
  onConnectionStatusChanged(callback) {
    this.connectionStatusChangeCallbacks.push(callback);
    return this;
  }

  // Register callback for scene state changes
  onSceneStateChanged(callback) {
    this.sceneStateChangeCallbacks.push(callback);
    return this;
  }

  // Notify all registered callbacks of window changes
  notifyWindowsChanged() {
    this.windowChangeCallbacks.forEach((callback) =>
      callback(this.connectedClients)
    );
  }

  // Notify all registered callbacks of window shape changes
  notifyWindowShapeChanged() {
    this.windowShapeChangeCallbacks.forEach((callback) =>
      callback(this.windowInfo)
    );
  }

  // Notify all registered callbacks of connection status changes
  updateConnectionStatus(isConnected) {
    this.connectionStatusChangeCallbacks.forEach((callback) =>
      callback(isConnected)
    );
  }

  // Notify all registered callbacks of scene state changes
  notifySceneStateChanged(sceneState) {
    this.sceneStateChangeCallbacks.forEach((callback) => callback(sceneState));
  }

  // Get all connected clients
  getConnectedClients() {
    return this.connectedClients;
  }

  // Get current window ID
  getWindowId() {
    return this.windowId;
  }

  // Get current window info
  getWindowInfo() {
    return this.windowInfo;
  }
}
