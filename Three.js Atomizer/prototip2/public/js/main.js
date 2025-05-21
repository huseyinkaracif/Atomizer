// Global variables
let windowManager;
let cosmicScene;
let container;
let isControlPanel = false;

// Initialize the application
function init() {
  console.log("Ana uygulama başlatılıyor...");

  try {
    // Check if this is the control panel page
    isControlPanel = window.location.pathname.includes("control-panel");
    console.log("Is control panel:", isControlPanel);

    // Set up the container for the scene
    container = document.getElementById("scene-container");
    if (!container && !isControlPanel) {
      console.error("scene-container elementi bulunamadı!");
      return;
    }
    console.log("Container bulundu:", container);

    // THREE ve dependencies kontrolü
    if (typeof THREE === "undefined" && !isControlPanel) {
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

    // Create scene only in main view, not in control panel
    if (!isControlPanel) {
      // Create and initialize the 3D scene
      console.log("CosmicScene oluşturuluyor...");
      cosmicScene = new CosmicScene(container);

      // Don't create control panel in main view
      cosmicScene.setupControlPanel = function () {
        console.log("Control panel disabled in main view");
      };

      // Critical: Connect the WindowManager to the CosmicScene for settings updates
      cosmicScene.onSettingsChanged = function (settings) {
        console.log(
          "Settings changed in CosmicScene, sending to server:",
          settings
        );
        windowManager.updateSceneState(settings);
      };
    }

    // Connect to the server
    console.log("Sunucuya bağlanılıyor...");
    windowManager.connect();

    // Register callbacks for window manager events
    windowManager
      .onWindowsChanged((windows) => {
        console.log("Pencere listesi güncellendi:", windows);

        if (!isControlPanel && cosmicScene) {
          // Update window visualizations in main view
          cosmicScene.updateWindowVisualizations(
            windows,
            windowManager.getWindowId()
          );
        }
      })
      .onSceneStateChanged((sceneState) => {
        console.log("Sahne durumu güncellendi:", sceneState);

        if (!isControlPanel && cosmicScene) {
          // Update scene settings from server in main view
          cosmicScene.updateSettings(sceneState);
        }
      });

    // Handle keyboard shortcuts
    document.addEventListener("keydown", handleKeyboardShortcuts);

    console.log("Uygulama başlatıldı");
  } catch (error) {
    console.error("Uygulama başlatılırken hata:", error);
  }
}

// Handle keyboard shortcuts
function handleKeyboardShortcuts(event) {
  // Open a new window with the main application (not control panel)
  if (event.key === "n" && event.ctrlKey) {
    event.preventDefault();
    openNewWindow();
  }
}

// Open a new window with the main application
function openNewWindow() {
  const width = 800;
  const height = 600;
  const left = window.screenX + Math.round(Math.random() * 500) - 250;
  const top = window.screenY + Math.round(Math.random() * 500) - 250;

  // Always open the main application, not the control panel
  const url = window.location.origin + "/";

  window.open(
    url,
    "_blank",
    `width=${width},height=${height},left=${left},top=${top}`
  );
}

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", init);

// Add keyboard shortcut instructions as tooltip (only in main view)
window.addEventListener("load", () => {
  if (!isControlPanel) {
    const infoPanel = document.querySelector(".info-panel");
    if (infoPanel) {
      const tip = document.createElement("div");
      tip.className = "tip";
      tip.style.marginTop = "10px";
      tip.style.fontSize = "12px";
      tip.style.opacity = "0.7";
      tip.innerHTML = "Shortcuts:<br>Ctrl+N: New Window";
      infoPanel.appendChild(tip);
    }
  }
});
