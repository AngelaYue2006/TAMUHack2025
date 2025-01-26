import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Function to load and place parking lots
export function loadParkingLots(scene) {
  const lotLoader = new GLTFLoader();

  lotLoader.load(
    '/public/parking_lot.glb',  // Update path as needed
    (gltf) => {
      const lotModel = gltf.scene;
      lotModel.scale.set(4,4, 4);  // Scale the lot if needed

      // Place multiple parking lots
      const positions = [
        { x: 1, y: 0, z: 1 }
        // { x: 100, y: 0, z: 50 },
        // { x: 50, y: 0, z: 100 },
        // { x: 75, y: 0, z: 75 },
        // { x: 0, y: 0, z: 100 },
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

// Function to load and place trees
export function loadTrees(scene) {
  const treeLoader = new GLTFLoader();

  treeLoader.load(
    '/public/tree.glb',  // Update path as needed
    (gltf) => {
      const treeModel = gltf.scene;
      treeModel.scale.set(1, 1, 1);  // Scale the tree if needed

      // Place multiple trees
      const positions = [
        { x: 10, y: -1, z: 10 },
        { x: 20, y: -1, z: 20 },
        { x: 30, y: -1, z: 30 },
      ];

      positions.forEach(pos => {
        const treeClone = treeModel.clone();
        treeClone.position.set(pos.x, pos.y, pos.z);
        scene.add(treeClone);
      });
    },
    undefined,
    (error) => {
      console.error('Error loading tree model:', error);
    }
  );
}