class WindowManager {
  #windows;
  #count;
  #id;
  #winData;
  #winShapeChangeCallback;
  #winChangeCallback;
  #socket;
  #lastUpdateTime;
  #updateThrottle;
  #positionQueue;
  #isUpdating;

  constructor() {
    let that = this;

    // Initialize Socket.IO connection
    this.#socket = io();
    this.#lastUpdateTime = 0;
    this.#updateThrottle = 8; // 120fps updates for smoother animation
    this.#positionQueue = [];
    this.#isUpdating = false;

    // Socket connection events
    this.#socket.on("connect", () => {
      console.log("Connected to server:", that.#socket.id);
    });

    this.#socket.on("disconnect", () => {
      console.log("Disconnected from server");
    });

    // Listen for real-time updates from other windows
    this.#socket.on("windows-update", (windows) => {
      that.#windows = windows.filter((w) => w.socketId !== that.#socket.id);
      if (that.#winChangeCallback) that.#winChangeCallback();
    });

    this.#socket.on("window-added", (windowData) => {
      if (windowData.socketId !== that.#socket.id) {
        that.#handleWindowAdded(windowData);
      }
    });

    this.#socket.on("window-shape-changed", (data) => {
      if (data.socketId !== that.#socket.id) {
        that.#handleWindowUpdate(data);
      }
    });

    this.#socket.on("window-removed", (data) => {
      if (data.socketId !== that.#socket.id) {
        that.#handleWindowRemoved(data);
      }
    });

    this.#socket.on("realtime-position-update", (data) => {
      if (data.socketId !== that.#socket.id) {
        that.#handleRealtimePosition(data);
      }
    });

    // Fallback to localStorage for compatibility
    addEventListener("storage", (event) => {
      if (event.key == "windows") {
        let newWindows = JSON.parse(event.newValue);
        let winChange = that.#didWindowsChange(that.#windows, newWindows);

        that.#windows = newWindows;

        if (winChange) {
          if (that.#winChangeCallback) that.#winChangeCallback();
        }
      }
    });

    // event listener for when current window is about to be closed
    window.addEventListener("beforeunload", function (e) {
      // No need to handle removal here, server handles disconnect automatically
    });

    // Process position queue with requestAnimationFrame for smooth updates
    this.#processPositionQueue();
  }

  #processPositionQueue() {
    if (this.#positionQueue.length > 0 && !this.#isUpdating) {
      this.#isUpdating = true;

      // Process all queued positions at once
      const updates = [...this.#positionQueue];
      this.#positionQueue = [];

      // Batch send updates
      if (updates.length > 0) {
        const latestUpdate = updates[updates.length - 1]; // Use only the latest update
        this.#socket.emit("realtime-position", latestUpdate);
      }

      setTimeout(() => {
        this.#isUpdating = false;
      }, this.#updateThrottle);
    }

    requestAnimationFrame(() => this.#processPositionQueue());
  }

  #handleWindowUpdate(data) {
    const { id, shape } = data;
    const index = this.getWindowIndexFromId(id);

    if (index >= 0 && this.#windows[index]) {
      this.#windows[index].shape = shape;
      this.#windows[index].realtimePosition = shape;
      if (this.#winChangeCallback) this.#winChangeCallback();
    }
  }

  #handleWindowAdded(windowData) {
    const existingIndex = this.getWindowIndexFromId(windowData.id);

    if (existingIndex === -1) {
      this.#windows.push(windowData);
      if (this.#winChangeCallback) this.#winChangeCallback();
    }
  }

  #handleWindowRemoved(data) {
    const { id } = data;
    const index = this.getWindowIndexFromId(id);

    if (index >= 0) {
      this.#windows.splice(index, 1);
      if (this.#winChangeCallback) this.#winChangeCallback();
    }
  }

  #handleRealtimePosition(data) {
    const { id, position } = data;
    const index = this.getWindowIndexFromId(id);

    if (index >= 0 && this.#windows[index]) {
      this.#windows[index].realtimePosition = position;
      if (this.#winShapeChangeCallback) this.#winShapeChangeCallback();
    }
  }

  // check if theres any changes to the window list
  #didWindowsChange(pWins, nWins) {
    if (pWins.length != nWins.length) {
      return true;
    } else {
      let c = false;

      for (let i = 0; i < pWins.length; i++) {
        if (pWins[i].id != nWins[i].id) c = true;
      }

      return c;
    }
  }

  // initiate current window (add metadata for custom data to store with each window instance)
  init(metaData) {
    this.#windows = JSON.parse(localStorage.getItem("windows")) || [];
    this.#count = localStorage.getItem("count") || 0;
    this.#count++;

    this.#id = this.#count;
    let shape = this.getWinShape();
    this.#winData = {
      id: this.#id,
      shape: shape,
      metaData: metaData,
      realtimePosition: { x: shape.x, y: shape.y, w: shape.w, h: shape.h },
    };

    localStorage.setItem("count", this.#count);
    this.updateWindowsLocalStorage();

    // Register with Socket.IO server
    this.#socket.emit("register-window", {
      shape: shape,
      metaData: metaData,
    });
  }

  getWinShape() {
    let shape = {
      x: window.screenLeft,
      y: window.screenTop,
      w: window.innerWidth,
      h: window.innerHeight,
    };
    return shape;
  }

  getWindowIndexFromId(id) {
    let index = -1;

    for (let i = 0; i < this.#windows.length; i++) {
      if (this.#windows[i].id == id) index = i;
    }

    return index;
  }

  updateWindowsLocalStorage() {
    localStorage.setItem("windows", JSON.stringify(this.#windows));
  }

  // Send real-time position updates (optimized with queue)
  sendRealtimePosition() {
    const now = Date.now();
    if (now - this.#lastUpdateTime > this.#updateThrottle) {
      const shape = this.getWinShape();
      const position = { x: shape.x, y: shape.y, w: shape.w, h: shape.h };

      // Add to queue instead of sending immediately
      this.#positionQueue.push({
        position: position,
      });

      this.#lastUpdateTime = now;
    }
  }

  update() {
    let winShape = this.getWinShape();

    if (
      winShape.x != this.#winData.shape.x ||
      winShape.y != this.#winData.shape.y ||
      winShape.w != this.#winData.shape.w ||
      winShape.h != this.#winData.shape.h
    ) {
      this.#winData.shape = winShape;
      this.#winData.realtimePosition = {
        x: winShape.x,
        y: winShape.y,
        w: winShape.w,
        h: winShape.h,
      };

      // Send update to server with throttling
      this.#socket.emit("window-update", {
        shape: winShape,
      });

      if (this.#winShapeChangeCallback) this.#winShapeChangeCallback();
      this.updateWindowsLocalStorage();
    }

    // Send frequent position updates for smooth animation
    this.sendRealtimePosition();
  }

  setWinShapeChangeCallback(callback) {
    this.#winShapeChangeCallback = callback;
  }

  setWinChangeCallback(callback) {
    this.#winChangeCallback = callback;
  }

  getWindows() {
    return this.#windows;
  }

  getThisWindowData() {
    return this.#winData;
  }

  getThisWindowID() {
    return this.#id;
  }

  // Cleanup method
  destroy() {
    if (this.#socket) {
      this.#socket.disconnect();
    }
  }
}

export default WindowManager;
