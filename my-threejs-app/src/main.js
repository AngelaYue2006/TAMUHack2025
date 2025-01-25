import * as THREE from 'three';

// Scene, Camera, Renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.domElement.style.display = 'none'; // Hide canvas initially
document.body.appendChild(renderer.domElement);

// Lighting
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(0, 10, 10);
scene.add(light);

// Track (a simple plane)
const trackGeometry = new THREE.PlaneGeometry(5, 100);
const trackMaterial = new THREE.MeshBasicMaterial({ color: 0x555555, side: THREE.DoubleSide });
const track = new THREE.Mesh(trackGeometry, trackMaterial);
track.rotation.x = -Math.PI / 2; // Rotate the plane to lay flat
scene.add(track);

// Car (a simple box)
const carGeometry = new THREE.BoxGeometry(1, 0.5, 2);
const carMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
const car = new THREE.Mesh(carGeometry, carMaterial);
car.position.y = 0.25; // Lift it above the track
scene.add(car);

// Camera position
camera.position.set(0, 5, 10);
camera.lookAt(car.position);

// Movement variables
let carSpeed = 0; // Speed of the car
const maxForward = 45; // Forward limit
const maxBackward = -45; // Backward limit

// Keydown and Keyup event listeners
document.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowUp' || event.key === 'w') {
    carSpeed = 0.1; // Move forward
  } else if (event.key === 'ArrowDown' || event.key === 's') {
    carSpeed = -0.1; // Move backward
  }
});

document.addEventListener('keyup', (event) => {
  if (event.key === 'ArrowUp' || event.key === 'w' || event.key === 'ArrowDown' || event.key === 's') {
    carSpeed = 0; // Stop movement
  }
});

// Animation loop
function animate() {
  requestAnimationFrame(animate);

  // Update car position
  car.position.z += carSpeed;

  // Constrain the car to the track
  car.position.z = Math.max(maxBackward, Math.min(maxForward, car.position.z));

  // Render the scene
  renderer.render(scene, camera);
}

// Show Three.js scene when "Start Driving" is clicked
const startButton = document.getElementById('start-button');
const welcomeScreen = document.getElementById('welcome-screen');

startButton.addEventListener('click', () => {
  welcomeScreen.style.display = 'none'; // Hide welcome screen
  renderer.domElement.style.display = 'block'; // Show canvas
  animate(); // Start animation
});

// Handle window resizing
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
