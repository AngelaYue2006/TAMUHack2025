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

// Drop-in effect variables
const initialDropHeight = 3; // Height from which the car drops
let isDropping = true; // Whether the car is currently dropping

// Initial spawn position
const initialCarPosition = new THREE.Vector3(20, initialDropHeight, 98.5);

// Gravity and jump variables
const gravity = 0.005; // Gravity pull
let jumpVelocity = 0; // Initial vertical speed
let canJump = true; // Allow jump when grounded

// Drop-in effect
function dropIn() {
    if (car) {
        car.position.copy(initialCarPosition); // Set initial height
        isDropping = true; // Enable dropping
    }
}

// Apply gravity
function applyGravity() {
    if (car) {
        // Apply gravity
        car.position.y += jumpVelocity; // Apply vertical movement
        jumpVelocity -= gravity; // Decrease vertical speed (simulate gravity)

        // Reset when car lands
        if (car.position.y <= 1) { // Ground level
            car.position.y = 1; // Snap to ground
            jumpVelocity = 0; // Stop vertical movement
            canJump = true; // Allow jumping again
            isDropping = false; // Stop dropping
        }
    }
}

// Reset car to initial position
function resetCar() {
    if (car) {
        car.position.copy(initialCarPosition); // Reset position
        car.rotation.y = Math.PI / 2; // Rotate the car 90 degrees (in radians)
        carSpeed = 0; // Reset speed
        targetSpeed = 0; // Reset target speed
        dropIn(); // Trigger drop-in effect
    }
}

