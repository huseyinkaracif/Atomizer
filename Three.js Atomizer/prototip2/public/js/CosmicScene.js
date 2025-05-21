class CosmicScene {
  constructor(container) {
    console.log("CosmicScene oluşturuluyor...");
    // Scene settings - will be updated from server
    this.settings = {
      atom: {
        electronCount: 8,
        electronSize: 2.0,
        electronSpeed: 0.3,
        electronColor: "#1a88ff",
        nucleusSize: 15,
        protonCount: 8,
        neutronCount: 8,
        protonColor: "#ff3333",
        neutronColor: "#eeeeee",
        orbitRadius: 100,
        orbitWidth: 0.5,
      },
      camera: {
        rotation: 0.002,
        zoom: 1.0,
      },
      background: {
        color: "#000000",
      },
      animation: {
        electronGlow: true,
        orbitTrails: true,
        particleEffects: true,
        animationSpeed: 1.0,
      },
    };

    // Setup Three.js components
    this.container = container;
    console.log("Container:", container);

    try {
      if (!window.THREE) {
        console.error("THREE kütüphanesi bulunamadı!");
        alert("Three.js kütüphanesi yüklenemedi. Lütfen sayfayı yenileyin.");
        return;
      }

      // THREE.js nesnelerini oluştur
      this.scene = new THREE.Scene();
      console.log("Scene oluşturuldu");

      // Set the initial background color
      this.scene.background = new THREE.Color(this.settings.background.color);
      this.clock = new THREE.Clock();

      // Setup in the correct order
      this.setupRenderer();
      this.setupCamera();
      this.setupLights();

      // Create atom model
      this.atomModel = new THREE.Group();
      this.scene.add(this.atomModel);
      this.createAtomModel();

      // Create control panel if this is the main window
      this.gui = null;
      this.isControlWindow = false;

      // Window visualization objects
      this.windowObjects = new THREE.Group();
      this.scene.add(this.windowObjects);

      // Animation loop
      this.animate = this.animate.bind(this);
      this.isAnimating = false;
      this.startAnimation();

      console.log("CosmicScene başarıyla oluşturuldu");
    } catch (error) {
      console.error("CosmicScene oluşturulurken hata:", error);
      alert(
        "Atom modeli yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin: " +
          error.message
      );
    }
  }

  setupCamera() {
    try {
      // Create a perspective camera
      this.camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        2000
      );
      this.camera.position.z = 300;
      console.log("Kamera oluşturuldu");

      // Add orbit controls for interactive movement
      if (typeof THREE.OrbitControls !== "undefined") {
        this.controls = new THREE.OrbitControls(
          this.camera,
          this.renderer.domElement
        );
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.rotateSpeed = 0.5;
        console.log("OrbitControls oluşturuldu");
      } else {
        console.warn(
          "THREE.OrbitControls bulunamadı - interaktif kontroller devre dışı!"
        );
      }
    } catch (error) {
      console.error("Kamera oluşturulurken hata:", error);
    }
  }

  setupRenderer() {
    try {
      // Create WebGL renderer
      this.renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
      });
      this.renderer.setPixelRatio(window.devicePixelRatio);
      this.renderer.setSize(window.innerWidth, window.innerHeight);

      // Add to container
      if (this.container) {
        while (this.container.firstChild) {
          this.container.removeChild(this.container.firstChild);
        }
        this.container.appendChild(this.renderer.domElement);
        console.log("Renderer oluşturuldu ve DOM'a eklendi");
      } else {
        console.error("Container bulunamadı, renderer DOM'a eklenemedi!");
      }

      // Add window resize listener
      window.addEventListener("resize", () => this.onWindowResize());
    } catch (error) {
      console.error("Renderer oluşturulurken hata:", error);
    }
  }

  setupLights() {
    try {
      // Add ambient light
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
      this.scene.add(ambientLight);

      // Add directional light
      const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
      directionalLight.position.set(1, 1, 1);
      this.scene.add(directionalLight);

      // Add point light at camera
      this.pointLight = new THREE.PointLight(0x3366ff, 1.5, 1000);
      this.pointLight.position.copy(this.camera.position);
      this.scene.add(this.pointLight);
      console.log("Işıklar oluşturuldu");
    } catch (error) {
      console.error("Işıklar oluşturulurken hata:", error);
    }
  }

  startAnimation() {
    if (!this.isAnimating) {
      console.log("Animasyon başlatılıyor");
      this.isAnimating = true;
      this.animate();
    }
  }

  stopAnimation() {
    this.isAnimating = false;
  }

  createAtomModel() {
    try {
      // Clear previous atom model
      while (this.atomModel.children.length > 0) {
        this.atomModel.remove(this.atomModel.children[0]);
      }

      // Create nucleus
      this.createNucleus();

      // Create electron orbits and electrons
      this.createElectronOrbitals();

      // Create orbit visualization
      this.createOrbitVisualizations();

      console.log("Atom modeli oluşturuldu");
    } catch (error) {
      console.error("Atom modeli oluşturulurken hata:", error);
    }
  }

  createNucleus() {
    try {
      const nucleusGroup = new THREE.Group();
      const {
        protonCount,
        neutronCount,
        nucleusSize,
        protonColor,
        neutronColor,
      } = this.settings.atom;

      // Helper function to create a nucleon (proton or neutron)
      const createNucleon = (position, isProton) => {
        const radius = nucleusSize * 0.3;
        const segments = 32;
        const geometry = new THREE.SphereGeometry(radius, segments, segments);
        const material = new THREE.MeshPhongMaterial({
          color: isProton ? protonColor : neutronColor,
          specular: 0x444444,
          shininess: 60,
        });

        const nucleon = new THREE.Mesh(geometry, material);
        nucleon.position.copy(position);
        return nucleon;
      };

      // Create a spiral arrangement for protons and neutrons
      const totalNucleons = protonCount + neutronCount;
      const spiralFactor = 1.8; // Controls how tightly particles are packed

      for (let i = 0; i < totalNucleons; i++) {
        const isProton = i < protonCount;
        const angle = i * 2.4; // Angular spacing
        const radius = Math.sqrt(i) * spiralFactor;
        const height = (i % 2) * 1.8 - 0.9; // Alternate height to create layers

        const position = new THREE.Vector3(
          Math.cos(angle) * radius,
          height,
          Math.sin(angle) * radius
        );

        const nucleon = createNucleon(position, isProton);

        // Random rotation for visual interest
        nucleon.rotation.set(
          Math.random() * Math.PI,
          Math.random() * Math.PI,
          Math.random() * Math.PI
        );

        nucleusGroup.add(nucleon);
      }

      // Add subtle animation to the nucleus
      nucleusGroup.userData = {
        rotationAxis: new THREE.Vector3(
          Math.random() - 0.5,
          Math.random() - 0.5,
          Math.random() - 0.5
        ).normalize(),
        rotationSpeed: 0.005 + Math.random() * 0.01,
      };

      this.atomModel.add(nucleusGroup);
      this.nucleus = nucleusGroup;
    } catch (error) {
      console.error("Çekirdek oluşturulurken hata:", error);
    }
  }

  createElectronOrbitals() {
    try {
      const electrons = new THREE.Group();
      const { electronCount, electronSize, electronColor, orbitRadius } =
        this.settings.atom;

      // Create electron geometry
      const geometry = new THREE.SphereGeometry(electronSize, 16, 16);
      const material = new THREE.MeshPhongMaterial({
        color: electronColor,
        emissive: electronColor,
        emissiveIntensity: 0.5,
        specular: 0xffffff,
        shininess: 100,
      });

      // Add glow effect to electrons
      const glowMaterial = new THREE.ShaderMaterial({
        uniforms: {
          glowColor: { value: new THREE.Color(electronColor) },
          viewVector: { value: new THREE.Vector3() },
        },
        vertexShader: `
          uniform vec3 viewVector;
          varying float intensity;
          void main() {
            vec3 vNormal = normalize(normalMatrix * normal);
            vec3 vNormel = normalize(normalMatrix * viewVector);
            intensity = pow(0.9 - dot(vNormal, vNormel), 4.0);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 glowColor;
          varying float intensity;
          void main() {
            vec3 glow = glowColor * intensity;
            gl_FragColor = vec4(glow, 1.0);
          }
        `,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        transparent: true,
      });

      // Distribution factors for electron shells
      const shellRadii = [orbitRadius * 0.6, orbitRadius, orbitRadius * 1.5];
      const shellCapacity = [2, 8, 8]; // Electrons per shell based on quantum mechanics

      // Distribute electrons across shells
      let remainingElectrons = electronCount;
      let shellIndex = 0;

      while (remainingElectrons > 0 && shellIndex < shellRadii.length) {
        const shellRadius = shellRadii[shellIndex];
        const electronsInShell = Math.min(
          remainingElectrons,
          shellCapacity[shellIndex]
        );

        // Create orbital group for this shell
        const orbital = new THREE.Group();
        orbital.userData = {
          radius: shellRadius,
          electronsInShell: electronsInShell,
          rotationAxis: new THREE.Vector3(
            Math.random() - 0.5,
            Math.random() - 0.5,
            Math.random() - 0.5
          ).normalize(),
          rotationSpeed: 0.2 + Math.random() * 0.3,
        };

        // Add electrons to this shell
        for (let i = 0; i < electronsInShell; i++) {
          const angle = (i / electronsInShell) * Math.PI * 2;

          // Calculate electron positions on elliptical orbit
          const ellipticalFactor = 0.8 + Math.random() * 0.4; // Random elongation for each shell
          const x = shellRadius * Math.cos(angle);
          const z = shellRadius * ellipticalFactor * Math.sin(angle);

          // Create the electron
          const electron = new THREE.Mesh(geometry, material);
          electron.position.set(x, 0, z);

          // Add glow effect
          const glowSize = electronSize * 2;
          const glowGeometry = new THREE.SphereGeometry(glowSize, 16, 16);
          const glow = new THREE.Mesh(glowGeometry, glowMaterial);
          electron.add(glow);

          // Store original position for animation
          electron.userData = {
            originalPosition: new THREE.Vector3(x, 0, z),
            orbitAngle: angle,
            orbitSpeed: 0.01 + Math.random() * 0.02,
            pulseSpeed: 0.05 + Math.random() * 0.05,
            pulseAmplitude: 0.15,
          };

          orbital.add(electron);
        }

        electrons.add(orbital);
        remainingElectrons -= electronsInShell;
        shellIndex++;
      }

      this.atomModel.add(electrons);
      this.electrons = electrons;
    } catch (error) {
      console.error("Elektronlar oluşturulurken hata:", error);
    }
  }

  createOrbitVisualizations() {
    try {
      // Create orbit path visualizations
      const orbitGroup = new THREE.Group();
      const { orbitWidth } = this.settings.atom;

      if (
        !this.electrons ||
        !this.electrons.children ||
        this.electrons.children.length === 0
      ) {
        console.warn("Elektronlar oluşturulmadan yörüngeler oluşturulamaz");
        return;
      }

      // Create orbit paths for each electron shell
      this.electrons.children.forEach((orbital, index) => {
        const radius = orbital.userData.radius;

        // Use RingGeometry instead of custom geometry for better compatibility
        const orbitGeometry = new THREE.RingGeometry(
          radius - orbitWidth,
          radius + orbitWidth,
          64
        );

        const orbitMaterial = new THREE.MeshBasicMaterial({
          color: 0x2255ff,
          transparent: true,
          opacity: 0.15,
          side: THREE.DoubleSide,
        });

        const orbitMesh = new THREE.Mesh(orbitGeometry, orbitMaterial);

        // Set random rotation for the orbit plane
        orbitMesh.rotation.x = orbital.userData.rotationAxis.x * Math.PI;
        orbitMesh.rotation.y = orbital.userData.rotationAxis.y * Math.PI;
        orbitMesh.rotation.z = orbital.userData.rotationAxis.z * Math.PI;

        orbitGroup.add(orbitMesh);
      });

      this.atomModel.add(orbitGroup);
      this.orbitVisuals = orbitGroup;
    } catch (error) {
      console.error("Yörüngeler oluşturulurken hata:", error);
    }
  }

  setupControlPanel() {
    if (this.gui) {
      this.gui.destroy();
    }

    this.isControlWindow = true;
    this.gui = new dat.GUI();

    // Atom folder
    const atomFolder = this.gui.addFolder("Atom");

    atomFolder
      .add(this.settings.atom, "electronCount", 1, 18, 1)
      .name("Electron Count")
      .onChange(() => {
        this.createAtomModel();
        this.broadcastSettings();
      });

    atomFolder
      .add(this.settings.atom, "electronSize", 0.5, 5, 0.1)
      .name("Electron Size")
      .onChange(() => {
        this.createAtomModel();
        this.broadcastSettings();
      });

    atomFolder
      .add(this.settings.atom, "electronSpeed", 0.1, 1, 0.05)
      .name("Electron Speed")
      .onChange(() => this.broadcastSettings());

    atomFolder
      .addColor(this.settings.atom, "electronColor")
      .name("Electron Color")
      .onChange(() => {
        this.createAtomModel();
        this.broadcastSettings();
      });

    atomFolder
      .add(this.settings.atom, "nucleusSize", 5, 30, 1)
      .name("Nucleus Size")
      .onChange(() => {
        this.createAtomModel();
        this.broadcastSettings();
      });

    atomFolder
      .add(this.settings.atom, "protonCount", 1, 20, 1)
      .name("Proton Count")
      .onChange(() => {
        this.createAtomModel();
        this.broadcastSettings();
      });

    atomFolder
      .add(this.settings.atom, "neutronCount", 1, 20, 1)
      .name("Neutron Count")
      .onChange(() => {
        this.createAtomModel();
        this.broadcastSettings();
      });

    atomFolder
      .addColor(this.settings.atom, "protonColor")
      .name("Proton Color")
      .onChange(() => {
        this.createAtomModel();
        this.broadcastSettings();
      });

    atomFolder
      .addColor(this.settings.atom, "neutronColor")
      .name("Neutron Color")
      .onChange(() => {
        this.createAtomModel();
        this.broadcastSettings();
      });

    atomFolder
      .add(this.settings.atom, "orbitRadius", 50, 200, 5)
      .name("Orbit Radius")
      .onChange(() => {
        this.createAtomModel();
        this.broadcastSettings();
      });

    atomFolder.open();

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
        this.camera.position.z = 300 / this.settings.camera.zoom;
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
    console.log(
      "[CosmicScene] Received newSettings:",
      JSON.parse(JSON.stringify(newSettings))
    );
    console.log(
      "[CosmicScene] Current this.settings.atom before update:",
      JSON.parse(JSON.stringify(this.settings.atom))
    );

    // Store deep copies of relevant parts of the old settings for comparison
    const oldAtomSettings = JSON.parse(JSON.stringify(this.settings.atom));
    const oldBackgroundSettings = JSON.parse(
      JSON.stringify(this.settings.background)
    );
    const oldCameraSettings = JSON.parse(JSON.stringify(this.settings.camera));

    // Assign the new complete state from server to this.settings
    // newSettings is expected to be the full, authoritative state.
    // Make sure it's a deep copy to avoid reference issues
    this.settings = JSON.parse(JSON.stringify(newSettings));

    console.log(
      "[CosmicScene] this.settings.atom after assignment from newSettings:",
      JSON.parse(JSON.stringify(this.settings.atom))
    );

    // Determine if atom model needs to be recreated by comparing new atom settings with old atom settings
    const needsAtomRecreation =
      this.settings.atom.electronCount !== oldAtomSettings.electronCount ||
      this.settings.atom.electronSize !== oldAtomSettings.electronSize ||
      this.settings.atom.electronColor !== oldAtomSettings.electronColor ||
      this.settings.atom.nucleusSize !== oldAtomSettings.nucleusSize ||
      this.settings.atom.protonCount !== oldAtomSettings.protonCount ||
      this.settings.atom.neutronCount !== oldAtomSettings.neutronCount ||
      this.settings.atom.protonColor !== oldAtomSettings.protonColor ||
      this.settings.atom.neutronColor !== oldAtomSettings.neutronColor ||
      this.settings.atom.orbitRadius !== oldAtomSettings.orbitRadius ||
      this.settings.atom.orbitWidth !== oldAtomSettings.orbitWidth; // Added orbitWidth check

    console.log("[CosmicScene] needsAtomRecreation:", needsAtomRecreation);

    // Apply settings that don't require full atom recreation but might have changed
    if (this.settings.background.color !== oldBackgroundSettings.color) {
      console.log(
        `[CosmicScene] Updating background color to: ${this.settings.background.color}`
      );
      this.scene.background = new THREE.Color(this.settings.background.color);
    }
    if (this.settings.camera.zoom !== oldCameraSettings.zoom) {
      console.log(
        `[CosmicScene] Updating camera zoom. New zoom: ${this.settings.camera.zoom}`
      );
      this.camera.position.z = 300 / this.settings.camera.zoom;
    }
    // Note: camera.rotation is used directly in the animate loop from this.settings.camera.rotation
    // Note: atom.electronSpeed is used directly in the animate loop from this.settings.atom.electronSpeed

    if (needsAtomRecreation) {
      console.log(
        "[CosmicScene] Recreating atom model due to settings change."
      );
      this.createAtomModel();
    } else if (
      this.settings.atom.electronSpeed !== oldAtomSettings.electronSpeed
    ) {
      // If only the speed changed, update the electron speed without recreating
      console.log(
        `[CosmicScene] Updating electron speed to: ${this.settings.atom.electronSpeed}`
      );
      // The speed is used directly in the animate method, so no need to do anything else
    }

    // Update GUI if it exists (relevant if this scene instance had a GUI, usually for control panel)
    if (this.gui) {
      // This part is more relevant for a control panel instance if it were using CosmicScene directly
      console.log("[CosmicScene] Updating GUI display (if any).");
      for (const controller of this.gui.__controllers) {
        controller.updateDisplay();
      }
    }
    console.log("[CosmicScene] updateSettings completed.");
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
    try {
      // Update camera aspect ratio
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();

      // Update renderer size
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    } catch (error) {
      console.error("Pencere boyutu değiştirilirken hata:", error);
    }
  }

  animate() {
    if (!this.isAnimating) {
      return;
    }

    try {
      requestAnimationFrame(this.animate);

      const delta = this.clock.getDelta();
      const time = this.clock.getElapsedTime();

      // Use animation speed from settings
      const animSpeed = this.settings.animation
        ? this.settings.animation.animationSpeed || 1.0
        : 1.0;

      // Auto-rotate scene
      if (this.settings.camera.rotation > 0) {
        this.scene.rotation.y += this.settings.camera.rotation * animSpeed;
      }

      // Update nucleus
      if (this.nucleus) {
        const nucleusData = this.nucleus.userData;
        // Create subtle pulsing/vibration effect for the nucleus
        this.nucleus.rotation.x += nucleusData.rotationSpeed * 0.2 * animSpeed;
        this.nucleus.rotation.y += nucleusData.rotationSpeed * 0.3 * animSpeed;

        // Make nucleons vibrate slightly
        this.nucleus.children.forEach((nucleon, i) => {
          const pulseSpeed = 0.1 + ((i * 0.05) % 0.5);
          const pulseAmp = 0.05;
          nucleon.position.x +=
            Math.sin(time * pulseSpeed * animSpeed) * pulseAmp * delta;
          nucleon.position.y +=
            Math.cos(time * pulseSpeed * 1.3 * animSpeed) * pulseAmp * delta;
          nucleon.position.z +=
            Math.sin(time * pulseSpeed * 0.7 * animSpeed) * pulseAmp * delta;

          // Keep nucleons close to their original positions with a spring-like effect
          nucleon.position.multiplyScalar(0.998);

          // Add pulsing scale effect based on time
          const scalePulse =
            1 + Math.sin(time * pulseSpeed * 2 * animSpeed) * 0.05;
          nucleon.scale.set(scalePulse, scalePulse, scalePulse);
        });
      }

      // Update electrons
      if (this.electrons) {
        // Should we apply glow effect?
        const useGlow = this.settings.animation
          ? this.settings.animation.electronGlow
          : true;

        // Update each orbital shell
        this.electrons.children.forEach((orbital, shellIndex) => {
          // Rotate the entire orbital based on its rotation axis and speed
          // Use the current electron speed from settings for real-time control
          const axis = orbital.userData.rotationAxis;
          const rotationMatrix = new THREE.Matrix4().makeRotationAxis(
            axis,
            orbital.userData.rotationSpeed *
              delta *
              this.settings.atom.electronSpeed *
              animSpeed
          );
          orbital.applyMatrix4(rotationMatrix);

          // Update each electron in this orbital
          orbital.children.forEach((electron, i) => {
            const electronData = electron.userData;

            // Wobble effect for electrons
            const wobbleX =
              Math.sin(time * electronData.pulseSpeed * 2 * animSpeed) *
              electronData.pulseAmplitude;
            const wobbleY =
              Math.cos(time * electronData.pulseSpeed * 2.3 * animSpeed) *
              electronData.pulseAmplitude;
            const wobbleZ =
              Math.sin(time * electronData.pulseSpeed * 1.5 * animSpeed) *
              electronData.pulseAmplitude;

            electron.position.x += wobbleX * delta * 2;
            electron.position.y += wobbleY * delta * 2;
            electron.position.z += wobbleZ * delta * 2;

            // Update glow based on camera position and glow setting
            if (
              electron.children[0] &&
              electron.children[0].material.uniforms
            ) {
              electron.children[0].material.uniforms.viewVector.value =
                new THREE.Vector3().subVectors(
                  this.camera.position,
                  electron.position
                );

              // Make glow intensity oscillate for more dynamic effect
              if (useGlow) {
                const glowIntensity =
                  1 + Math.sin(time * 3 * animSpeed + i) * 0.3;
                electron.children[0].material.uniforms.glowColor.value.multiplyScalar(
                  glowIntensity
                );
                electron.children[0].visible = true;
              } else {
                electron.children[0].visible = false;
              }
            }

            // Scale electrons for visual effect
            const scale = 1 + Math.sin(time * 2 * animSpeed + i) * 0.1;
            electron.scale.set(scale, scale, scale);

            // Add particle effects if enabled
            if (
              this.settings.animation &&
              this.settings.animation.particleEffects
            ) {
              if (Math.random() > 0.99) {
                // Reduced probability to avoid performance issues
                this.createParticleEffect(
                  electron.position.clone(),
                  this.settings.atom.electronColor
                );
              }
            }
          });
        });
      }

      // Update orbit visualizations
      if (this.orbitVisuals) {
        // Should we show orbit trails?
        const showTrails = this.settings.animation
          ? this.settings.animation.orbitTrails
          : true;

        // Subtle animation for orbit planes
        this.orbitVisuals.children.forEach((orbit, i) => {
          orbit.visible = showTrails;
          if (showTrails) {
            const orbitPulse = 0.3 + Math.sin(time * 0.5 * animSpeed + i) * 0.1;
            orbit.rotation.x +=
              0.001 * Math.sin(time * 0.1 * animSpeed) * orbitPulse;
            orbit.rotation.y +=
              0.001 * Math.cos(time * 0.1 * animSpeed) * orbitPulse;

            // Make orbits' opacity pulse
            if (orbit.material) {
              orbit.material.opacity =
                0.15 + Math.sin(time * 0.7 * animSpeed + i * 0.2) * 0.05;
            }
          }
        });
      }

      // Update point light position to camera position
      if (this.pointLight) {
        this.pointLight.position.copy(this.camera.position);

        // Make the light intensity pulse
        this.pointLight.intensity =
          1.5 + Math.sin(time * 0.8 * animSpeed) * 0.3;
      }

      // Update camera controls
      if (this.controls) {
        this.controls.update();
      }

      // Render the scene
      if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera);
      } else {
        console.warn(
          "Renderer, scene veya camera tanımlı değil, render yapılamıyor"
        );
        this.stopAnimation();
      }
    } catch (error) {
      console.error("Animasyon sırasında hata:", error);
      this.stopAnimation();
    }
  }

  // Create a particle effect at a given position
  createParticleEffect(position, color) {
    // Create a small particle geometry
    const geometry = new THREE.SphereGeometry(0.5, 8, 8);
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color(color),
      transparent: true,
      opacity: 0.7,
    });

    const particle = new THREE.Mesh(geometry, material);
    particle.position.copy(position);

    // Add random velocity
    particle.userData = {
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 0.5,
        (Math.random() - 0.5) * 0.5,
        (Math.random() - 0.5) * 0.5
      ),
      age: 0,
      maxAge: 1 + Math.random() * 2, // 1-3 seconds
    };

    // Add to scene
    this.scene.add(particle);

    // Create timeout to remove the particle
    setTimeout(() => {
      if (this.scene && particle.parent === this.scene) {
        this.scene.remove(particle);
        geometry.dispose();
        material.dispose();
      }
    }, particle.userData.maxAge * 1000);
  }
}
