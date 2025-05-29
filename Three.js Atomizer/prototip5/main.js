import WindowManager from "./WindowManager.js";

const t = THREE;
let camera, scene, renderer, world;
let near, far;
let pixR = window.devicePixelRatio ? window.devicePixelRatio : 1;
let atoms = [];
let sceneOffsetTarget = { x: 0, y: 0 };
let sceneOffset = { x: 0, y: 0 };

let today = new Date();
today.setHours(0);
today.setMinutes(0);
today.setSeconds(0);
today.setMilliseconds(0);
today = today.getTime();

let internalTime = getTime();
let windowManager;
let initialized = false;

// Enhanced atomic elements with real properties
const ATOMIC_ELEMENTS = [
  {
    name: "Hydrogen",
    symbol: "H",
    protons: 1,
    electrons: 1,
    nucleusColor: 0xff6b6b,
    electronColor: 0x4ecdc4,
    orbitSpeed: 0.03,
    nucleusSize: 15,
    electronSize: 5,
    orbits: [45],
    electronsPerOrbit: [1],
  },
  {
    name: "Helium",
    symbol: "He",
    protons: 2,
    electrons: 2,
    nucleusColor: 0xffe66d,
    electronColor: 0x95e1d3,
    orbitSpeed: 0.025,
    nucleusSize: 20,
    electronSize: 6,
    orbits: [50],
    electronsPerOrbit: [2],
  },
  {
    name: "Carbon",
    symbol: "C",
    protons: 6,
    electrons: 6,
    nucleusColor: 0xa8e6cf,
    electronColor: 0xff8b94,
    orbitSpeed: 0.02,
    nucleusSize: 25,
    electronSize: 7,
    orbits: [40, 70],
    electronsPerOrbit: [2, 4],
  },
  {
    name: "Oxygen",
    symbol: "O",
    protons: 8,
    electrons: 8,
    nucleusColor: 0x88d8c0,
    electronColor: 0xffc48c,
    orbitSpeed: 0.022,
    nucleusSize: 28,
    electronSize: 7,
    orbits: [45, 75],
    electronsPerOrbit: [2, 6],
  },
  {
    name: "Neon",
    symbol: "Ne",
    protons: 10,
    electrons: 10,
    nucleusColor: 0xffc48c,
    electronColor: 0x88d8c0,
    orbitSpeed: 0.018,
    nucleusSize: 30,
    electronSize: 8,
    orbits: [50, 80],
    electronsPerOrbit: [2, 8],
  },
  {
    name: "Sodium",
    symbol: "Na",
    protons: 11,
    electrons: 11,
    nucleusColor: 0xff9f43,
    electronColor: 0x74b9ff,
    orbitSpeed: 0.025,
    nucleusSize: 32,
    electronSize: 8,
    orbits: [45, 75, 105],
    electronsPerOrbit: [2, 8, 1],
  },
  {
    name: "Silicon",
    symbol: "Si",
    protons: 14,
    electrons: 14,
    nucleusColor: 0x6c5ce7,
    electronColor: 0xfd79a8,
    orbitSpeed: 0.02,
    nucleusSize: 35,
    electronSize: 9,
    orbits: [50, 80, 110],
    electronsPerOrbit: [2, 8, 4],
  },
  {
    name: "Iron",
    symbol: "Fe",
    protons: 26,
    electrons: 26,
    nucleusColor: 0xe84393,
    electronColor: 0x00b894,
    orbitSpeed: 0.015,
    nucleusSize: 40,
    electronSize: 10,
    orbits: [45, 70, 95, 120],
    electronsPerOrbit: [2, 8, 14, 2],
  },
];

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
    camera = new t.OrthographicCamera(
      0,
      0,
      window.innerWidth,
      window.innerHeight,
      -10000,
      10000
    );

    camera.position.z = 2.5;
    near = camera.position.z - 0.5;
    far = camera.position.z + 0.5;

    scene = new t.Scene();
    scene.background = new t.Color(0x0a0a0a); // Darker background for better atom visibility
    scene.add(camera);

    renderer = new t.WebGLRenderer({ antialias: true, depthBuffer: true });
    renderer.setPixelRatio(pixR);

    // Enhanced lighting for better atom visualization
    const ambientLight = new t.AmbientLight(0x404040, 0.4);
    scene.add(ambientLight);

    const directionalLight = new t.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(100, 100, 50);
    scene.add(directionalLight);

    const pointLight1 = new t.PointLight(0x4ecdc4, 0.8, 1000);
    pointLight1.position.set(200, 200, 100);
    scene.add(pointLight1);

    const pointLight2 = new t.PointLight(0xff6b6b, 0.6, 800);
    pointLight2.position.set(-200, -200, 100);
    scene.add(pointLight2);

    world = new t.Object3D();
    scene.add(world);

    renderer.domElement.setAttribute("id", "scene");
    document.body.appendChild(renderer.domElement);
  }

  function setupWindowManager() {
    windowManager = new WindowManager();
    windowManager.setWinShapeChangeCallback(updateWindowShape);
    windowManager.setWinChangeCallback(windowsUpdated);

    // here you can add your custom metadata to each windows instance
    let metaData = { foo: "bar" };

    // this will init the windowmanager and add this window to the centralised pool of windows
    windowManager.init(metaData);

    // call update windows initially (it will later be called by the win change callback)
    windowsUpdated();
  }

  function windowsUpdated() {
    updateNumberOfAtoms();
  }

  function createAtomLabel(element, position) {
    // Create a simple text label for the atom
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.width = 128;
    canvas.height = 64;

    context.fillStyle = "#ffffff";
    context.font = "Bold 24px Arial";
    context.textAlign = "center";
    context.fillText(element.symbol, 64, 30);
    context.font = "16px Arial";
    context.fillText(element.name, 64, 50);

    const texture = new t.CanvasTexture(canvas);
    const spriteMaterial = new t.SpriteMaterial({ map: texture });
    const sprite = new t.Sprite(spriteMaterial);
    sprite.scale.set(50, 25, 1);
    sprite.position.copy(position);
    sprite.position.y += 100; // Position above atom

    return sprite;
  }

  function updateNumberOfAtoms() {
    let wins = windowManager.getWindows();

    // remove all atoms
    atoms.forEach((atom) => {
      // Remove nucleus
      world.remove(atom.nucleus);
      // Remove electrons
      atom.electrons.forEach((electron) => {
        world.remove(electron);
      });
      // Remove orbits
      atom.orbits.forEach((orbit) => {
        world.remove(orbit);
      });
      // Remove label
      if (atom.label) {
        world.remove(atom.label);
      }
      // Remove proton/neutron effects
      if (atom.nucleusParticles) {
        atom.nucleusParticles.forEach((particle) => {
          world.remove(particle);
        });
      }
    });

    atoms = [];

    // add new atoms based on the current window setup
    for (let i = 0; i < wins.length; i++) {
      let win = wins[i];

      // Select element based on window index (cycles through available elements)
      const elementIndex = i % ATOMIC_ELEMENTS.length;
      const element = ATOMIC_ELEMENTS[elementIndex];

      // Create nucleus (center of atom) with enhanced appearance
      let nucleus = new t.Mesh(
        new t.SphereGeometry(element.nucleusSize, 32, 32),
        new t.MeshPhongMaterial({
          color: element.nucleusColor,
          emissive: element.nucleusColor,
          emissiveIntensity: 0.2,
          shininess: 100,
          transparent: true,
          opacity: 0.9,
        })
      );
      nucleus.position.x = win.shape.x + win.shape.w * 0.5;
      nucleus.position.y = win.shape.y + win.shape.h * 0.5;

      // Add nucleus particles effect (protons/neutrons)
      let nucleusParticles = [];
      for (let p = 0; p < element.protons; p++) {
        const particle = new t.Mesh(
          new t.SphereGeometry(3, 8, 8),
          new t.MeshBasicMaterial({
            color: p % 2 === 0 ? 0xffaaaa : 0xaaaaff,
            transparent: true,
            opacity: 0.7,
          })
        );

        // Random position within nucleus
        const angle = (p / element.protons) * Math.PI * 2;
        const radius = element.nucleusSize * 0.6;
        particle.position.x =
          nucleus.position.x + Math.cos(angle) * radius * Math.random();
        particle.position.y =
          nucleus.position.y + Math.sin(angle) * radius * Math.random();
        particle.position.z = (Math.random() - 0.5) * element.nucleusSize;

        nucleusParticles.push(particle);
        world.add(particle);
      }

      // Create orbit rings with enhanced appearance
      let orbits = [];
      for (let o = 0; o < element.orbits.length; o++) {
        const orbitGeometry = new t.RingGeometry(
          element.orbits[o] - 2,
          element.orbits[o] + 2,
          64
        );
        const orbitMaterial = new t.MeshBasicMaterial({
          color: 0x444466,
          transparent: true,
          opacity: 0.2,
          side: t.DoubleSide,
        });
        const orbit = new t.Mesh(orbitGeometry, orbitMaterial);
        orbit.position.copy(nucleus.position);
        orbit.rotation.x = Math.PI / 2 + (Math.random() - 0.5) * 0.3; // Slight random tilt
        orbit.rotation.z = Math.random() * Math.PI * 2;

        orbits.push(orbit);
        world.add(orbit);
      }

      // Create electrons with enhanced appearance
      let electrons = [];
      let electronIndex = 0;

      for (
        let orbitLevel = 0;
        orbitLevel < element.orbits.length;
        orbitLevel++
      ) {
        for (let e = 0; e < element.electronsPerOrbit[orbitLevel]; e++) {
          const electronGeometry = new t.SphereGeometry(
            element.electronSize,
            16,
            16
          );
          const electronMaterial = new t.MeshPhongMaterial({
            color: element.electronColor,
            emissive: element.electronColor,
            emissiveIntensity: 0.3,
            shininess: 200,
            transparent: true,
            opacity: 0.8,
          });
          const electron = new t.Mesh(electronGeometry, electronMaterial);

          // Initial electron position
          const angle =
            (e / element.electronsPerOrbit[orbitLevel]) * Math.PI * 2;
          const orbitRadius = element.orbits[orbitLevel];

          electron.position.x =
            nucleus.position.x + Math.cos(angle) * orbitRadius;
          electron.position.y =
            nucleus.position.y + Math.sin(angle) * orbitRadius;

          // Store electron data for animation
          electron.userData = {
            orbitRadius: orbitRadius,
            angle: angle,
            speed: element.orbitSpeed * (1 + Math.random() * 0.5), // Slight speed variation
            centerX: nucleus.position.x,
            centerY: nucleus.position.y,
            orbitLevel: orbitLevel,
            orbitTilt: orbits[orbitLevel].rotation.x,
            orbitRotation: orbits[orbitLevel].rotation.z,
          };

          electrons.push(electron);
          world.add(electron);
        }
      }

      // Create atom label
      const atomPosition = new t.Vector3(
        nucleus.position.x,
        nucleus.position.y,
        nucleus.position.z
      );
      const label = createAtomLabel(element, atomPosition);
      world.add(label);

      world.add(nucleus);

      // Store atom data with enhanced properties
      let atom = {
        element: element,
        nucleus: nucleus,
        electrons: electrons,
        orbits: orbits,
        nucleusParticles: nucleusParticles,
        label: label,
        baseX: win.shape.x + win.shape.w * 0.5,
        baseY: win.shape.y + win.shape.h * 0.5,
      };

      atoms.push(atom);
    }
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
    let falloff = 0.25; // Increased for even faster convergence
    sceneOffset.x =
      sceneOffset.x + (sceneOffsetTarget.x - sceneOffset.x) * falloff;
    sceneOffset.y =
      sceneOffset.y + (sceneOffsetTarget.y - sceneOffset.y) * falloff;

    // set the world position to the offset
    world.position.x = sceneOffset.x;
    world.position.y = sceneOffset.y;

    let wins = windowManager.getWindows();

    // loop through all our atoms and update their positions based on current window positions
    for (let i = 0; i < atoms.length; i++) {
      let atom = atoms[i];
      let win = wins[i];
      if (!win) continue; // Skip if window doesn't exist

      let _t = t;

      // Use realtime position if available for smoother animation
      let targetPos = win.realtimePosition || win.shape;
      let posTarget = {
        x: targetPos.x + (targetPos.w || win.shape.w) * 0.5,
        y: targetPos.y + (targetPos.h || win.shape.h) * 0.5,
      };

      // Even faster falloff for atom positions with smooth interpolation
      let atomFalloff = 0.35; // Increased for more responsive movement

      // Update nucleus position with smooth interpolation
      let deltaX = posTarget.x - atom.nucleus.position.x;
      let deltaY = posTarget.y - atom.nucleus.position.y;

      // Apply easing for very smooth movement
      atom.nucleus.position.x += deltaX * atomFalloff;
      atom.nucleus.position.y += deltaY * atomFalloff;

      // Enhanced nucleus rotation with element-specific properties
      atom.nucleus.rotation.x = _t * (0.1 + atom.element.protons * 0.01);
      atom.nucleus.rotation.y = _t * (0.15 + atom.element.protons * 0.005);

      // Update nucleus particles
      if (atom.nucleusParticles) {
        atom.nucleusParticles.forEach((particle, p) => {
          particle.position.x = atom.nucleus.position.x + Math.cos(_t + p) * 8;
          particle.position.y = atom.nucleus.position.y + Math.sin(_t + p) * 8;
          particle.rotation.x = _t * 0.5;
          particle.rotation.y = _t * 0.7;
        });
      }

      // Update orbit positions and rotations
      atom.orbits.forEach((orbit, o) => {
        orbit.position.x = atom.nucleus.position.x;
        orbit.position.y = atom.nucleus.position.y;
        orbit.rotation.z += 0.002 * (o + 1); // Different rotation speeds for each orbit
      });

      // Update label position
      if (atom.label) {
        atom.label.position.x = atom.nucleus.position.x;
        atom.label.position.y = atom.nucleus.position.y + 100;
      }

      // Update electron positions and orbits with enhanced 3D movement
      atom.electrons.forEach((electron, j) => {
        // Update orbit center based on nucleus position with interpolation
        let targetCenterX = atom.nucleus.position.x;
        let targetCenterY = atom.nucleus.position.y;

        // Smooth interpolation for electron orbit centers
        electron.userData.centerX +=
          (targetCenterX - electron.userData.centerX) * 0.4;
        electron.userData.centerY +=
          (targetCenterY - electron.userData.centerY) * 0.4;

        // Update electron angle for orbit animation (element-specific speed)
        electron.userData.angle += electron.userData.speed;

        // Calculate new position with enhanced 3D orbiting
        const orbitTilt = electron.userData.orbitTilt;
        const orbitRotation = electron.userData.orbitRotation + _t * 0.1;

        let newX =
          electron.userData.centerX +
          Math.cos(electron.userData.angle) *
            electron.userData.orbitRadius *
            Math.cos(orbitTilt);
        let newY =
          electron.userData.centerY +
          Math.sin(electron.userData.angle) * electron.userData.orbitRadius;
        let newZ =
          Math.sin(electron.userData.angle) *
          electron.userData.orbitRadius *
          Math.sin(orbitTilt) *
          0.3;

        // Apply the position smoothly
        electron.position.x = newX;
        electron.position.y = newY;
        electron.position.z = newZ;

        // Enhanced electron rotation with pulsing effect
        electron.rotation.x = _t * 1.4;
        electron.rotation.y = _t * 1.1;

        // Pulsing effect based on atomic properties
        const pulseIntensity = Math.sin(_t * 3 + j) * 0.2 + 0.8;
        electron.material.emissiveIntensity = 0.3 * pulseIntensity;
        electron.scale.setScalar(pulseIntensity);
      });
    }

    renderer.render(scene, camera);
    requestAnimationFrame(render);
  }

  // resize the renderer to fit the window size
  function resize() {
    let width = window.innerWidth;
    let height = window.innerHeight;

    camera = new t.OrthographicCamera(0, width, 0, height, -10000, 10000);
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }
}
