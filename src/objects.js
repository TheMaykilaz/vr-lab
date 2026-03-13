import * as THREE from 'three';

export function setupObjects(scene) {
  // Об'єкт 1: Dodecahedron (Додекаедр)
  const geoDodecahedron = new THREE.DodecahedronGeometry(0.15);
  const matDodecahedron = new THREE.MeshStandardMaterial({ 
    color: 0x8844aa,
    roughness: 0.8,
    metalness: 0.2
  });
  const dodecahedron = new THREE.Mesh(geoDodecahedron, matDodecahedron);
  dodecahedron.position.set(-0.4, 0, -1.2);
  scene.add(dodecahedron);

  // Об'єкт 2: Ring (Кільце)
  const geoRing = new THREE.RingGeometry(0.15, 0.22, 32);
  const matRing = new THREE.MeshBasicMaterial({ 
    color: 0x00ffff,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.8
  });
  const ring = new THREE.Mesh(geoRing, matRing);
  ring.position.set(0, 0.3, -1.5);
  scene.add(ring);

  // Об'єкт 3: Tetrahedron (Тетраедр)
  const geoTetrahedron = new THREE.TetrahedronGeometry(0.18);
  const matTetrahedron = new THREE.MeshPhongMaterial({ 
    color: 0xffd700,
    shininess: 150 
  });
  const tetrahedron = new THREE.Mesh(geoTetrahedron, matTetrahedron);
  tetrahedron.position.set(0.4, -0.2, -1.2);
  tetrahedron.rotation.x = Math.PI / 4; 
  scene.add(tetrahedron);

  // Повертаємо об'єкти для анімації в main.js
  return { dodecahedron, ring, tetrahedron };
}