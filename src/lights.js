import * as THREE from 'three';

export function setupLights(scene) {
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(5, 5, 5);
  scene.add(directionalLight);

  const pointLight = new THREE.PointLight(0xffaa00, 2, 10);
  pointLight.position.set(-2, 2, -2);
  scene.add(pointLight);
}