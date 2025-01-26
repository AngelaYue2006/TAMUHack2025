import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { loadParkingLots } from './map.js';
import { vehicleData } from './cars.js';

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

let activeCarName = null; // Track the name of the active collision box
let selectedCarName = null;

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

// Car Movement and Speed Variables
let turnSpeed = 0.015;
let turnAngle = 0;
let carSpeed = 0; // Speed in mph
let maxSpeed = 20; // Maximum speed for the speedometer
let acceleration = 0.02; // Rate of acceleration
let deceleration = 0.03; // Rate of deceleration
let targetSpeed = 0; // Desired speed based on user input

//Creating variable for the coordinate tracker
// Toggle variable for coordinate display
let isCoordinateDisplayVisible = false;
// Reference the coordinate display div
const coordinateDisplay = document.getElementById('coordinate-display');

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

// Create a bounding box for the car
const carBoundingBox = new THREE.Box3();
// Create an array to store bounding boxes for barriers/fences
const barrierBoundingBoxes = [];

// Function to update the car's bounding box
function updateCarBoundingBox() {
    if (car) {
        carBoundingBox.setFromObject(car);
    }
}

// Physical collision barrier
// IF HAVE TIME *******
// const barrier = new THREE.Mesh(
//   new THREE.BoxGeometry(20, 20, 20),
//   new THREE.MeshStandardMaterial({ color: 0xff0000 })
// );
// barrier.name = 'barrier'; // Assign a name
// barrier.position.set(20, 5, 60);
// scene.add(barrier);

// Example: Add bounding boxes for barriers/fences
scene.traverse((object) => {
  if (object.isMesh && (object.name.includes('barrier'))) {
    const boundingBox = new THREE.Box3().setFromObject(object);
    barrierBoundingBoxes.push(boundingBox);
  }
});

function handleCollision(barrierBox) {
  carSpeed = 0;
}

// CAR BOUNDING BOX DEBUG *******
// const carBoxHelper = new THREE.Box3Helper(carBoundingBox, 0xff0000);
// scene.add(carBoxHelper);

// Car Switch Box Display
const carSwitchDisplays = [
  { x: 23.1, y: 0, z: 87.3, name: "corrolla2" }, //left 1
  { x: 30.1, y: 0, z: 87.3, name: "prius2" },
  { x: 37, y: 0, z: 87.3, name: "rav42"  },
  { x: 41.7, y: 0, z: 87.3, name: "highlander2" },
  { x: 50, y: 0, z: 87.3, name: "tacoma2" },
  { x: 66.2, y: 0, z: 87.3, name: "bz4x2" },
  { x: 23, y: 0, z: 110, name: "camry2"}, // right 1
  { x: 27.56, y: 0, z: 110, name: "supra2"},
  { x: 43.76, y: 0, z: 110, name: "4runner2"},
  { x: 49.8, y: 0, z: 110, name: "sienna2"},
  { x: 54.4, y: 0, z: 110, name: "tundra2"},
  { x: 68.4, y: 0, z: 110, name: "mirai2"}
  // Add more coordinates as needed
];

const carSwitchCollisions = [
  { x: 23, y: 0, z: 87.4, name: "corrolla2" }, // left 1
  { x: 30, y: 0, z: 87.4, name: "prius2" },
  { x: 36.9, y: 0, z: 87.4, name: "rav42" },
  { x: 41.6, y: 0, z: 87.4, name: "highlander2" },
  { x: 49.9, y: 0, z: 87.4, name: "tacoma2" },
  { x: 66.1, y: 0, z: 87.4, name: "bz4x2" },
  { x: 23, y: 0, z: 110, name: "camry2"}, // right 1
  { x: 27.56, y: 0, z: 110, name: "supra2"},
  { x: 43.76, y: 0, z: 110, name: "4runner2"},
  { x: 49.8, y: 0, z: 110, name: "sienna2"},
  { x: 54.4, y: 0, z: 110, name: "tundra2"},
  { x: 68.4, y: 0, z: 110, name: "mirai2"}
  // Add more coordinates and names as needed
];

const collisionBoxes = []; // Array to store collision boxes

// Material for the outlines
const outlineMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });

