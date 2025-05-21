// Global variables
let windowManager;
let cosmicScene;
let container;
let isFirstWindow = false;

// Initialize the application
function init() {
  // Create the window manager
  windowManager = new WindowManager();

  // Set up the container for the scene
  container = document.getElementById("scene-container");

  // Create and initialize the 3D scene
  cosmicScene = new CosmicScene(container);

  // Hook up the settings changed callback
  cosmicScene.onSettingsChanged = (settings) => {
    // Send updated settings to server
    windowManager.updateSceneState(settings);
  };

  // Connect to the server
  windowManager.connect();

  // Register callbacks for window manager events
  windowManager
    .onWindowsChanged((windows) => {
      // Update window visualizations
      cosmicScene.updateWindowVisualizations(
        windows,
        windowManager.getWindowId()
      );

      // Check if this is the first window (for control panel)
      checkIfFirstWindow(windows);
    })
    .onSceneStateChanged((sceneState) => {
      // Update scene settings from server
      cosmicScene.updateSettings(sceneState);
    });

  // Handle keyboard shortcuts
  document.addEventListener("keydown", handleKeyboardShortcuts);
}

// Check if this is the first connected window to show controls
function checkIfFirstWindow(windows) {
  // If we already determined this is the first window, don't change it
  if (isFirstWindow) {
    return;
  }

  // Sort windows by connection time (if available) or just use the list order
  const sortedWindows = [...windows].sort((a, b) => {
    if (a.connected && b.connected) {
      return a.connected - b.connected;
    }
    return 0;
  });

  // Get the first window in the sorted list
  const firstWindow = sortedWindows[0];

  // Check if current window is the first one
  if (firstWindow && firstWindow.id === windowManager.getWindowId()) {
    isFirstWindow = true;

    // Set up control panel for the first window
    cosmicScene.setupControlPanel();

    console.log("This is the control window - GUI enabled");
  }
}

// Handle keyboard shortcuts
function handleKeyboardShortcuts(event) {
  // Open a new window with the same URL
  if (event.key === "n" && event.ctrlKey) {
    event.preventDefault();
    openNewWindow();
  }

  // Toggle control panel visibility with 'h' key
  if (event.key === "h" && isFirstWindow) {
    event.preventDefault();
    toggleControlPanel();
  }
}

// Open a new window with the same URL
function openNewWindow() {
  const width = 800;
  const height = 600;
  const left = window.screenX + Math.round(Math.random() * 500) - 250;
  const top = window.screenY + Math.round(Math.random() * 500) - 250;

  window.open(
    window.location.href,
    "_blank",
    `width=${width},height=${height},left=${left},top=${top}`
  );
}

// Toggle control panel visibility
function toggleControlPanel() {
  const guiElement = document.querySelector(".dg.ac");
  if (guiElement) {
    guiElement.style.display =
      guiElement.style.display === "none" ? "block" : "none";
  }
}

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", init);

// Add keyboard shortcut instructions as tooltip
window.addEventListener("load", () => {
  const infoPanel = document.querySelector(".info-panel");
  const tip = document.createElement("div");
  tip.className = "tip";
  tip.style.marginTop = "10px";
  tip.style.fontSize = "12px";
  tip.style.opacity = "0.7";
  tip.innerHTML = "Shortcuts:<br>Ctrl+N: New Window<br>H: Toggle Controls";
  infoPanel.appendChild(tip);
});
