import * as THREE from 'three';
import { ARButton } from 'three/examples/jsm/webxr/ARButton.js';

import { createReticle, createTask3Object } from './objects.js';
import { loadPineappleModel } from './loader.js';
import { setupLights } from './lights.js';

let camera;
let scene;
let renderer;
let controller;
let reticle;

let hitTestSource = null;
let hitTestSourceRequested = false;
let hitTestSourceInitializing = false;
let localSpace = null;

let activeMode = 'task3';
let pineappleTemplate = null;

const objectsGroup = new THREE.Group();

const ui = createInterface();

init();
animate();
checkARCompatibility();

loadPineappleModel().then((model) => {
  if (model) {
    pineappleTemplate = model;
    ui.setStatus('Pineapple model is ready.');
    return;
  }

  ui.setStatus('Put pineapple.glb in public/ and refresh the page.');
});

function init() {
  scene = new THREE.Scene();
  scene.add(objectsGroup);

  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  document.body.appendChild(renderer.domElement);

  setupLights(scene);

  controller = renderer.xr.getController(0);
  controller.addEventListener('select', onSelect);
  scene.add(controller);

  reticle = createReticle();
  scene.add(reticle);

  document.body.appendChild(ARButton.createButton(renderer, { requiredFeatures: ['hit-test'] }));

  window.addEventListener('resize', onWindowResize, false);
}

function createInterface() {
  const panel = document.createElement('div');
  panel.className = 'hud';

  const title = document.createElement('div');
  title.className = 'hud-title';
  title.textContent = 'AR Hit Test Lab';
  panel.appendChild(title);

  const instructions = document.createElement('p');
  instructions.className = 'hud-copy';
  instructions.textContent = 'Enter AR, find a surface, then tap to place either the generated task 3 object or the pineapple model.';
  panel.appendChild(instructions);

  const modeRow = document.createElement('div');
  modeRow.className = 'mode-row';

  const task3Button = document.createElement('button');
  task3Button.type = 'button';
  task3Button.className = 'mode-button is-active';
  task3Button.textContent = 'Task 3 object';
  task3Button.addEventListener('click', () => setMode('task3'));
  modeRow.appendChild(task3Button);

  const pineappleButton = document.createElement('button');
  pineappleButton.type = 'button';
  pineappleButton.className = 'mode-button';
  pineappleButton.textContent = 'Task 4 pineapple';
  pineappleButton.addEventListener('click', () => setMode('pineapple'));
  modeRow.appendChild(pineappleButton);

  panel.appendChild(modeRow);

  const status = document.createElement('div');
  status.className = 'hud-status';
  status.textContent = 'Task 3 object mode is active.';
  panel.appendChild(status);

  const compatibility = document.createElement('div');
  compatibility.className = 'hud-compatibility';
  compatibility.textContent = 'Checking WebXR support...';
  panel.appendChild(compatibility);

  document.body.appendChild(panel);

  return {
    setStatus(message) {
      status.textContent = message;
    },
    setCompatibility(message) {
      compatibility.textContent = message;
    },
    setActiveMode(nextMode) {
      task3Button.classList.toggle('is-active', nextMode === 'task3');
      pineappleButton.classList.toggle('is-active', nextMode === 'pineapple');
    }
  };
}

function setMode(mode) {
  activeMode = mode;
  ui.setActiveMode(mode);
  ui.setStatus(mode === 'task3' ? 'Task 3 object mode is active.' : 'Task 4 pineapple mode is active.');
}

async function checkARCompatibility() {
  if (!window.isSecureContext) {
    ui.setCompatibility('WebXR needs HTTPS. Open the same URL as https://<PC-IP>:5173 in Chrome.');
    return;
  }

  if (!('xr' in navigator)) {
    ui.setCompatibility('This browser does not expose WebXR. Use latest Chrome on Android.');
    return;
  }

  try {
    const isSupported = await navigator.xr.isSessionSupported('immersive-ar');
    if (!isSupported) {
      ui.setCompatibility('immersive-ar is unavailable on this device. Install/enable Google Play Services for AR and use an ARCore-supported phone.');
      return;
    }

    ui.setCompatibility('WebXR AR is available. Tap START AR.');
  } catch (error) {
    ui.setCompatibility(`AR support check failed: ${error.message}`);
  }
}

function onSelect() {
  if (!reticle.visible) {
    return;
  }

  if (activeMode === 'task3') {
    const object = createTask3Object();
    object.position.setFromMatrixPosition(reticle.matrix);
    object.quaternion.setFromRotationMatrix(reticle.matrix);
    object.translateY(0.04);
    objectsGroup.add(object);
    return;
  }

  if (!pineappleTemplate) {
    ui.setStatus('Pineapple model is still loading.');
    return;
  }

  const pineapple = pineappleTemplate.clone(true);
  pineapple.position.setFromMatrixPosition(reticle.matrix);
  pineapple.quaternion.setFromRotationMatrix(reticle.matrix);
  pineapple.translateY(0.05);
  objectsGroup.add(pineapple);
}

async function initializeHitTestSource() {
  if (hitTestSourceInitializing || hitTestSourceRequested) {
    return;
  }

  const session = renderer.xr.getSession();
  if (!session) {
    return;
  }

  hitTestSourceInitializing = true;

  try {
    const viewerSpace = await session.requestReferenceSpace('viewer');
    hitTestSource = await session.requestHitTestSource({ space: viewerSpace });
    localSpace = await session.requestReferenceSpace('local');
    hitTestSourceRequested = true;

    session.addEventListener('end', () => {
      hitTestSourceRequested = false;
      hitTestSourceInitializing = false;
      hitTestSource = null;
      localSpace = null;
      reticle.visible = false;
    }, { once: true });
  } catch (error) {
    console.error('Failed to initialize hit test source:', error);
  } finally {
    hitTestSourceInitializing = false;
  }
}

function render(timestamp, frame) {
  if (frame) {
    if (!hitTestSourceRequested && !hitTestSourceInitializing) {
      initializeHitTestSource();
    }

    if (hitTestSource && localSpace) {
      const hitTestResults = frame.getHitTestResults(hitTestSource);

      if (hitTestResults.length > 0) {
        const hit = hitTestResults[0];
        const pose = hit.getPose(localSpace);

        if (pose) {
          reticle.visible = true;
          reticle.matrix.fromArray(pose.transform.matrix);
        } else {
          reticle.visible = false;
        }
      } else {
        reticle.visible = false;
      }
    }
  }

  renderer.render(scene, camera);
}

function animate() {
  renderer.setAnimationLoop(render);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
