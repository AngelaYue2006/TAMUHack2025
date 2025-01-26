import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { loadParkingLots } from './map.js';

// Scene, Camera, Renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Enable shadows
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.shadowMap.autoUpdate = true; // Ensure shadows update dynamically

// Lighting (Sun)
const sunLight = new THREE.DirectionalLight(0xffffff, 2); // Brighter light
sunLight.position.set(10, 20, 10); // Position the sun
sunLight.castShadow = true; // Enable shadows

// Adjust shadow camera frustum
const roadSize = 5000; // Size of the road
sunLight.shadow.camera.left = -roadSize / 2; // Extend left
sunLight.shadow.camera.right = roadSize / 2; // Extend right
sunLight.shadow.camera.top = roadSize / 2; // Extend top
sunLight.shadow.camera.bottom = -roadSize / 2; // Extend bottom
sunLight.shadow.camera.near = 0.5; // Near clipping plane
sunLight.shadow.camera.far = roadSize; // Far clipping plane

// Update the shadow camera's projection matrix
sunLight.shadow.camera.updateProjectionMatrix();

scene.add(sunLight);

// Ambient light for soft illumination
scene.add(new THREE.AmbientLight(0xffffff, 1)); // Brighter ambient light

// Hemisphere light for sky/ground illumination
const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1); // Sky color, ground color, intensity
scene.add(hemisphereLight);

// Add a Skybox (Low-poly gradient sky)
const skyGeometry = new THREE.SphereGeometry(500, 32, 32);
const skyMaterial = new THREE.MeshBasicMaterial({
  color: 0x87CEEB, // Light blue sky color
  side: THREE.BackSide,
});
const skybox = new THREE.Mesh(skyGeometry, skyMaterial);
scene.add(skybox);

// Add a Road with Low-Poly Style
const roadGeometry = new THREE.PlaneGeometry(roadSize, roadSize); // Larger plane
const roadTexture = new THREE.TextureLoader().load('road-texture.jpg'); // Replace with your texture
roadTexture.wrapS = THREE.RepeatWrapping;
roadTexture.wrapT = THREE.RepeatWrapping;
roadTexture.repeat.set(roadSize / 10, roadSize / 10); // Adjust texture tiling to match the new size
const roadMaterial = new THREE.MeshPhongMaterial({
  map: roadTexture,
  side: THREE.DoubleSide,
});
const road = new THREE.Mesh(roadGeometry, roadMaterial);
road.rotation.x = -Math.PI / 2; // Rotate the plane to be horizontal
road.position.y = -0.5; // Slightly below the car
road.receiveShadow = true; // Enable shadow receiving
scene.add(road);

// Load parking lots and trees
loadParkingLots(scene);

// Load Car Model
const loader = new GLTFLoader();
let car, wheels = [];

// Adjust the path to the GLB file
loader.load('/mirai.glb', (gltf) => {
    car = gltf.scene;
    scene.add(car);

    // Enable shadows for the car
    car.traverse((child) => {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;

            // Adjust material properties if needed
            if (child.material) {
                child.material.metalness = 0.1; // Reduce metalness
                child.material.roughness = 0.5; // Increase roughness
                child.material.needsUpdate = true; // Ensure material updates
            }
        }
    });

    // Find wheels in the model (adjust names based on your GLB file)
    car.traverse((child) => {
        if (child.isMesh && child.name.includes('wheel')) {
            wheels.push(child);
        }
    });

    // Position the car
    car.position.set(20, .5, 85);
    car.scale.set(0.3, 0.3, 0.3);
}, undefined, (error) => {
    console.error('Error loading car model:', error);
});

// Camera Follow Setup
const cameraOffset = new THREE.Vector3(0, 1, -2); // Adjusted for higher and further back view
const cameraLag = 0.1; // Lag for smoother camera movement

// Movement Variables
const moveSpeed = 0.1;
const turnSpeed = 0.015;
let moveDirection = new THREE.Vector3();
let turnAngle = 0;

// Speed Variables
let carSpeed = 0; // Speed in mph
const maxSpeed = 20; // Maximum speed for the speedometer
const acceleration = 0.02; // Rate of acceleration
const deceleration = 0.03; // Rate of deceleration
let targetSpeed = 0; // Desired speed based on user input

