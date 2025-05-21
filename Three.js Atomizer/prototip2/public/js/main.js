// Global variables
let windowManager;
let cosmicScene;
let container;
let isFirstWindow = false;

// Initialize the application
function init() {
  console.log("Ana uygulama başlatılıyor...");

  try {
    // Set up the container for the scene
    container = document.getElementById("scene-container");
    if (!container) {
      console.error("scene-container elementi bulunamadı!");
      return;
    }
    console.log("Container bulundu:", container);

    // THREE ve dependencies kontrolü
    if (typeof THREE === "undefined") {
      console.error("THREE kütüphanesi yüklenemedi!");
      alert("Three.js kütüphanesi bulunamadı. Lütfen sayfayı yenileyin.");
      return;
    }

    // Socket.io kontrolü
    if (typeof io === "undefined") {
      console.error("Socket.io kütüphanesi yüklenemedi!");
      alert("Socket.io kütüphanesi bulunamadı. Lütfen sayfayı yenileyin.");
      return;
    }

    // Create the window manager
    console.log("WindowManager oluşturuluyor...");
    windowManager = new WindowManager();

    // Create and initialize the 3D scene
    console.log("CosmicScene oluşturuluyor...");
    cosmicScene = new CosmicScene(container);

    // Hook up the settings changed callback
    cosmicScene.onSettingsChanged = (settings) => {
      // Send updated settings to server
      console.log("Ayarlar değiştirildi, sunucuya gönderiliyor:", settings);
      windowManager.updateSceneState(settings);
    };

    // Connect to the server
    console.log("Sunucuya bağlanılıyor...");
    windowManager.connect();

    // Register callbacks for window manager events
    windowManager
      .onWindowsChanged((windows) => {
        console.log("Pencere listesi güncellendi:", windows);
        // Update window visualizations
        cosmicScene.updateWindowVisualizations(
          windows,
          windowManager.getWindowId()
        );

        // Check if this is the first window (for control panel)
        checkIfFirstWindow(windows);
      })
      .onSceneStateChanged((sceneState) => {
        console.log("Sahne durumu güncellendi:", sceneState);
        // Update scene settings from server
        cosmicScene.updateSettings(sceneState);
      });

    // Handle keyboard shortcuts
    document.addEventListener("keydown", handleKeyboardShortcuts);

    console.log("Uygulama başlatıldı");
  } catch (error) {
    console.error("Uygulama başlatılırken hata:", error);
  }
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
