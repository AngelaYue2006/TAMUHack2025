import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Function to load and place parking lots
export function loadParkingLots(scene) {
  const lotLoader = new GLTFLoader();

  lotLoader.load(
    '/parking_lot.glb',  // Update path as needed
    (gltf) => {
      const lotModel = gltf.scene;
      lotModel.scale.set(4,4, 4);  // Scale the lot if needed

      // Place parking lot
      const positions = [
        { x: 1, y: 0, z: 1 }
      ];

      positions.forEach(pos => {
        const lotClone = lotModel.clone();
        lotClone.position.set(pos.x, pos.y, pos.z);
        scene.add(lotClone);
      });
    },
    undefined,
    (error) => {
      console.error('Error loading parking lot model:', error);
    }
  );
}