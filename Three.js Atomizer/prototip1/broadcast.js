class WindowTracker {
    constructor() {
        this.windowId = crypto.randomUUID(); // Benzersiz pencere ID'si
        this.channel = new BroadcastChannel('atom-sync');
        this.connectedWindows = new Set();
        
        this.setupEventListeners();
        this.announcePresence();
    }

    setupEventListeners() {
        // Yeni pencere bağlantıları için dinleyici
        this.channel.onmessage = (event) => {
            const { type, senderId, data } = event.data;
            
            switch (type) {
                case 'WINDOW_CONNECTED':
                    this.handleWindowConnected(senderId);
                    break;
                case 'WINDOW_DISCONNECTED':
                    this.handleWindowDisconnected(senderId);
                    break;
                case 'ACKNOWLEDGE_CONNECTION':
                    this.connectedWindows.add(senderId);
                    console.log(`${senderId} penceresi ile bağlantı kuruldu`);
                    break;
                case 'ATOM_UPDATE':
                    this.handleAtomUpdate(data);
                    break;
            }
        };

        // Pencere kapandığında diğer pencerelere haber ver
        window.addEventListener('beforeunload', () => {
            this.channel.postMessage({
                type: 'WINDOW_DISCONNECTED',
                senderId: this.windowId
            });
        });
    }

    announcePresence() {
        // Yeni pencere açıldığında diğer pencerelere haber ver
        this.channel.postMessage({
            type: 'WINDOW_CONNECTED',
            senderId: this.windowId
        });
    }

    handleWindowConnected(senderId) {
        if (senderId !== this.windowId) {
            // Yeni pencereye bağlantı onayı gönder
            this.channel.postMessage({
                type: 'ACKNOWLEDGE_CONNECTION',
                senderId: this.windowId
            });
            
            // Mevcut atom durumunu paylaş
            if (window.atomInstance) {
                this.shareAtomState();
            }
        }
    }

    handleWindowDisconnected(senderId) {
        this.connectedWindows.delete(senderId);
        console.log(`${senderId} penceresi bağlantıyı kapattı`);
    }

    shareAtomState() {
        const atom = window.atomInstance;
        if (!atom) return;

        this.channel.postMessage({
            type: 'ATOM_UPDATE',
            senderId: this.windowId,
            data: {
                electronCount: atom.params.electronCount,
                particleCount: atom.params.particleCount,
                nucleusRotationSpeed: atom.params.nucleusRotationSpeed,
                electronSpeed: atom.params.electronSpeed,
                electronOrbitRadius: atom.params.electronOrbitRadius
            }
        });
    }

    handleAtomUpdate(data) {
        const atom = window.atomInstance;
        if (!atom) return;

        // Atom parametrelerini güncelle
        Object.assign(atom.params, data);

        // GUI'yi güncelle
        for (let i = 0; i < atom.__gui.__controllers.length; i++) {
            atom.__gui.__controllers[i].updateDisplay();
        }

        // Atomu yeniden oluştur
        atom.electrons.forEach(electron => atom.scene.remove(electron));
        atom.electronPaths.forEach(path => atom.scene.remove(path));
        atom.electrons = [];
        atom.electronPaths = [];
        atom.electronParticleSystems = [];
        atom.createElectronOrbits();
    }
} 