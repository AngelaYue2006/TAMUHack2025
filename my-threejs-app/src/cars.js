import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import Papa from 'papaparse';

// Object to store car data and models
const carDataMap = {};

// Create a GLTFLoader instance
const loader = new GLTFLoader();

// Function to load car data from CSV
function loadCarData() {
    Papa.parse('/vehicle_data.csv', {
        download: true,
        header: true,
        dynamicTyping: true,
        complete: function(results) {
            results.data.forEach(row => {
                const carName = row['File Name'];
                carDataMap[carName] = {
                    type: row['Type'],
                    model: row['Model'],
                    price: row['Price'],
                    seats: row['Seats'],
                    fuelEconomy: row['Fuel Economy (MPG)'],
                    fuelTank: row['Fuel Tank'],
                    range: row['Range'],
                    horsepower: row['Horsepower'],
                    steeringDiameter: row['Steering diameter (ft)'],
                    drag: row['Drag'],
                    weight: row['Weight (lbs)'],
                    safetyFeatures: row['Safety Features'],
                    description: row['Description ex. leather seats, heating... (FWD)'],
                    glbFile: `/${carName}.glb`, // Assuming the GLB files are named after the car names
                    modelObject: null // Placeholder for the loaded 3D model
                };
            });
            console.log('Car data loaded:', carDataMap);
        }
    });
}

// Function to switch cars
function switchCar(carName) {
    if (carDataMap[carName]) {
        // Remove current car from the scene if it exists
        if (window.currentCar) {
            window.scene.remove(window.currentCar);
        }

        // Load the new car model
        loader.load(carDataMap[carName].glbFile, (gltf) => {
            const carModel = gltf.scene;
            carModel.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });

            // Add the new car to the scene
            window.currentCar = carModel;
            window.scene.add(window.currentCar);
            console.log(`Switched to ${carName}`);
        }, undefined, (error) => {
            console.error(`Error loading model for ${carName}:`, error);
        });
    } else {
        console.error(`Car ${carName} not found in carDataMap.`);
    }
}

// Initialize car data
loadCarData();

// Export functions and data
export { carDataMap, switchCar, loader };