// Keyboard Input
const keys = { w: false, a: false, s: false, d: false, ArrowUp: false, ArrowLeft: false, ArrowDown: false, ArrowRight: false, Space: false };
window.addEventListener('keydown', (e) => {
    if (e.key === 'w' || e.key === 'ArrowUp') keys.w = true;
    if (e.key === 'a' || e.key === 'ArrowLeft') keys.a = true;
    if (e.key === 's' || e.key === 'ArrowDown') keys.s = true;
    if (e.key === 'd' || e.key === 'ArrowRight') keys.d = true;
});
window.addEventListener('keyup', (e) => {
    if (e.key === 'w' || e.key === 'ArrowUp') keys.w = false;
    if (e.key === 'a' || e.key === 'ArrowLeft') keys.a = false;
    if (e.key === 's' || e.key === 'ArrowDown') keys.s = false;
    if (e.key === 'd' || e.key === 'ArrowRight') keys.d = false;
});


function update() {
  if (car) {
      // Determine target speed based on user input
      if (keys.w) {
          targetSpeed = -maxSpeed; // Accelerate forward
      } else if (keys.s) {
          targetSpeed = maxSpeed / 2; // Reverse at half speed
      } else {
          targetSpeed = 0; // Decelerate to stop
      }

      // Gradually adjust carSpeed towards targetSpeed
      if (carSpeed < targetSpeed) {
        if (keys.s){
          carSpeed += acceleration * 2.5; // Accelerate
          carSpeed = Math.min(carSpeed, targetSpeed); // Clamp to targetSpeed
        }
        else {
          carSpeed += acceleration; // Accelerate
          carSpeed = Math.min(carSpeed, targetSpeed); // Clamp to targetSpeed
        }
      } else if (carSpeed > targetSpeed) {
          carSpeed -= deceleration; // Decelerate
          carSpeed = Math.max(carSpeed, targetSpeed); // Clamp to targetSpeed
      }

      // Apply movement to the car
      const forwardDirection = new THREE.Vector3(0, 0, -1).applyQuaternion(car.quaternion);
      car.position.add(forwardDirection.multiplyScalar(carSpeed * 0.01)); // Adjust multiplier for realistic movement

      // Only allow turning if the car is moving
      if (carSpeed !== 0) {
        if (keys.w) {
          if (keys.a) turnAngle += turnSpeed;
          if (keys.d) turnAngle -= turnSpeed;
        }
        else if (keys.s && carSpeed >= 0) {
          if (keys.a) turnAngle -= turnSpeed;
          if (keys.d) turnAngle += turnSpeed;
        }
        else {
          if (keys.a) turnAngle += turnSpeed;
          if (keys.d) turnAngle -= turnSpeed;
        }
      }

      // Apply rotation to the car
      car.rotation.y += turnAngle;

      // Reset turn angle
      turnAngle = 0;

      // Rotate wheels for forward/backward movement
      wheels.forEach((wheel) => {
          if (carSpeed !== 0) {
              wheel.rotation.x -= carSpeed * 0.02; // Adjust multiplier for rolling speed
          }
      });

      // Steer wheels for turning (front wheels only)
      wheels.forEach((wheel) => {
        if (wheel.name.includes('front')) { // Check your model naming
          if (keys.a) {
            wheel.rotation.y = 0.1; // Turn left (consistent value)
          } else if (keys.d) {
            wheel.rotation.y = -0.1; // Turn right (consistent value)
          } else {
            wheel.rotation.y = 0; // Reset steering
          }
        }
      });

      // Camera Follow (unchanged)
      const targetCameraPosition = car.position.clone().add(
          cameraOffset.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), car.rotation.y)
      );
      camera.position.lerp(targetCameraPosition, cameraLag);
      camera.lookAt(car.position);

      // Update Speedometer
      updateSpeedometer(Math.abs(carSpeed)); // Use absolute value for speedometer
  }
}

// Update Speedometer
function updateSpeedometer(speed) {
  const needle = document.getElementById('needle');
  const speedText = document.getElementById('speed-text');

  // Calculate needle rotation (0 to 180 degrees)
  const rotation = (speed / maxSpeed) * 180 - 90; // Map speed to -90deg to 90deg
  needle.style.transform = `rotate(${rotation}deg)`;

  // Update speed text
  speedText.textContent = `${Math.round(speed) * 5} mph`;
}

// Render Loop
function animate() {
    requestAnimationFrame(animate);
    update();
    renderer.render(scene, camera);
}
animate();

// Handle Window Resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Show Three.js scene when "Start Driving" is clicked
const startButton = document.getElementById('start-button');
const welcomeScreen = document.getElementById('welcome-screen');

startButton.addEventListener('click', () => {
  welcomeScreen.style.display = 'none'; // Hide welcome screen
  renderer.domElement.style.display = 'block'; // Show canvas
  animate(); // Start animation
});