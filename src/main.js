import * as THREE from 'three';
import { ARButton } from 'three/examples/jsm/webxr/ARButton.js';

let camera, scene, renderer;
let controller;
let reticle;

let hitTestSource = null;
let hitTestSourceRequested = false;

init();

function init() {
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  document.body.appendChild(renderer.domElement);

  // ВАЖЛИВО: Для Hit Test необхідно явно запросити цю функцію при створенні AR-сесії
  document.body.appendChild(ARButton.createButton(renderer, { requiredFeatures: ['hit-test'] }));

  // --- ОСВІТЛЕННЯ ---
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
  directionalLight.position.set(2, 5, 2);
  scene.add(directionalLight);

  // --- КОНТРОЛЕР (для обробки натискань на екран) ---
  controller = renderer.xr.getController(0);
  controller.addEventListener('select', onSelect);
  scene.add(controller);

  // --- СТВОРЕННЯ ВІЗУАЛЬНОЇ МІТКИ (RETICLE) ---
  // Мітка має вигляд кільця, яке буде "лежати" на знайденій поверхні
  const reticleGeometry = new THREE.RingGeometry(0.05, 0.06, 32).rotateX(-Math.PI / 2);
  const reticleMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 }); // Зелений колір мітки
  reticle = new THREE.Mesh(reticleGeometry, reticleMaterial);
  
  // Мітка не повинна оновлювати свою матрицю автоматично, ми будемо робити це вручну
  reticle.matrixAutoUpdate = false; 
  reticle.visible = false; // Приховуємо, поки не знайдемо поверхню
  scene.add(reticle);

  window.addEventListener('resize', onWindowResize);

  // Запуск циклу анімації
  renderer.setAnimationLoop(render);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// --- ФУНКЦІЯ РОЗМІЩЕННЯ ОБ'ЄКТА ---
function onSelect() {
  // Розміщуємо об'єкт лише тоді, коли мітка видима (поверхню знайдено)
  if (reticle.visible) {
    // Створюємо IcosahedronGeometry згідно з завданням
    const geometry = new THREE.IcosahedronGeometry(0.1); 

    // Генеруємо випадковий колір та металевість
    const randomColor = new THREE.Color(0xffffff * Math.random());
    const randomMetalness = Math.random();

    const material = new THREE.MeshStandardMaterial({ 
      color: randomColor,
      metalness: randomMetalness, // Випадкова металевість
      roughness: 0.2 // Зробимо його трохи глянцевим, щоб метал краще виглядав
    });

    const mesh = new THREE.Mesh(geometry, material);

    // Встановлюємо позицію нового меша точно за координатами мітки (reticle)
    mesh.position.setFromMatrixPosition(reticle.matrix);
    
    // Щоб ікосаедр "стояв" рівно на поверхні, можна також скопіювати поворот мітки
    mesh.quaternion.setFromRotationMatrix(reticle.matrix);

    scene.add(mesh);
  }
}

// --- ЦИКЛ РЕНДЕРИНГУ ТА ЛОГІКА HIT TEST ---
function render(timestamp, frame) {
  if (frame) {
    const referenceSpace = renderer.xr.getReferenceSpace(); // Отримуємо localSpace
    const session = renderer.xr.getSession();

    // Запитуємо hitTestSource лише один раз при старті сесії
    if (hitTestSourceRequested === false) {
      session.requestReferenceSpace('viewer').then(function (viewerSpace) {
        session.requestHitTestSource({ space: viewerSpace }).then(function (source) {
          hitTestSource = source;
        });
      });
      session.addEventListener('end', function () {
        hitTestSourceRequested = false;
        hitTestSource = null;
      });
      hitTestSourceRequested = true;
    }

    // Якщо джерело Hit Test готове, шукаємо поверхні
    if (hitTestSource) {
      const hitTestResults = frame.getHitTestResults(hitTestSource);

      if (hitTestResults.length > 0) {
        // Отримуємо найближчу поверхню
        const hit = hitTestResults[0];
        
        // Отримуємо позу (позицію та орієнтацію) поверхні
        const pose = hit.getPose(referenceSpace);

        // Показуємо мітку та застосовуємо до неї знайдену матрицю трансформації
        reticle.visible = true;
        reticle.matrix.fromArray(pose.transform.matrix);
      } else {
        // Якщо поверхню втрачено, ховаємо мітку
        reticle.visible = false;
      }
    }
  }

  renderer.render(scene, camera);
}