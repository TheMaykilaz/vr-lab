import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export function loadTreeModel(scene) {
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader();
    
    // Вказуємо шлях до файлу. Оскільки файл у папці public, шлях починається з '/'
    loader.load(
      '/ring.glb', // ВАЖЛИВО: замініть на точну назву вашого файлу, якщо вона інша
      (gltf) => {
        const model = gltf.scene;

        // Налаштування масштабу згідно зі звітом
        model.scale.set(0.5, 0.5, 0.5);

        // Позиціювання перед камерою (трохи нижче рівня очей, на відстані 2 метри)
        model.position.set(0, -0.5, -2);

        // Проходимось по всіх дочірніх мешах для активації тіней
        model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        scene.add(model);
        resolve(model); // Повертаємо модель, щоб мати змогу її анімувати
      },
      undefined, // Функція прогресу завантаження (можна залишити undefined)
      (error) => {
        console.error('Помилка завантаження моделі:', error);
        reject(error);
      }
    );
  });
}