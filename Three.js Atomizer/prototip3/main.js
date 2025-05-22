import WindowManager from "./WindowManager.js";

// Three.js variables
let camera, scene, renderer, world;
let sceneOffsetTarget = { x: 0, y: 0 };
let sceneOffset = { x: 0, y: 0 };
let pixR = window.devicePixelRatio ? window.devicePixelRatio : 1;

let today = new Date();
today.setHours(0);
today.setMinutes(0);
today.setSeconds(0);
today.setMilliseconds(0);
today = today.getTime();

let internalTime = getTime();
let windowManager;
let initialized = false;

// get time in seconds since beginning of the day (so that all windows use the same time)
function getTime() {
  return (new Date().getTime() - today) / 1000.0;
}

if (new URLSearchParams(window.location.search).get("clear")) {
  localStorage.clear();
} else {
  // this code is essential to circumvent that some browsers preload the content of some pages before you actually hit the url
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState != "hidden" && !initialized) {
      init();
    }
  });

  window.onload = () => {
    if (document.visibilityState != "hidden") {
      init();
    }
  };

  function init() {
    initialized = true;

    // add a short timeout because window.offsetX reports wrong values before a short period
    setTimeout(() => {
      setupScene();
      setupWindowManager();
      resize();
      updateWindowShape(false);
      render();
      window.addEventListener("resize", resize);
    }, 500);
  }

  function setupScene() {
    camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 300;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    // Add a subtle fog effect
    scene.fog = new THREE.FogExp2(0x000000, 0.0015);

    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(pixR);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.shadowMap.enabled = true;

    world = new THREE.Object3D();
    scene.add(world);

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0x303030);
    scene.add(ambientLight);

    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, 1).normalize();
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Add point light at camera position
    const pointLight = new THREE.PointLight(0xffffff, 1, 1000);
    pointLight.position.set(0, 0, 150);
    camera.add(pointLight);
    scene.add(camera);

    renderer.domElement.setAttribute("id", "scene");
    document.body.appendChild(renderer.domElement);
  }

  function createAtom(position, size, color) {
    const atomGroup = new THREE.Group();

    // Create nucleus
    const nucleusGeometry = new THREE.SphereGeometry(size * 0.2, 32, 32);
    const nucleusMaterial = new THREE.MeshPhongMaterial({
      color: color,
      emissive: new THREE.Color(color).multiplyScalar(0.5),
      specular: 0xffffff,
      shininess: 100,
    });
    const nucleusMesh = new THREE.Mesh(nucleusGeometry, nucleusMaterial);
    nucleusMesh.castShadow = true;
    nucleusMesh.receiveShadow = true;
    atomGroup.add(nucleusMesh);

    // Add glow effect to nucleus
    const glowGeometry = new THREE.SphereGeometry(size * 0.25, 32, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.3,
      side: THREE.BackSide,
    });
    const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
    atomGroup.add(glowMesh);

    // Create electron orbits and electrons
    const orbitRadii = [size * 0.8, size * 1.2, size * 1.6];
    const electronData = [];

    for (let i = 0; i < 3; i++) {
      // Create orbit with more detail
      const orbitGeometry = new THREE.TorusGeometry(
        orbitRadii[i],
        size * 0.005,
        8,
        150
      );

      // Create a shimmering effect with custom colors
      const orbitColor = new THREE.Color(color).offsetHSL(i * 0.1, 0, 0);
      const orbitMaterial = new THREE.MeshBasicMaterial({
        color: orbitColor,
        transparent: true,
        opacity: 0.4,
      });

      const orbit = new THREE.Mesh(orbitGeometry, orbitMaterial);

      // Set random rotation for each orbit
      orbit.rotation.x = Math.random() * Math.PI;
      orbit.rotation.y = Math.random() * Math.PI;

      atomGroup.add(orbit);

      // Create multiple electrons per orbit
      const electronsPerOrbit = i + 1;

      for (let j = 0; j < electronsPerOrbit; j++) {
        // Create electron
        const electronGeometry = new THREE.SphereGeometry(size * 0.05, 16, 16);

        // Create glowing material
        const electronColor = new THREE.Color().setHSL(
          (i * 0.1 + j * 0.03) % 1,
          0.8,
          0.6
        );
        const electronMaterial = new THREE.MeshPhongMaterial({
          color: 0xffffff,
          emissive: electronColor,
          emissiveIntensity: 1.0,
          specular: 0xffffff,
          shininess: 100,
        });

        const electron = new THREE.Mesh(electronGeometry, electronMaterial);
        electron.castShadow = true;
        electron.receiveShadow = true;

        // Create electron trail (particles)
        const trailGroup = new THREE.Group();
        const trailSegments = 10;
        const trailMeshes = [];

        for (let k = 0; k < trailSegments; k++) {
          const trailSize = size * 0.04 * (1 - k / trailSegments);
          const trailGeometry = new THREE.SphereGeometry(trailSize, 8, 8);
          const trailMaterial = new THREE.MeshBasicMaterial({
            color: electronColor,
            transparent: true,
            opacity: 0.7 * (1 - k / trailSegments),
          });
          const trailMesh = new THREE.Mesh(trailGeometry, trailMaterial);
          trailGroup.add(trailMesh);
          trailMeshes.push(trailMesh);
        }

        atomGroup.add(trailGroup);

        // Store electron data for animation
        electronData.push({
          mesh: electron,
          orbit: orbit,
          orbitRadius: orbitRadii[i],
          speed: 0.7 + Math.random() * 0.7,
          angle: (Math.PI * 2 * j) / electronsPerOrbit, // Distribute electrons evenly
          offsetY: Math.sin(Math.random() * Math.PI * 2) * size * 0.2, // Add vertical offset for more 3D effect
          trail: trailMeshes,
        });

        atomGroup.add(electron);
      }
    }

    // Position the atom
    atomGroup.position.copy(position);

    // Add to world
    world.add(atomGroup);

    return {
      group: atomGroup,
      nucleus: nucleusMesh,
      nucleusGlow: glowMesh,
      electrons: electronData,
    };
  }

  function setupWindowManager() {
    windowManager = new WindowManager();
    windowManager.setWinShapeChangeCallback(updateWindowShape);
    windowManager.setWinChangeCallback(windowsUpdated);

    // here you can add your custom metadata to each windows instance
    let metaData = { type: "atom" };

    // this will init the windowmanager and add this window to the centralised pool of windows
    windowManager.init(metaData);

    // call update windows initially (it will later be called by the win change callback)
    windowsUpdated();
  }

  // Store atoms for each window
  let windowAtoms = [];

  function windowsUpdated() {
    // Clear previous atoms
    windowAtoms.forEach((atom) => {
      world.remove(atom.group);
    });
    windowAtoms = [];

    // Get all windows
    const windows = windowManager.getWindows();

    // Create an atom for each window
    windows.forEach((win, i) => {
      // Generate a unique color based on window index
      const hue = i * 0.15; // More color variation
      const saturation = 0.9;
      const lightness = 0.6;
      const color = new THREE.Color().setHSL(hue, saturation, lightness);

      // Calculate position based on window position - center it
      const position = new THREE.Vector3(
        win.shape.x + win.shape.w * 0.5 - window.innerWidth * 0.5,
        win.shape.y + win.shape.h * 0.5 - window.innerHeight * 0.5,
        0
      );

      // Create atom with size based on window size
      const size = Math.min(win.shape.w, win.shape.h) * 0.3;
      const atom = createAtom(position, size, color.getHex());

      // Store the atom with window ID for updates
      windowAtoms.push({
        ...atom,
        windowId: win.id,
        targetPosition: position.clone(),
        initialScale: size / 100, // Store scale for pulsing effect
      });
    });
  }

  function updateWindowShape(easing = true) {
    // storing the actual offset in a proxy that we update against in the render function
    sceneOffsetTarget = { x: -window.screenX, y: -window.screenY };
    if (!easing) sceneOffset = sceneOffsetTarget;
  }

  function render() {
    let t = getTime();

    windowManager.update();

    // calculate the new position based on the delta between current offset and new offset times a falloff value (to create the nice smoothing effect)
    let falloff = 0.05;
    sceneOffset.x =
      sceneOffset.x + (sceneOffsetTarget.x - sceneOffset.x) * falloff;
    sceneOffset.y =
      sceneOffset.y + (sceneOffsetTarget.y - sceneOffset.y) * falloff;

    // set the world position to the offset
    world.position.x = sceneOffset.x;
    world.position.y = sceneOffset.y;

    // Slight camera movement for more dynamic feel
    camera.position.x = Math.sin(t * 0.2) * 30;
    camera.position.y = Math.cos(t * 0.2) * 20;
    camera.lookAt(0, 0, 0);

    // Get windows for position updates
    const windows = windowManager.getWindows();

    // Update atom positions and animations
    windowAtoms.forEach((atom, i) => {
      // Find the corresponding window
      const win = windows.find((w) => w.id === atom.windowId);

      if (win) {
        // Update target position - center the atom in the viewport
        atom.targetPosition.set(
          win.shape.x + win.shape.w * 0.5 - window.innerWidth * 0.5,
          win.shape.y + win.shape.h * 0.5 - window.innerHeight * 0.5,
          0
        );

        // Smooth transition to new position
        atom.group.position.lerp(atom.targetPosition, falloff);

        // Pulse the nucleus size
        const pulseScale = 1 + Math.sin(t * 2) * 0.05;
        atom.nucleus.scale.set(pulseScale, pulseScale, pulseScale);

        // Pulse the nucleus glow
        const glowPulse = 1 + Math.sin(t * 3) * 0.1;
        atom.nucleusGlow.scale.set(glowPulse, glowPulse, glowPulse);

        // Rotate nucleus
        atom.nucleus.rotation.x += 0.01;
        atom.nucleus.rotation.y += 0.02;

        // Rotate orbits with different speeds
        atom.electrons.forEach((electron, j) => {
          // Rotate orbit dynamically
          electron.orbit.rotation.x += 0.001 * (j + 1);
          electron.orbit.rotation.y += 0.002 * (j + 1);
          electron.orbit.rotation.z += 0.001 * Math.sin(t * 0.3);

          // Store previous position for trail
          const prevPos = electron.mesh.position.clone();

          // Update electron position on orbit with vertical offset for more 3D feel
          electron.angle += electron.speed / 50; // Faster movement

          // Calculate position on the rotated orbit
          const orbit = electron.orbit;
          const radius = electron.orbitRadius;

          // Get the orbit's rotation matrix
          const rotationMatrix = new THREE.Matrix4();
          rotationMatrix.makeRotationFromEuler(orbit.rotation);

          // Calculate the base position on a circle with y-offset for 3D effect
          const x = radius * Math.cos(electron.angle);
          const y = electron.offsetY * Math.sin(electron.angle * 2);
          const z = radius * Math.sin(electron.angle);

          // Create a vector for this position
          const basePosition = new THREE.Vector3(x, y, z);

          // Apply the orbit's rotation to this position
          basePosition.applyMatrix4(rotationMatrix);

          // Set the electron's position
          electron.mesh.position.copy(basePosition);

          // Update trail positions
          if (electron.trail) {
            for (let k = electron.trail.length - 1; k >= 0; k--) {
              if (k === 0) {
                electron.trail[k].position.copy(prevPos);
              } else {
                electron.trail[k].position.copy(electron.trail[k - 1].position);
              }
            }
          }
        });
      }
    });

    renderer.render(scene, camera);
    requestAnimationFrame(render);
  }

  // resize the renderer to fit the window size
  function resize() {
    let width = window.innerWidth;
    let height = window.innerHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }
}
