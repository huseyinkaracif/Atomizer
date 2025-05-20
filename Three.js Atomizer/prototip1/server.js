class WindowMonitor {
    constructor() {
        this.totalConnections = 0;
        this.windowList = new Map();
        this.channel = new BroadcastChannel('window-monitor');
        this.setupEventListeners();
        this.updateUI();

        // Atom parametreleri
        this.atomParams = {
            electronCount: 12,
            particleCount: 200,
            nucleusRotationSpeed: 0.005,
            electronSpeed: 0.02,
            electronOrbitRadius: 200,
            nucleusParticleCount: 24,
        };

        this.setupGUI();
    }

    setupGUI() {
        const gui = new dat.GUI({ autoPlace: false });
        const container = document.querySelector('.control-panel');
        container.appendChild(gui.domElement);

        // Elektron Sayısı
        gui.add(this.atomParams, 'electronCount', 1, 20, 1)
            .name('Elektron Sayısı')
            .onChange(() => {
                this.broadcastAtomParams();
            });

        // Nükleotit Sayısı
        gui.add(this.atomParams, 'particleCount', 50, 500, 10)
            .name('Nükleotit Sayısı')
            .onChange(() => {
                this.broadcastAtomParams();
            });

        // Çekirdek Dönüş Hızı
        gui.add(this.atomParams, 'nucleusRotationSpeed', 0, 0.02, 0.001)
            .name('Çekirdek Dönüş Hızı')
            .onChange(() => {
                this.broadcastAtomParams();
            });

        // Elektron Hızı
        gui.add(this.atomParams, 'electronSpeed', 0, 0.05, 0.001)
            .name('Elektron Hızı')
            .onChange(() => {
                this.broadcastAtomParams();
            });

        // Yörünge Yarıçapı
        gui.add(this.atomParams, 'electronOrbitRadius', 100, 400, 10)
            .name('Yörünge Yarıçapı')
            .onChange(() => {
                this.broadcastAtomParams();
            });
    }

    broadcastAtomParams() {
        // Tüm parametreleri bir kerede gönder
        this.channel.postMessage({
            type: 'ATOM_PARAMS_UPDATE',
            data: { ...this.atomParams } // Parametrelerin kopyasını gönder
        });
    }

    setupEventListeners() {
        this.channel.onmessage = (event) => {
            const { type, windowId, data } = event.data;
            
            switch (type) {
                case 'WINDOW_UPDATE':
                    this.handleWindowUpdate(windowId, data);
                    break;
                case 'WINDOW_CLOSED':
                    this.handleWindowClosed(windowId);
                    break;
                case 'REQUEST_ATOM_PARAMS':
                    this.channel.postMessage({
                        type: 'ATOM_PARAMS_UPDATE',
                        data: this.atomParams
                    });
                    break;
            }
        };
    }

    handleWindowUpdate(windowId, data) {
        if (!this.windowList.has(windowId)) {
            this.totalConnections++;
        }
        
        this.windowList.set(windowId, {
            ...data,
            lastSeen: Date.now()
        });
        
        this.updateUI();
    }

    handleWindowClosed(windowId) {
        if (this.windowList.has(windowId)) {
            this.windowList.delete(windowId);
            this.updateUI();
        }
    }

    formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('tr-TR', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }

    updateUI() {
        const windowListElement = document.getElementById('browserList');
        const activeWindowsElement = document.getElementById('activeBrowsers');
        const totalConnectionsElement = document.getElementById('totalConnections');

        windowListElement.innerHTML = '';
        
        this.windowList.forEach((info, windowId) => {
            const windowItem = document.createElement('div');
            windowItem.className = 'browser-item';
            
            windowItem.innerHTML = `
                <div class="browser-info">
                    <div class="status-indicator" style="background-color: #4CAF50"></div>
                    <div>
                        <strong>${info.title}</strong>
                        <div class="browser-details">
                            Pencere Kimliği: ${info.id.substring(0, 8)}...<br>
                            Konum: X:${info.x}, Y:${info.y}<br>
                            Boyut: ${info.width}x${info.height}
                        </div>
                    </div>
                </div>
                <div class="timestamp">
                    Son güncelleme: ${this.formatTimestamp(info.lastSeen)}
                </div>
            `;
            
            windowListElement.appendChild(windowItem);
        });

        activeWindowsElement.textContent = this.windowList.size;
        totalConnectionsElement.textContent = this.totalConnections;
    }
}

// Monitörü başlat
window.windowMonitor = new WindowMonitor(); 