// Loop through carSwitchDisplays and create display boxes
const displayBoxes = carSwitchDisplays.map((position) => {
  const boxGeometry = new THREE.BoxGeometry(2.5, 0.5, 4.5);
  const edgesGeometry = new THREE.EdgesGeometry(boxGeometry);
  const detector = new THREE.LineSegments(edgesGeometry, outlineMaterial);
  detector.name = `Car Switch Display - ${position.name}`;
  detector.position.set(position.x, position.y, position.z);
  detector.visible = false; // Initially hide the display box
  scene.add(detector);
  return detector;
});

// Loop through carSwitchCollisions and create collision boxes
carSwitchCollisions.forEach((position, index) => {
  const boxGeometry = new THREE.BoxGeometry(4, 2, 16);
  const edgesGeometry = new THREE.EdgesGeometry(boxGeometry);
  const detector = new THREE.LineSegments(edgesGeometry, outlineMaterial);
  detector.name = `Car Switch Collision - ${position.name}`;
  detector.position.set(position.x, position.y, position.z);

  // Link the collision box to its respective display box
  collisionBoxes.push({
    collisionBox: detector,
    displayBox: displayBoxes[index], // Use the same index to link them
  });
});

const boxGeometry1 = new THREE.BoxGeometry(4, 2, 8);
const edgesGeometry1 = new THREE.EdgesGeometry(boxGeometry1);
const detector1 = new THREE.LineSegments(edgesGeometry1, outlineMaterial);

// Get the HTML element
const infoMessage = document.getElementById('info-message');
// Variable to track if the car is colliding with the detector
let isCollidingWithDetector = false;

function checkCollisions() {
    updateCarBoundingBox(); // Update the car's bounding box

    for (const barrierBox of barrierBoundingBoxes) {
      if (carBoundingBox.intersectsBox(barrierBox)) {
          // Handle collision with the specific barrier
          handleCollision(barrierBox);
          break; // Exit loop after first collision
      }
    }

    // Hide all display boxes initially
  displayBoxes.forEach((displayBox) => {
    displayBox.visible = false;
  });

  // Track if the car is colliding with any collision box
  let isColliding = false;

  // Loop through all collision boxes
  for (const { collisionBox, displayBox } of collisionBoxes) {
    const detectorBox = new THREE.Box3().setFromObject(collisionBox);
    if (carBoundingBox.intersectsBox(detectorBox)) {
      isColliding = true;
      // Show only the first collided display box
      displayBox.visible = true;
      activeCarName = collisionBox.name.replace('Car Switch Collision - ', '');
      // Exit the loop after the first collision is detected
      break;
    }
  }

  // If no collisions are detected, reset the active car name
  if (!isColliding) {
    activeCarName = null;
  }

  // Show/hide the info message based on collision
  if (isColliding) {
    infoMessage.style.display = 'block';
    isCollidingWithDetector = true;
  } else {
    infoMessage.style.display = 'none';
    isCollidingWithDetector = false;
  }
}

function reloadCarModel(modelName) {
  // Remove the current car from the scene
  if (car) {
    scene.remove(car);
  }

  // Find the vehicle data for the active car
  const activeCarData = vehicleData.find(vehicle => vehicle[0] === modelName);

  if (!activeCarData) {
    console.error(`No data found for car: ${modelName}`);
    return;
  }

  // Update movement and speed variables
  maxSpeed = activeCarData[4]; // maxSpeed
  turnSpeed = activeCarData[5]; // turnSpeed
  acceleration = activeCarData[6]; // acceleration
  deceleration = activeCarData[7]; // deceleration

  // Load the new car model
  loader.load(`/${modelName}.glb`, (gltf) => {
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
    wheels = []; // Reset wheels array
    car.traverse((child) => {
      if (child.isMesh && child.name.includes('wheel')) {
        wheels.push(child);
      }
    });

    // Position the car and trigger drop-in effect
    car.position.copy(initialCarPosition);
    car.rotation.y = Math.PI / 2; // Rotate the car 90 degrees (in radians)
    car.scale.set(0.25, 0.25, 0.25);
    carSpeed = 0;
    dropIn(); // Trigger drop-in effect
  }, undefined, (error) => {
    console.error(`Error loading ${modelName} model:`, error);
  });
}
// Get the popup and overlay elements
const carInfoPopup = document.getElementById('car-info-popup');
const overlay = document.getElementById('overlay');
const carInfoContent = document.getElementById('car-info-content');
const closePopupButton = document.getElementById('close-popup');

