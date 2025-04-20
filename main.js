/**
 * 3D Boid Simulation using Three.js
 * 
 * This script creates a 3D simulation of a leader boid following a cubic Bézier curve,
 * along with additional boids that follow the leader using flocking behavior.
 */

import * as THREE from 'three';
import Boid from './boid.js';
import GUI from 'lil-gui';

// Create the scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

/**
 * Creates a perspective camera for the scene.
 * 
 * @param {number} 50 - Field of view (FOV) in degrees. Determines how wide the camera's view is.
 * @param {number} window.innerWidth / window.innerHeight - Aspect ratio of the camera.
 * @param {number} 1 - Near clipping plane. Objects closer than this distance won't be rendered.
 * @param {number} 20000 - Far clipping plane. Objects farther than this distance won't be rendered.
 * 
 * A higher FOV makes the view appear more distorted (wide-angle), while a lower FOV gives a zoomed-in effect.
 */
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 2000);

camera.position.set(0, 250, 1000);

// Create the renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

/**
 * Base points for the leader trajectory's **spline curve**.
 */
const basePoints = [[294, 441, -454],
[110, 11, -300],
[1000, -400, -500],
[959, 0, -228],
[-562, 784, -100],
[-478, 175, 212],
[300, 784, -256],
[294, 441, -454],
[-1145, -299, -679],
[-856, 372, -871],
[-100, 830, -742],
[165, 679, -620],
[294, 441, -454]
];

const scaleFactor = Math.min(window.innerWidth, window.innerHeight) / 1000;
const curve = new THREE.CatmullRomCurve3(basePoints.map(p => new THREE.Vector3(p[0] * scaleFactor, p[1] * scaleFactor, p[2] * scaleFactor)));

// Array to store boids
const boids = [];

/**
 * Creates the leader boid with specific movement parameters.
 */

const leader = new Boid(0.5, 0.5, 0.5, 10, 10, 10, 5, 2, true);
boids.push(leader);
scene.add(leader.mesh);


const gui = new GUI();
const boidSettings = {
    alignmentCoefficient: 0.009,
    cohesionCoefficient: 0.000003,
    separationCoefficient: 0.1,
    followLeaderCoefficient: 20,
    alignmentRadius: 80,
    cohesionRadius: 80,
    separationRadius: 40,
    turnFactor: 0.05,
};

// Define parameter ranges
const settingRanges = {
    alignmentCoefficient: [0, 1],
    cohesionCoefficient: [0, 0.1],
    separationCoefficient: [0, 1],
    followLeaderCoefficient: [0.1, 100],
    alignmentRadius: [0, 1000],
    cohesionRadius: [0, 1000],
    separationRadius: [0, 200],
    turnFactor: [0, 5]
};

// Create GUI dynamically
Object.entries(settingRanges).forEach(([key, [min, max]]) => {
    gui.add(boidSettings, key, min, max).onChange(value => {
        boids.forEach(boid => boid[key] = value);
    });
});


/**
 * Initializes additional boids and adds them to the scene.
 * Currently, the loop is set to zero boids (change the loop condition to add more).
 */
for (let i = 0; i < 250; i++) {
    const boid = new Boid(
        boidSettings.alignmentCoefficient,
        boidSettings.cohesionCoefficient,
        boidSettings.separationCoefficient,
        boidSettings.followLeaderCoefficient,
        boidSettings.alignmentRadius,
        boidSettings.cohesionRadius,
        boidSettings.separationRadius,
        boidSettings.turnFactor,
        false);

    boids.push(boid);
    scene.add(boid.mesh);
}


let currentTime = 0;
let lastUpdateTime = performance.now();

/**
 * Formats elapsed time in seconds.
 * @param {number} seconds - The time in seconds.
 * @returns {string} - The formatted time string.
 */
function formatTime(seconds) {
    return seconds.toFixed(2) + 's';

}

// Update the elapsed time display every 10ms
setInterval(() => {
    const timeElement = document.getElementById('elapsed-time');
    if (timeElement) {
        timeElement.innerText = `Elapsed Time: ${formatTime(currentTime * 10)} | Leader coords: (${leader.position.x.toFixed(0)}, ${leader.position.y.toFixed(0)}, ${leader.position.z.toFixed(0)})`;
    }
}, 10);

/**
 * Animation loop to update the scene and move boids.
 */
function animate() {
    requestAnimationFrame(animate);

    let now = performance.now();
    let deltaTime = (now - lastUpdateTime) / 33000; // Convert to seconds
    lastUpdateTime = now;

    currentTime = (currentTime + deltaTime) % 1;


    const prevPosition = leader.position.clone();
    leader.position.copy(curve.getPointAt(currentTime));
    leader.speed.copy(leader.position.clone().sub(prevPosition));
    leader.updateBoidScale(camera);
    leader.rotateTowardsDirection(camera);
    leader.mesh.position.copy(leader.position);

    // Update all boids
    for (let boid of boids) {
        boid.updateBoidProperties(camera, boids, leader);
    }

    // Render the scene
    renderer.render(scene, camera);
}

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);

    // Update curve dynamically on resize
    const newScaleFactor = Math.min(window.innerWidth, window.innerHeight) / 1000;
    curve.points.forEach((point, index) => {
        const basePoints = [[294, 441, -454],
        [110, 11, -300],
        [1000, -400, -500],
        [959, 0, -228],
        [-562, 784, -100],
        [-478, 175, 212],
        [300, 784, -256],
        [294, 441, -454],
        [-1145, -299, -679],
        [-856, 372, -871],
        [-100, 830, -742],
        [165, 679, -620],
        [294, 441, -454]
        ];
        point.set(
            basePoints[index][0] * newScaleFactor,
            basePoints[index][1] * newScaleFactor,
            basePoints[index][2] * newScaleFactor
        );
    });
});

// Start the animation loop
animate();
