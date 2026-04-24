import * as THREE from 'three';

export function createTask3Object() {
  const group = new THREE.Group();

  const body = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.12, 0),
    new THREE.MeshStandardMaterial({
      color: 0xffc94d,
      roughness: 0.35,
      metalness: 0.08
    })
  );
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  const accent = new THREE.Mesh(
    new THREE.TorusGeometry(0.08, 0.015, 16, 32),
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.2,
      metalness: 0.4
    })
  );
  accent.rotation.x = Math.PI / 2;
  accent.position.y = 0.03;
  group.add(accent);

  const tip = new THREE.Mesh(
    new THREE.ConeGeometry(0.035, 0.1, 5),
    new THREE.MeshStandardMaterial({
      color: 0xff8f1f,
      roughness: 0.55,
      metalness: 0.05
    })
  );
  tip.position.y = 0.16;
  tip.rotation.y = Math.PI / 5;
  group.add(tip);

  return group;
}

export function createReticle() {
  const geometry = new THREE.RingGeometry(0.06, 0.08, 32).rotateX(-Math.PI / 2);
  const material = new THREE.MeshBasicMaterial({
    color: 0x34d399,
    transparent: true,
    opacity: 0.95
  });

  const reticle = new THREE.Mesh(geometry, material);
  reticle.matrixAutoUpdate = false;
  reticle.visible = false;

  const axes = new THREE.AxesHelper(0.12);
  reticle.add(axes);

  return reticle;
}