// Variable to store car data (will be loaded from CSV)
let carData = [];

// Function to fetch and parse the CSV
function loadCarData() {
  Papa.parse('/public/vehicle_data.csv', {
    download: true,
    header: true,
    complete: function(results) {
      carData = results.data;
    },
    error: function(error) {
      console.error("Error parsing CSV file: ", error);
    }
  });
}

// Function to populate the popup with car information
function populateCarInfo(car) {
  // Example of displaying car information in the popup
  carInfoContent.innerHTML = `
    <strong>Model:</strong> ${car.Model} <br>
    <strong>Price:</strong> $${car.Price} <br>
    <strong>Max Speed:</strong> ${car.maxSpeed} mph <br>
    <strong>Horsepower:</strong> ${car.Horsepower} hp <br>
    <strong>Fuel Economy:</strong> ${car['Fuel Economy (MPG)']} MPG <br>
    <strong>Description:</strong> ${car.Description} <br>
  `;
}


// Handle keyboard input
window.addEventListener('keydown', (e) => {
  if (isCollidingWithDetector) {
    if (e.key === 'i') {
      // Ensure activeCarName is defined before using it
      if (!activeCarName) {
        console.log('No active car selected');
        return;
      }

      // Find car data based on activeCarName
      const carRow = vehicleData.find(row => row[0] === activeCarName); // The first column contains the file name

      if (carRow) {
        console.log('Car found:', carRow);

        // Extract the car data from the row (e.g., carRow[0] = File Name, carRow[1] = Type, etc.)
        const carInfo = {
          "FileName": carRow[0],
          "Type": carRow[1],
          "Price": carRow[2],
          "Model": carRow[3],
          "maxSpeed": carRow[4],
          "turnSpeed": carRow[5],
          "acceleration": carRow[6],
          "deceleration": carRow[7],
          "Fuel": carRow[8],
          "Seats": carRow[9],
          "Fuel Economy (MPG)": carRow[10],
          "Fuel Tank": carRow[11],
          "Range": carRow[12],
          "Horsepower": carRow[13],
          "Steering diameter (ft)": carRow[14],
          "Safety Features": carRow[15],
          "Description": carRow[16]
        };

        // Populate the popup with car info
        carInfoContent.innerHTML = `
          <strong>Model:</strong> ${carInfo.Model} <br>
          <strong>Price:</strong> ${carInfo.Price} <br>
          <strong>Max Speed:</strong> ${carInfo.maxSpeed} mph <br>
          <strong>Horsepower:</strong> ${carInfo.Horsepower} hp <br>
          <strong>Fuel Economy:</strong> ${carInfo['Fuel Economy (MPG)']} MPG <br>
          <strong>Description:</strong> ${carInfo.Description} <br>
        `;

        // Show the popup and overlay
        carInfoPopup.style.display = 'block';
        overlay.style.display = 'block';
      } else {
        console.log('Car not found in data');
      }
    } else if (e.key === 'u' && activeCarName) {
      // Reload the car model
      reloadCarModel(activeCarName);
      selectedCarName = activeCarName;
    }
  }
});

// Close the popup when the X button is clicked
closePopupButton.addEventListener('click', () => {
  carInfoPopup.style.display = 'none';
  overlay.style.display = 'none';
});

// Close the popup when clicking outside of it
overlay.addEventListener('click', () => {
  carInfoPopup.style.display = 'none';
  overlay.style.display = 'none';
});


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
        // Find the vehicle data for the active car
        const activeCarData = vehicleData.find(vehicle => vehicle[0] === selectedCarName);
        if (!activeCarData) {
          maxSpeed = 20;
        }
        else {
          maxSpeed = activeCarData[4];
        }
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

// Show Three.js scene when "Start Driving" is clicked
const startButton = document.getElementById('start-button');
const welcomeScreen = document.getElementById('welcome-screen');

startButton.addEventListener('click', () => {
  welcomeScreen.style.display = 'none'; // Hide welcome screen
  renderer.domElement.style.display = 'block'; // Show canvas
  animate(); // Start animation
});