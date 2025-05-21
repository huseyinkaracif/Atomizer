class WindowManager {
  constructor(options = {}) {
    this.socket = null;
    this.connectedClients = [];
    this.windowId = null;
    this.clientType = options.clientType || "client";
    this.windowInfo = {
      position: { x: 0, y: 0 },
      size: { width: 0, height: 0 },
    };
    this.windowChangeCallbacks = [];
    this.windowShapeChangeCallbacks = [];
    this.connectionStatusChangeCallbacks = [];
    this.sceneStateChangeCallbacks = [];
    this.isConnectionAttemptInProgress = false;
    this.connectionAttempts = 0;
    this.maxConnectionAttempts = 5;

    // Update window position and size at regular intervals
    setInterval(() => this.checkForWindowChanges(), 100);
  }

  // Connect to the Socket.io server
  connect() {
    try {
      if (this.isConnectionAttemptInProgress) {
        console.log("Bağlantı denemesi zaten devam ediyor...");
        return;
      }

      this.isConnectionAttemptInProgress = true;
      this.connectionAttempts++;

      console.log(
        `Socket.io bağlantısı başlatılıyor... (Deneme ${this.connectionAttempts}/${this.maxConnectionAttempts})`
      );

      // Update UI to show connecting status
      const statusElement = document.getElementById("status");
      if (statusElement) {
        statusElement.textContent = "Connecting...";
        statusElement.className = ""; // Reset classes
      }

      // Create Socket.io connection to the server with explicit URL
      const serverUrl =
        window.location.protocol +
        "//" +
        window.location.hostname +
        ":" +
        (window.location.port || 80);
      console.log("Socket.io bağlantı URL'si:", serverUrl);

      this.socket = io(serverUrl, {
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000,
        transports: ["websocket", "polling"],
        query: { clientType: this.clientType },
      });

      // Debug connection status changes
      this.socket.on("connect_error", (error) => {
        console.error("Socket.io bağlantı hatası:", error.message);
        this.isConnectionAttemptInProgress = false;

        if (statusElement) {
          statusElement.textContent = "Connection Error";
          statusElement.classList.remove("connected");
          statusElement.classList.add("disconnected");
        }

        this.updateConnectionStatus(false);

        // Retry connection if attempts are still available
        if (this.connectionAttempts < this.maxConnectionAttempts) {
          console.log(
            `Bağlantı tekrar deneniyor... (${this.connectionAttempts}/${this.maxConnectionAttempts})`
          );
          setTimeout(() => this.connect(), 2000);
        } else {
          console.error("Maksimum bağlantı denemesi sayısına ulaşıldı!");
          if (statusElement) {
            statusElement.textContent = "Connection Failed";
          }
        }
      });

      // Set up event listeners
      this.socket.on("connect", () => {
        console.log("Connected to server with ID:", this.socket.id);
        this.windowId = this.socket.id;
        this.updateWindowInfo();
        this.isConnectionAttemptInProgress = false;
        this.connectionAttempts = 0; // Reset attempts counter on successful connection
        this.updateConnectionStatus(true);

        // Update UI elements
        if (statusElement) {
          statusElement.textContent = "Connected";
          statusElement.classList.add("connected");
          statusElement.classList.remove("disconnected");
        }

        const windowIdElement = document.getElementById("windowId");
        if (windowIdElement) {
          windowIdElement.textContent = this.windowId.substring(0, 8) + "...";
        }
      });

      this.socket.on("disconnect", () => {
        console.log("Disconnected from server");
        this.isConnectionAttemptInProgress = false;
        this.updateConnectionStatus(false);

        // Update UI
        if (statusElement) {
          statusElement.textContent = "Disconnected";
          statusElement.classList.remove("connected");
          statusElement.classList.add("disconnected");
        }
      });

      // Listen for updates to the list of connected clients
      this.socket.on("clientsUpdate", (clients) => {
        console.log("Client listesi güncellendi:", clients);
        this.connectedClients = clients;

        const clientCountElement = document.getElementById("clientCount");
        if (clientCountElement) {
          clientCountElement.textContent = clients.length;
        }

        this.notifyWindowsChanged();
      });

      // Listen for scene state updates
      this.socket.on("sceneState", (sceneState) => {
        console.log("Sahne durumu güncellendi:", sceneState);
        this.notifySceneStateChanged(sceneState);
      });

      // Add window event listeners
      window.addEventListener("beforeunload", () => {
        if (this.socket) {
          this.socket.disconnect();
        }
      });

      console.log("Socket.io event listeners kuruldu");
    } catch (error) {
      this.isConnectionAttemptInProgress = false;
      console.error("Socket.io bağlantısı kurulurken hata:", error);

      // Retry after a delay
      if (this.connectionAttempts < this.maxConnectionAttempts) {
        setTimeout(() => this.connect(), 2000);
      }
    }
  }

  // Check if the window position or size has changed
  checkForWindowChanges() {
    try {
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
        const positionElement = document.getElementById("windowPosition");
        if (positionElement) {
          positionElement.textContent = `X:${newInfo.position.x}, Y:${newInfo.position.y}`;
        }

        const sizeElement = document.getElementById("windowSize");
        if (sizeElement) {
          sizeElement.textContent = `${newInfo.size.width}x${newInfo.size.height}`;
        }
      }
    } catch (error) {
      console.error("Pencere değişikliklerini kontrol ederken hata:", error);
    }
  }

  // Send window info to the server
  updateWindowInfo() {
    if (this.socket && this.socket.connected) {
      console.log("Pencere bilgisi sunucuya gönderiliyor:", this.windowInfo);
      this.socket.emit("windowUpdate", this.windowInfo);
    }
  }

  // Send updated scene state to the server
  updateSceneState(sceneState) {
    if (this.socket && this.socket.connected) {
      console.log("Sahne durumu sunucuya gönderiliyor:", sceneState);
      this.socket.emit("updateSceneState", sceneState);
    } else {
      console.warn("Sahne durumu güncellenemedi: Socket bağlantısı yok");

      // Attempt to reconnect
      if (
        !this.isConnectionAttemptInProgress &&
        this.connectionAttempts < this.maxConnectionAttempts
      ) {
        console.log("Bağlantı yok, yeniden bağlanmayı deniyorum...");
        this.connect();
      }
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
    try {
      this.windowChangeCallbacks.forEach((callback) =>
        callback(this.connectedClients)
      );
    } catch (error) {
      console.error("notifyWindowsChanged sırasında hata:", error);
    }
  }

  // Notify all registered callbacks of window shape changes
  notifyWindowShapeChanged() {
    try {
      this.windowShapeChangeCallbacks.forEach((callback) =>
        callback(this.windowInfo)
      );
    } catch (error) {
      console.error("notifyWindowShapeChanged sırasında hata:", error);
    }
  }

  // Notify all registered callbacks of connection status changes
  updateConnectionStatus(isConnected) {
    try {
      this.connectionStatusChangeCallbacks.forEach((callback) =>
        callback(isConnected)
      );
    } catch (error) {
      console.error("updateConnectionStatus sırasında hata:", error);
    }
  }

  // Notify all registered callbacks of scene state changes
  notifySceneStateChanged(sceneState) {
    try {
      this.sceneStateChangeCallbacks.forEach((callback) =>
        callback(sceneState)
      );
    } catch (error) {
      console.error("notifySceneStateChanged sırasında hata:", error);
    }
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

  // Check if connected
  isConnected() {
    return this.socket && this.socket.connected;
  }
}