// Adjust the path to the GLB file
loader.load('/mirai2.glb', (gltf) => {
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

    // Position the car and trigger drop-in effect
    car.position.copy(initialCarPosition);
    car.rotation.y = Math.PI / 2; // Rotate the car 90 degrees (in radians)
    car.scale.set(0.25, 0.25, 0.25);
    dropIn(); // Trigger drop-in effect
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
let maxSpeed = 20; // Maximum speed for the speedometer
const acceleration = 0.02; // Rate of acceleration
const deceleration = 0.03; // Rate of deceleration
let targetSpeed = 0; // Desired speed based on user input

//Creating variable for the coordinate tracker
// Toggle variable for coordinate display
let isCoordinateDisplayVisible = false;
// Reference the coordinate display div
const coordinateDisplay = document.getElementById('coordinate-display');

// Initialize compass angle
let compassAngle = 0;

// Keyboard Input
const keys = { w: false, a: false, s: false, d: false, ArrowUp: false, ArrowLeft: false, ArrowDown: false, ArrowRight: false, Space: false, r: false };
window.addEventListener('keydown', (e) => {
    if (e.key === 'w' || e.key === 'ArrowUp') keys.w = true;
    if (e.key === 'a' || e.key === 'ArrowLeft') keys.a = true;
    if (e.key === 's' || e.key === 'ArrowDown') keys.s = true;
    if (e.key === 'd' || e.key === 'ArrowRight') keys.d = true;
    if (e.key === ' ') keys.Space = true;
    if (e.key === 'r' || e.key === 'R') keys.r = true; // Add "R" key
    if (e.key === '1') { //Checking to toggle the coordinates
      isCoordinateDisplayVisible = !isCoordinateDisplayVisible;
      coordinateDisplay.style.display = isCoordinateDisplayVisible ? 'block' : 'none';
    }
    if (e.key === '2') {
      toggleCompass();
    }
});

window.addEventListener('keyup', (e) => {
    if (e.key === 'w' || e.key === 'ArrowUp') keys.w = false;
    if (e.key === 'a' || e.key === 'ArrowLeft') keys.a = false;
    if (e.key === 's' || e.key === 'ArrowDown') keys.s = false;
    if (e.key === 'd' || e.key === 'ArrowRight') keys.d = false;
    if (e.key === ' ') keys.Space = false;
    if (e.key === 'r' || e.key === 'R') keys.r = false; // Add "R" key
});

// Define the boundary for the top-down view
const topDownBoundary = {
  x1: 5, // Left boundary
  z1: 82, // Front boundary
  x2: 90,  // Right boundary
  z2: 115,  // Back boundary
};

// Update function to display coordinates
function updateCoordinates() {
  if (isCoordinateDisplayVisible && car) {
      const { x, z } = car.position;
      coordinateDisplay.textContent = `X: ${z.toFixed(2)}, Y: ${x.toFixed(2)}`;
  }
}

// Function to update compass needle rotation
function updateCompass(angle) {
  const compassNeedle = document.getElementById('compass-needle');
  if (compassNeedle) {
    compassNeedle.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`;
  }
}
// Function to toggle compass visibility
function toggleCompass() {
  const compass = document.getElementById('compass');
  const compassNeedle = document.getElementById('compass-needle');

  // Get the computed display value of the compass
  const compassDisplay = window.getComputedStyle(compass).display;

  if (compassDisplay === 'none') {
    // Show the compass and needle
    compass.style.display = 'block';
    compassNeedle.style.display = 'block';
  } else {
    // Hide the compass and needle
    compass.style.display = 'none';
    compassNeedle.style.display = 'none';
  }
}

// Update function
function update() {
  if (car) {
      // Handle reset when "R" is pressed
      if (keys.r) {
          resetCar();
          keys.r = false; // Prevent continuous reset
      }

      // Apply gravity and drop-in effect
      if (isDropping) {
          applyGravity();
      }

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

        
        // Calculate compass angle (convert radians to degrees)
        let compassAngle = THREE.MathUtils.radToDeg(car.rotation.y);

        // Adjust for the car's initial rotation (90 degrees offset)
        compassAngle -= 90; // Subtract 90 degrees to align the compass

        // Invert the angle to fix East/West being backwards
        compassAngle *= -1;

        // Normalize the angle to a range of 0–360 degrees
        compassAngle = (compassAngle + 360) % 360;

        // Update the compass needle
        updateCompass(compassAngle);


      }


      // Handle jump when Space is pressed
      if (keys.Space && canJump) {
          jumpVelocity = 0.15; // Initial jump speed
          canJump = false; // Prevent multiple jumps
      }

      // Apply gravity
      applyGravity();

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

      // Check for collisions
      checkCollisions();

      if (
        car.position.x > topDownBoundary.x1 &&
        car.position.x < topDownBoundary.x2 &&
        car.position.z > topDownBoundary.z1 &&
        car.position.z < topDownBoundary.z2
    ) {
        // Top-down view with a 90-degree rotated angle
        camera.position.set(car.position.x, 15, car.position.z);
        car.scale.set(0.6,0.6,0.6); // Move camera above the car
        camera.up.set(1, 0, 0); // Rotate the camera's up direction to change the angle
        camera.lookAt(car.position); // Look straight at the car
        maxSpeed = 5;
    } else {
        // Default follow behavior
        const targetCameraPosition = car.position.clone().add(
            cameraOffset.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), car.rotation.y)
        );
        camera.position.lerp(targetCameraPosition, cameraLag);
        car.scale.set(0.25, 0.25, 0.25);
        camera.up.set(0, 1, 0); // Reset camera's up direction for normal view
        camera.lookAt(car.position);
        maxSpeed = 20;
    }
    

      // Update Speedometer
      updateSpeedometer(Math.abs(carSpeed)); // Use absolute value for speedometer

      //Update Coordinates
      updateCoordinates()
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

// // Show Three.js scene when "Start Driving" is clicked
// const startButton = document.getElementById('start-button');
// const welcomeScreen = document.getElementById('welcome-screen');

// startButton.addEventListener('click', () => {
//   welcomeScreen.style.display = 'none'; // Hide welcome screen
//   renderer.domElement.style.display = 'block'; // Show canvas
//   animate(); // Start animation
// });
const startButton = document.getElementById('start-button');
const welcomeScreen = document.getElementById('welcome-screen');

// When "Start Driving" is clicked
startButton.addEventListener('click', () => {
  // Add the fade-out class to trigger the animation
  welcomeScreen.classList.add('fade-out');
  
  // Wait for the animation (800ms matches the CSS transition)
  setTimeout(() => {
    welcomeScreen.style.display = 'none'; // Hide the welcome screen completely
    renderer.domElement.style.display = 'block'; // Show the canvas (or Three.js scene)
    animate(); // Start animation
  }, 800);
});
