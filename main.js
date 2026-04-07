/**
 * 3D Boid Simulation using Three.js
 * 
 * This script creates a 3D simulation of a leader boid following a cubic Bézier curve,
 * along with additional boids that follow the leader using flocking behavior.
 */

import * as THREE from 'three';
import Boid from './boid.js';
import GUI from 'lil-gui';
import BoidConfig, { SteeringConfig, SpawningConfig, RenderingConfig }  from './boid_config';
import SceneSetup from './scene_setup.js';
import WorldConfig from './world_config.js';
import ResizeSystem from './resize_system.js';

const container = document.getElementById('app'); 

// Create the scene
const worldConfig = new WorldConfig();
const sceneSetup = new SceneSetup(worldConfig, container);
const resizeSystem = new ResizeSystem(sceneSetup);
const { scene, camera, renderer } = sceneSetup;

// TODO: Change leader behavior in separate file
/**
 * Base points for the leader trajectory's spline curve.
 * Defined once at the top level so it can be reused in the resize handler.
 */
const basePoints = [
    [294, 441, -454],
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

const curve = new THREE.CatmullRomCurve3(
    basePoints.map(p => new THREE.Vector3(
        p[0] * resizeSystem.sceneSetup.config.scaleFactor,
        p[1] * resizeSystem.sceneSetup.config.scaleFactor,
        p[2] * resizeSystem.sceneSetup.config.scaleFactor
    ))
);

// Visualize the leader's path as a faint line — only visible in debug mode
const pathLine = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(curve.getPoints(200)),
    new THREE.LineBasicMaterial({ color: 0x0000ff, opacity: 0.3, transparent: true })
);
pathLine.visible = false;
scene.add(pathLine);

// Array to store boids
const boids = [];

/**
 * Creates the leader boid with specific movement parameters.
 */
const leader = new Boid(new BoidConfig({
    isLeader:  true,
    rendering: new RenderingConfig({ meshColor: 0x0000ff }),
}));
leader.active = false; // Controls whether boids follow this leader
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
        boids.forEach(boid => {
            if (boid.steering) boid.steering[key] = value;
            else boid[key] = value;
        });
    });
});

/**
 * Initializes additional boids and adds them to the scene.
 */
for (let i = 0; i < 100; i++) {
    const { width, height } = sceneSetup.visibleSizeAtDepth(worldConfig.position.z);
    const boid = new Boid(new BoidConfig({
        spawning: new SpawningConfig({
            spawnRangeX: [-width / 2,  width / 2],
            spawnRangeY: [-height / 2, height / 2],
            spawnRangeZ: [0, 500],
        })
    }));
    boids.push(boid);
    scene.add(boid.mesh);
}

/**
 * Toggle leader button — hides the leader mesh and stops boids from following it.
 */
let leaderVisible = true;
document.getElementById('toggle-leader').addEventListener('click', () => {
    leaderVisible = !leaderVisible;
    leader.mesh.visible = leaderVisible;
    leader.active = leaderVisible;
    document.getElementById('toggle-leader').style.opacity = leaderVisible ? 1 : 0.4;

});

/**
 * Debug mode — shows the leader path line
 */
let debugMode = false;
document.getElementById('toggle-debug').addEventListener('click', () => {
    debugMode = !debugMode;
    pathLine.visible = debugMode;
    document.getElementById('toggle-debug').style.opacity = debugMode ? 1 : 0.4;
});


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
    let deltaTime = (now - lastUpdateTime) / (worldConfig.targetFrameMs * 1000);
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
        boid.mainBoidUpdateLoop(camera, boids, leader);
    }

    // Render the scene
    renderer.render(scene, camera);
}

// Start the animation loop
animate();