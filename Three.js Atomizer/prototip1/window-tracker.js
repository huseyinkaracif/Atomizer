class WindowTracker {
  constructor() {
    if (window.windowTracker) {
      return window.windowTracker;
    }
    
    this.windowId = crypto.randomUUID();
    this.windowNumber = 0;
    this.channel = new BroadcastChannel('window-monitor');
    this.setupEventListeners();
    this.getWindowNumber();
    this.updateWindowTitle();
    this.sendWindowInfo();
    this.updateLocalInfo();
    
    window.windowTracker = this;
    
    this.requestAtomParams();
  }

  getWindowNumber() {
    this.channel.postMessage({
      type: 'GET_WINDOW_NUMBERS',
      windowId: this.windowId
    });

    const handleResponse = (event) => {
      if (event.data.type === 'WINDOW_NUMBER_RESPONSE') {
        const usedNumbers = new Set(event.data.numbers);
        let number = 1;
        while (usedNumbers.has(number)) {
          number++;
        }
        this.windowNumber = number;
        this.updateWindowTitle();
      }
    };

    this.channel.addEventListener('message', handleResponse, { once: true });
    
    setTimeout(() => {
      if (!this.windowNumber) {
        this.windowNumber = 1;
        this.updateWindowTitle();
      }
    }, 500);
  }

  updateWindowTitle() {
    document.title = `Atom-${this.windowNumber}`;
  }

  setupEventListeners() {
    window.addEventListener('resize', () => {
      this.sendWindowInfo();
      this.updateLocalInfo();
    });

    this.trackWindowPosition();

    window.addEventListener('beforeunload', () => {
      this.channel.postMessage({
        type: 'WINDOW_CLOSED',
        windowId: this.windowId
      });
    });

    this.channel.onmessage = (event) => {
      const { type, data } = event.data;

      if (type === 'GET_WINDOW_NUMBERS' && event.data.windowId !== this.windowId) {
        this.channel.postMessage({
          type: 'WINDOW_NUMBER_RESPONSE',
          numbers: [this.windowNumber]
        });
      } else if (type === 'ATOM_PARAMS_UPDATE') {
        this.updateAtomParams(data);
      }
    };

    setInterval(() => {
      this.sendWindowInfo();
      this.updateLocalInfo();
    }, 2000);
  }

  trackWindowPosition() {
    let lastX = window.screenX;
    let lastY = window.screenY;
    
    const checkPosition = () => {
      const currentX = window.screenX;
      const currentY = window.screenY;
      
      if (lastX !== currentX || lastY !== currentY) {
        lastX = currentX;
        lastY = currentY;
        this.sendWindowInfo();
        this.updateLocalInfo();
      }
      
      requestAnimationFrame(checkPosition);
    };
    
    requestAnimationFrame(checkPosition);
  }

  updateLocalInfo() {
    const windowIdElement = document.getElementById('windowId');
    const windowPositionElement = document.getElementById('windowPosition');
    const windowSizeElement = document.getElementById('windowSize');
    const windowTitleElement = document.getElementById('windowTitle');

    if (windowIdElement) {
      windowIdElement.textContent = this.windowId.substring(0, 8) + '...';
    }
    if (windowPositionElement) {
      windowPositionElement.textContent = `X:${window.screenX}, Y:${window.screenY}`;
    }
    if (windowSizeElement) {
      windowSizeElement.textContent = `${window.innerWidth}x${window.innerHeight}`;
    }
    if (windowTitleElement) {
      windowTitleElement.textContent = document.title;
    }
  }

  sendWindowInfo() {
    const windowInfo = {
      id: this.windowId,
      number: this.windowNumber,
      title: document.title,
      url: window.location.href,
      width: window.innerWidth,
      height: window.innerHeight,
      x: window.screenX,
      y: window.screenY,
      timestamp: Date.now()
    };

    this.channel.postMessage({
      type: 'WINDOW_UPDATE',
      windowId: this.windowId,
      data: windowInfo
    });
  }

  requestAtomParams() {
    this.channel.postMessage({
      type: 'REQUEST_ATOM_PARAMS'
    });
  }

  updateAtomParams(params) {
    if (window.atomInstance) {
      const prevParams = { ...window.atomInstance.params };
      
      Object.assign(window.atomInstance.params, params);

      if (prevParams.electronCount !== params.electronCount) {
        const atom = window.atomInstance;
        while (atom.electrons.length > 0) {
          const electron = atom.electrons.pop();
          atom.scene.remove(electron);
        }
        while (atom.electronPaths.length > 0) {
          const path = atom.electronPaths.pop();
          atom.scene.remove(path);
        }
        atom.electronParticleSystems = [];
        atom.createElectronOrbits();
      }

      if (prevParams.particleCount !== params.particleCount) {
        const atom = window.atomInstance;
        atom.electrons.forEach((electronGroup, index) => {
          if (atom.electronParticleSystems[index]) {
            electronGroup.remove(atom.electronParticleSystems[index]);
          }
          const newParticleSystem = atom.createEnhancedParticleSystem();
          electronGroup.add(newParticleSystem);
          atom.electronParticleSystems[index] = newParticleSystem;
        });
      }

      if (prevParams.electronOrbitRadius !== params.electronOrbitRadius) {
        const atom = window.atomInstance;
        while (atom.electrons.length > 0) {
          const electron = atom.electrons.pop();
          atom.scene.remove(electron);
        }
        while (atom.electronPaths.length > 0) {
          const path = atom.electronPaths.pop();
          atom.scene.remove(path);
        }
        atom.electronParticleSystems = [];
        atom.createElectronOrbits();
      }

      if (prevParams.electronSpeed !== params.electronSpeed) {
        window.atomInstance.electrons.forEach(electronGroup => {
          electronGroup.userData.speed = params.electronSpeed;
        });
      }
    }
  }
}

if (!window.windowTracker) {
  new WindowTracker();
}
