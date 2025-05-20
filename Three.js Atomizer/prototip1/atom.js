class Atom {
  constructor() {
    // Kontrol parametreleri
    this.params = {
      electronCount: 12,
      particleCount: 200,
      nucleusRotationSpeed: 0.005,
      electronSpeed: 0.02,
      electronOrbitRadius: 200,
      nucleusParticleCount: 24,
    };

    this.setup();
    this.createScene();
    this.animate();
  }

  setup() {
    this.scene = new THREE.Scene();

    // Kamera ayarları
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.z = 400;

    // Renderer ayarları
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(this.renderer.domElement);

    // Kontroller
    this.controls = new THREE.OrbitControls(
      this.camera,
      this.renderer.domElement
    );
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;

    // Işıklandırma
    this.setupLights();
  }

  setupLights() {
    // Ambient ışık
    const ambientLight = new THREE.AmbientLight(0x404040);
    this.scene.add(ambientLight);

    // Nokta ışığı (çekirdekten yayılan)
    this.nucleusLight = new THREE.PointLight(0xff7777, 2, 500);
    this.nucleusLight.castShadow = true;
    this.scene.add(this.nucleusLight);

    // Yönlü ışık
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(200, 200, 200);
    directionalLight.castShadow = true;
    this.scene.add(directionalLight);
  }

  createScene() {
    // Çekirdek oluşturma - daha detaylı
    this.createNucleus();

    // Elektron yörüngeleri ve elektronlar
    this.electrons = [];
    this.electronPaths = [];
    this.electronParticleSystems = [];
    this.createElectronOrbits();
  }

  createNucleus() {
    this.nucleusGroup = new THREE.Group();

    // Merkez çekirdek - daha detaylı
    const nucleusGeometry = new THREE.SphereGeometry(30, 64, 64);
    const nucleusMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xff3333,
      emissive: 0x661111,
      metalness: 0.5,
      roughness: 0.2,
      clearcoat: 0.8,
      clearcoatRoughness: 0.2,
      normalMap: this.createNucleusTexture(),
      emissiveIntensity: 0.5,
    });

    const nucleus = new THREE.Mesh(nucleusGeometry, nucleusMaterial);
    nucleus.castShadow = true;

    // Alt parçacıkları artır (protonlar ve nötronlar)
    for (let i = 0; i < 24; i++) {
      const subParticleSize = 6 + Math.random() * 4;
      const subParticle = new THREE.Mesh(
        new THREE.SphereGeometry(subParticleSize, 32, 32),
        new THREE.MeshPhysicalMaterial({
          color: i % 2 === 0 ? 0xff6666 : 0xcc4444,
          emissive: i % 2 === 0 ? 0x662222 : 0x441111,
          metalness: 0.7,
          roughness: 0.3,
          clearcoat: 1.0,
          emissiveIntensity: 0.3,
        })
      );

      // Daha karmaşık pozisyonlama
      const phi = Math.acos(-1 + (2 * i) / 24);
      const theta = Math.sqrt(24 * Math.PI) * phi;
      const radius = 20 + Math.random() * 10;

      subParticle.position.set(
        radius * Math.cos(theta) * Math.sin(phi),
        radius * Math.sin(theta) * Math.sin(phi),
        radius * Math.cos(phi)
      );

      // Her parçacığa kendi dönüş hızı
      subParticle.userData = {
        rotationSpeed: {
          x: (Math.random() - 0.5) * 0.02,
          y: (Math.random() - 0.5) * 0.02,
          z: (Math.random() - 0.5) * 0.02,
        },
      };

      this.nucleusGroup.add(subParticle);
    }

    // Çekirdek etrafında enerji alanı
    const energyFieldGeometry = new THREE.SphereGeometry(40, 32, 32);
    const energyFieldMaterial = new THREE.MeshPhongMaterial({
      color: 0xff8888,
      transparent: true,
      opacity: 0.2,
      side: THREE.DoubleSide,
    });
    const energyField = new THREE.Mesh(
      energyFieldGeometry,
      energyFieldMaterial
    );
    this.nucleusGroup.add(energyField);

    this.nucleusGroup.add(nucleus);
    this.scene.add(this.nucleusGroup);
  }

  createElectronOrbits() {
    const orbitRadius = this.params.electronOrbitRadius;
    const electronCount = this.params.electronCount;

    for (let i = 0; i < electronCount; i++) {
      // Yörünge oluşturma - daha detaylı
      const orbitGeometry = new THREE.TorusGeometry(
        orbitRadius + (Math.random() - 0.5) * 50, // Farklı yarıçaplar
        0.5,
        16,
        100
      );
      const orbitMaterial = new THREE.MeshBasicMaterial({
        color: 0x444444,
        transparent: true,
        opacity: 0.2,
      });
      const orbit = new THREE.Mesh(orbitGeometry, orbitMaterial);

      orbit.rotation.x = Math.random() * Math.PI;
      orbit.rotation.y = Math.random() * Math.PI;
      orbit.rotation.z = Math.random() * Math.PI;

      this.scene.add(orbit);
      this.electronPaths.push(orbit);

      // Elektron grubu
      const electronGroup = new THREE.Group();

      // Ana elektron - daha detaylı
      const electronGeometry = new THREE.SphereGeometry(4, 32, 32);
      const electronMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x00ffff,
        emissive: 0x006666,
        metalness: 0.5,
        roughness: 0.2,
        clearcoat: 1.0,
        emissiveIntensity: 0.5,
      });
      const electron = new THREE.Mesh(electronGeometry, electronMaterial);

      // Elektron çekirdeği
      const electronCore = new THREE.Mesh(
        new THREE.SphereGeometry(2, 16, 16),
        new THREE.MeshPhysicalMaterial({
          color: 0x0088ff,
          emissive: 0x004488,
          metalness: 0.8,
          roughness: 0.2,
        })
      );

      electronGroup.add(electron);
      electronGroup.add(electronCore);

      // Gelişmiş parçacık sistemi
      const particleSystem = this.createEnhancedParticleSystem();
      electronGroup.add(particleSystem);
      this.electronParticleSystems.push(particleSystem);

      electronGroup.userData = {
        angle: (i * Math.PI * 2) / electronCount,
        speed: this.params.electronSpeed,
        orbit: orbit,
        radius: orbitRadius + (Math.random() - 0.5) * 50,
        rotationSpeed: Math.random() * 0.02 + 0.01,
        verticalOffset: Math.random() * 20 - 10,
      };

      this.scene.add(electronGroup);
      this.electrons.push(electronGroup);
    }
  }

  createEnhancedParticleSystem() {
    const particleCount = this.params.particleCount;
    const particles = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 15;
      positions[i3 + 1] = (Math.random() - 0.5) * 15;
      positions[i3 + 2] = (Math.random() - 0.5) * 15;

      colors[i3] = Math.random() * 0.2;
      colors[i3 + 1] = 0.5 + Math.random() * 0.5;
      colors[i3 + 2] = 1;

      sizes[i] = Math.random() * 2;
    }

    particles.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    particles.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    particles.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

    const particleMaterial = new THREE.PointsMaterial({
      size: 1,
      transparent: true,
      opacity: 0.6,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });

    return new THREE.Points(particles, particleMaterial);
  }

  createNucleusTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");

    // Doku oluştur
    for (let i = 0; i < 1000; i++) {
      ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.3})`;
      ctx.beginPath();
      ctx.arc(
        Math.random() * canvas.width,
        Math.random() * canvas.height,
        Math.random() * 2,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  updateElectrons() {
    // Çekirdek alt parçacıklarını güncelle
    this.nucleusGroup.children.forEach((child) => {
      if (child.userData.rotationSpeed) {
        child.rotation.x += child.userData.rotationSpeed.x;
        child.rotation.y += child.userData.rotationSpeed.y;
        child.rotation.z += child.userData.rotationSpeed.z;
      }
    });

    this.electrons.forEach((electronGroup, index) => {
      const userData = electronGroup.userData;
      userData.angle += userData.speed;

      const x = Math.cos(userData.angle) * userData.radius;
      const y = userData.verticalOffset + Math.sin(userData.angle * 0.5) * 20;
      const z = Math.sin(userData.angle) * userData.radius;

      const orbit = userData.orbit;
      const position = new THREE.Vector3(x, y, z);
      position.applyQuaternion(orbit.quaternion);

      electronGroup.position.copy(position);

      electronGroup.rotation.x += userData.rotationSpeed;
      electronGroup.rotation.y += userData.rotationSpeed;
      electronGroup.rotation.z += userData.rotationSpeed * 0.5;

      // Parçacık sistemini güncelle
      const particleSystem = this.electronParticleSystems[index];
      const positions = particleSystem.geometry.attributes.position.array;
      const sizes = particleSystem.geometry.attributes.size.array;

      for (let i = 0; i < positions.length; i += 3) {
        positions[i] += (Math.random() - 0.5) * 0.4;
        positions[i + 1] += (Math.random() - 0.5) * 0.4;
        positions[i + 2] += (Math.random() - 0.5) * 0.4;

        const distance = Math.sqrt(
          positions[i] ** 2 + positions[i + 1] ** 2 + positions[i + 2] ** 2
        );

        if (distance > 7) {
          positions[i] *= 0.95;
          positions[i + 1] *= 0.95;
          positions[i + 2] *= 0.95;
        }

        sizes[i / 3] = Math.random() * 2;
      }

      particleSystem.geometry.attributes.position.needsUpdate = true;
      particleSystem.geometry.attributes.size.needsUpdate = true;
    });
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    // Çekirdeği döndür
    this.nucleusGroup.rotation.x += this.params.nucleusRotationSpeed;
    this.nucleusGroup.rotation.y += this.params.nucleusRotationSpeed;

    // Elektronları güncelle
    this.updateElectrons();

    // Kontrolleri güncelle
    this.controls.update();

    // Render
    this.renderer.render(this.scene, this.camera);
  }
}

// Pencere boyutu değiştiğinde güncelle
window.addEventListener("resize", () => {
  const atom = window.atomInstance;
  atom.camera.aspect = window.innerWidth / window.innerHeight;
  atom.camera.updateProjectionMatrix();
  atom.renderer.setSize(window.innerWidth, window.innerHeight);
});

// Simülasyonu başlat
window.onload = () => {
  window.atomInstance = new Atom();
  window.windowTracker = new WindowTracker();
};

document.addEventListener("DOMContentLoaded", () => {
  // Varolan kodlar...
  new WindowTracker();
});
