import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export function loadPineappleModel() {
  const loader = new GLTFLoader();

  return new Promise((resolve) => {
    loader.load(
      '/pineapple.glb',
      (gltf) => {
        const model = gltf.scene;

        model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        const box = new THREE.Box3().setFromObject(model);
        const size = new THREE.Vector3();
        const center = new THREE.Vector3();

        box.getSize(size);
        box.getCenter(center);

        model.position.sub(center);

        const maxDimension = Math.max(size.x, size.y, size.z);
        const targetSize = 0.35;
        const scale = targetSize / maxDimension;
        model.scale.setScalar(scale);

        model.rotation.y = Math.PI / 4;
        resolve(model);
      },
      undefined,
      (error) => {
        console.error('Failed to load pineapple.glb:', error);
        resolve(null);
      }
    );
  });
}