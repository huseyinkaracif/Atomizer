class CosmicScene {
  constructor(container) {
    // Scene settings - will be updated from server
    this.settings = {
      particles: {
        count: 1000,
        size: 2.0,
        speed: 0.3,
        color: "#1a88ff",
      },
      camera: {
        rotation: 0.002,
        zoom: 1.0,
      },
      background: {
        color: "#000000",
      },
    };

    // Setup Three.js components
    this.container = container;
    this.scene = new THREE.Scene();
    this.clock = new THREE.Clock();
    this.setupCamera();
    this.setupRenderer();
    this.setupLights();

    // Create particle system
    this.particleSystem = null;
    this.createParticleSystem();

    // Create control panel if this is the main window
    this.gui = null;
    this.isControlWindow = false;

    // Window visualization objects
    this.windowObjects = new THREE.Group();
    this.scene.add(this.windowObjects);

    // Animation loop
    this.animate = this.animate.bind(this);
    this.animate();
  }

  setupCamera() {
    // Create a perspective camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      2000
    );
    this.camera.position.z = 700;

    // Add orbit controls for interactive movement
    this.controls = new THREE.OrbitControls(this.camera, this.container);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.rotateSpeed = 0.5;
  }

  setupRenderer() {
    // Create WebGL renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.container.appendChild(this.renderer.domElement);

    // Add window resize listener
    window.addEventListener("resize", () => this.onWindowResize());
  }

  setupLights() {
    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, 1);
    this.scene.add(directionalLight);

    // Add point light at camera
    this.pointLight = new THREE.PointLight(0x3366ff, 2, 1000);
    this.pointLight.position.copy(this.camera.position);
    this.scene.add(this.pointLight);
  }

  createParticleSystem() {
    // Remove existing particle system if it exists
    if (this.particleSystem) {
      this.scene.remove(this.particleSystem);
    }

    const particles = this.settings.particles.count;

    // Create geometry with random positions
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particles * 3);
    const velocities = new Float32Array(particles * 3);
    const colors = new Float32Array(particles * 3);
    const sizes = new Float32Array(particles);

    // Convert hex color to RGB
    const color = new THREE.Color(this.settings.particles.color);

    // Initialize particles with random positions and velocities
    for (let i = 0; i < particles; i++) {
      const i3 = i * 3;

      // Position (sphere distribution)
      const radius = Math.random() * 700;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = radius * Math.cos(phi);

      // Velocity (random direction)
      velocities[i3] = (Math.random() - 0.5) * 0.2;
      velocities[i3 + 1] = (Math.random() - 0.5) * 0.2;
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.2;

      // Color (base color with variation)
      colors[i3] = color.r + (Math.random() * 0.2 - 0.1);
      colors[i3 + 1] = color.g + (Math.random() * 0.2 - 0.1);
      colors[i3 + 2] = color.b + (Math.random() * 0.2 - 0.1);

      // Size (random)
      sizes[i] = Math.random() * this.settings.particles.size + 0.5;
    }

    // Add attributes to geometry
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("velocity", new THREE.BufferAttribute(velocities, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

    // Create shader material for particles
    const particleMaterial = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: `
        attribute float size;
        attribute vec3 velocity;
        attribute vec3 color;
        varying vec3 vColor;
        
        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        
        void main() {
          vec2 xy = gl_PointCoord.xy - vec2(0.5);
          float ll = length(xy);
          if (ll > 0.5) discard;
          
          // Glow effect
          float intensity = 1.0 - 2.0 * ll;
          gl_FragColor = vec4(vColor, intensity);
        }
      `,
    });

    // Create the particle system
    this.particleSystem = new THREE.Points(geometry, particleMaterial);
    this.particleSystem.userData = { velocities };
    this.scene.add(this.particleSystem);
  }

  setupControlPanel() {
    if (this.gui) {
      this.gui.destroy();
    }

    this.isControlWindow = true;
    this.gui = new dat.GUI();

    // Particles folder
    const particlesFolder = this.gui.addFolder("Particles");

    particlesFolder
      .add(this.settings.particles, "count", 100, 5000, 100)
      .name("Count")
      .onChange(() => {
        this.createParticleSystem();
        this.broadcastSettings();
      });

    particlesFolder
      .add(this.settings.particles, "size", 0.5, 5, 0.1)
      .name("Size")
      .onChange(() => {
        this.createParticleSystem();
        this.broadcastSettings();
      });

    particlesFolder
      .add(this.settings.particles, "speed", 0.1, 1, 0.05)
      .name("Speed")
      .onChange(() => this.broadcastSettings());

    particlesFolder
      .addColor(this.settings.particles, "color")
      .name("Color")
      .onChange(() => {
        this.createParticleSystem();
        this.broadcastSettings();
      });

    particlesFolder.open();

    // Camera folder
    const cameraFolder = this.gui.addFolder("Camera");

    cameraFolder
      .add(this.settings.camera, "rotation", 0, 0.01, 0.001)
      .name("Auto Rotation")
      .onChange(() => this.broadcastSettings());

    cameraFolder
      .add(this.settings.camera, "zoom", 0.5, 2, 0.1)
      .name("Zoom")
      .onChange(() => {
        this.camera.position.z = 700 / this.settings.camera.zoom;
        this.broadcastSettings();
      });

    // Background folder
    const bgFolder = this.gui.addFolder("Background");

    bgFolder
      .addColor(this.settings.background, "color")
      .name("Color")
      .onChange(() => {
        this.scene.background = new THREE.Color(this.settings.background.color);
        this.broadcastSettings();
      });
  }

  broadcastSettings() {
    // This will be overridden by main.js to send updates to the server
    if (this.onSettingsChanged) {
      this.onSettingsChanged(this.settings);
    }
  }

  updateSettings(newSettings) {
    // Update settings from server
    const needsParticleRecreation =
      newSettings.particles.count !== this.settings.particles.count ||
      newSettings.particles.size !== this.settings.particles.size ||
      newSettings.particles.color !== this.settings.particles.color;

    // Update all settings
    this.settings = { ...this.settings, ...newSettings };

    // Apply settings that don't need particle recreation
    this.scene.background = new THREE.Color(this.settings.background.color);
    this.camera.position.z = 700 / this.settings.camera.zoom;

    // Recreate particles if needed
    if (needsParticleRecreation) {
      this.createParticleSystem();
    }

    // Update GUI if it exists
    if (this.gui) {
      for (const controller of this.gui.__controllers) {
        controller.updateDisplay();
      }
    }
  }

  updateWindowVisualizations(windows, currentWindowId) {
    // Clear previous window objects
    while (this.windowObjects.children.length > 0) {
      this.windowObjects.remove(this.windowObjects.children[0]);
    }

    // Create visual representations for each window
    windows.forEach((windowData, index) => {
      // Skip current window
      if (windowData.id === currentWindowId) return;

      // Create box representing window
      const geometry = new THREE.BoxGeometry(
        windowData.size.width / 10,
        windowData.size.height / 10,
        20
      );

      // Different material for each window
      const hue = (index * 0.1) % 1;
      const material = new THREE.MeshPhongMaterial({
        color: new THREE.Color().setHSL(hue, 1, 0.5),
        transparent: true,
        opacity: 0.7,
        wireframe: true,
      });

      const windowBox = new THREE.Mesh(geometry, material);

      // Position the box based on window position
      windowBox.position.x = (windowData.position.x - window.screenX) / 10;
      windowBox.position.y = -(windowData.position.y - window.screenY) / 10;

      this.windowObjects.add(windowBox);
    });
  }

  onWindowResize() {
    // Update camera aspect ratio
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();

    // Update renderer size
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  animate() {
    requestAnimationFrame(this.animate);

    const delta = this.clock.getDelta();

    // Auto-rotate scene
    if (this.settings.camera.rotation > 0) {
      this.scene.rotation.y += this.settings.camera.rotation;
    }

    // Update particles
    if (this.particleSystem) {
      const positions = this.particleSystem.geometry.attributes.position.array;
      const velocities = this.particleSystem.userData.velocities;
      const speed = this.settings.particles.speed;

      for (let i = 0; i < positions.length; i += 3) {
        // Update position based on velocity and speed
        positions[i] += velocities[i] * speed;
        positions[i + 1] += velocities[i + 1] * speed;
        positions[i + 2] += velocities[i + 2] * speed;

        // Boundaries check - wrap around if particles go too far
        const distance = Math.sqrt(
          positions[i] * positions[i] +
            positions[i + 1] * positions[i + 1] +
            positions[i + 2] * positions[i + 2]
        );

        if (distance > 1000) {
          // Reset to a random position near the center
          const radius = Math.random() * 400;
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.acos(2 * Math.random() - 1);

          positions[i] = radius * Math.sin(phi) * Math.cos(theta);
          positions[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
          positions[i + 2] = radius * Math.cos(phi);
        }
      }

      this.particleSystem.geometry.attributes.position.needsUpdate = true;
    }

    // Update point light position to camera position
    if (this.pointLight) {
      this.pointLight.position.copy(this.camera.position);
    }

    // Update camera controls
    if (this.controls) {
      this.controls.update();
    }

    // Render the scene
    this.renderer.render(this.scene, this.camera);
  }
}
