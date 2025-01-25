import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Scene, Camera, Renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('map-container').appendChild(renderer.domElement);  // Append renderer to the map container

// Lighting
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(10, 10, 10);
scene.add(light);

// Load car model and add it to the scene
const loader = new GLTFLoader();
let carModel;

// Load the car model
loader.load(
  '/public/toyota-corolla.glb',  // Update path as needed
  (gltf) => {
    carModel = gltf.scene;
    carModel.position.set(0, 0.5, 0);  // Start position of the car
    carModel.scale.set(0.5, 0.5, 0.5); // Scale the car if needed
    scene.add(carModel);
  },
  undefined,
  (error) => {
    console.error('Error loading model:', error);
  }
);

// Create the floor (white plane)
const floorGeometry = new THREE.PlaneGeometry(500, 500); 
const floorMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = Math.PI / 2; // Rotate the floor to make it horizontal
scene.add(floor);

// Load tree model and add multiple trees to the map
let treeModel;
const treeLoader = new GLTFLoader();
const treeCount = 30; // Number of trees to place

treeLoader.load(
  '/public/parking_lot.glb',  // Update path as needed
  (gltf) => {
    treeModel = gltf.scene;
    treeModel.scale.set(1, 1, 1);  // Scale the tree if needed

    // Randomly place trees on the map
    for (let i = 0; i < treeCount; i++) {
      const treeClone = treeModel.clone();
      const randomX = Math.random() * 400 - 200; // Random position between -200 and 200
      const randomZ = Math.random() * 400 - 200; // Random position between -200 and 200
      treeClone.position.set(1, 1, -4);  // Position the tree
      scene.add(treeClone);
    }
  },
  undefined,
  (error) => {
    console.error('Error loading tree model:', error);
  }
);

// Camera position (slanted top-down view)
camera.position.set(0, 10, 10);
camera.lookAt(0, 0, 0);  // Focus the camera on the origin (where the car will be)

// Animation loop
function animate() {
  requestAnimationFrame(animate);

  // Check for car control based on key presses
  if (carModel) {
    if (keyState["ArrowUp"]) {
      carModel.position.z -= 1; // Move car forward
    }
    if (keyState["ArrowDown"]) {
      carModel.position.z += 1; // Move car backward
    }
    if (keyState["ArrowLeft"]) {
      carModel.position.x -= 1; // Move car left
    }
    if (keyState["ArrowRight"]) {
      carModel.position.x += 1; // Move car right
    }
  }

  // Render the scene
  renderer.render(scene, camera);
}

// Set up key controls
const keyState = {};
document.addEventListener("keydown", (event) => {
  keyState[event.key] = true;
});
document.addEventListener("keyup", (event) => {
  keyState[event.key] = false;
});

// Mouse wheel zoom
let zoomSpeed = 1; // Adjust zoom speed

function onWheel(event) {
  // Zoom in when scrolling up, zoom out when scrolling down
  if (event.deltaY < 0) {
    camera.position.z -= zoomSpeed; // Zoom in
  } else if (event.deltaY > 0) {
    camera.position.z += zoomSpeed; // Zoom out
  }

  // Prevent zooming too close or too far
  if (camera.position.z < 5) camera.position.z = 5; // Minimum zoom distance
  if (camera.position.z > 50) camera.position.z = 50; // Maximum zoom distance
}

window.addEventListener('wheel', onWheel, { passive: true });

// Start the animation loop
animate();

// Show the map scene when the button is clicked
const startButton = document.getElementById('start-button');
const welcomeScreen = document.getElementById('welcome-screen');
const mapContainer = document.getElementById('map-container');

startButton.addEventListener('click', () => {
  welcomeScreen.style.display = 'none';  // Hide the welcome screen
  mapContainer.style.display = 'block';  // Show the map
});
