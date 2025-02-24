/**
 * Boid Simulation using Three.js
 * 
 * This script creates a 3D simulation of a leader boid following a cubic Bézier curve,
 * along with additional boids that follow the leader using flocking behavior.
 */

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.module.js';
import Boid from './boid_v2.js';
import GUI from 'https://cdn.jsdelivr.net/npm/lil-gui@0.19.0/dist/lil-gui.esm.min.js';

// Create the scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

/**
 * Creates a perspective camera for the scene.
 * 
 * @param {number} 70 - Field of view (FOV) in degrees. Determines how wide the camera's view is.
 * @param {number} window.innerWidth / window.innerHeight - Aspect ratio of the camera.
 * @param {number} 1 - Near clipping plane. Objects closer than this distance won't be rendered.
 * @param {number} 10000 - Far clipping plane. Objects farther than this distance won't be rendered.
 * 
 * A higher FOV makes the view appear more distorted (wide-angle), while a lower FOV gives a zoomed-in effect.
 */
const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 10000);
camera.position.set(0, 250, 1000);

// Create the renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

/**
 * Creates an adaptive Catmull-Rom curve that scales with the window size.
 */
/**
 * Creates an adaptive Catmull-Rom curve that scales with the window size.
 */
const basePoints = [
    [494, 528, -145], [-88, 256, 207], [-355, 280, 547],
    [-409, 551, -12], [-222, 400, -97], [37, 47, 246],
    [641, 120, -228], [585, 528, -342]
];
const scaleFactor = Math.min(window.innerWidth, window.innerHeight) / 500;
const curve = new THREE.CatmullRomCurve3(basePoints.map(p => new THREE.Vector3(p[0] * scaleFactor, p[1] * scaleFactor, p[2] * scaleFactor)));

/**
 * Creates the leader boid with specific movement parameters.
 */
const leader = new Boid(0.5, 0.5, 0.5, 10, 10, 5, true);
scene.add(leader.mesh);


// Array to store boids
const boids = [];
boids.push(leader);

const gui = new GUI();
const boidSettings = {
    alignmentCoefficient: 1,
    cohesionCoefficient: 0.001,
    separationCoefficient: 0.5,
    alignmentRadius: 2000, 
    cohesionRadius: 2000,
    separationRadius: 40
};

// Define parameter ranges
const settingRanges = {
    alignmentCoefficient: [0, 1],
    cohesionCoefficient: [0, 1],
    separationCoefficient: [0, 1],
    alignmentRadius: [0, 2000],
    cohesionRadius: [0, 2000],
    separationRadius: [0, 100]
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
for (let i = 0; i < 100; i++) {
    const boid = new Boid(
        boidSettings.alignmentCoefficient,
        boidSettings.cohesionCoefficient,
        boidSettings.separationCoefficient,
        boidSettings.alignmentRadius,
        boidSettings.cohesionRadius,
        boidSettings.separationRadius);

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
        timeElement.innerText = `Elapsed Time: ${formatTime(currentTime * 10)}`;
    }
}, 10);

/**
 * Animation loop to update the scene and move boids.
 */
function animate() {
    requestAnimationFrame(animate);

    let now = performance.now();
    let deltaTime = (now - lastUpdateTime) / 10000; // Convert to seconds
    lastUpdateTime = now;

    currentTime = (currentTime + deltaTime) % 1;


    // Update leader position along the curve
    const prevPosition = leader.position.clone();
    leader.position.copy(curve.getPointAt(currentTime));
    leader.speed.copy(leader.position.clone().sub(prevPosition));
    leader.updateBoidScale(camera);
    leader.rotateTowardsDirection(camera);
    leader.mesh.position.copy(leader.position);

    // Update all boids
    for (let boid of boids) {
        boid.updateBoidProperties(camera, boids);
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
    const newScaleFactor = Math.min(window.innerWidth, window.innerHeight) / 500;
    curve.points.forEach((point, index) => {
        const basePoints = [
            [494, 528, -145], [-88, 256, 207], [-355, 280, 547],
            [-409, 551, -12], [-222, 400, -97], [37, 47, 246],
            [641, 120, -228], [585, 528, -342]
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
