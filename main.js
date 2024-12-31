import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.module.js';
import Boid from './boid.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 10);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);


// Create a Boid instance and add its mesh to the scene
const boids = []
for (let i = 0; i < 1000; i++){
    const boid = new Boid();
    boids.push(boid);
    scene.add(boid.mesh);
   // scene.add(boid.speedArrow);
    //scene.add(boid.accelerationArrow);
}

// Set initial camera position
camera.position.z = 10;

let currentTime = 0;
let deltaT = 0.01;

// Function to format time in seconds
function formatTime(seconds) {
    return `${seconds.toFixed(2)}s`;
}

// Update the elapsed time every second
setInterval(() => {
    currentTime += deltaT;
    const timeElement = document.getElementById('elapsed-time');
    timeElement.innerText = `Elapsed Time: ${formatTime(currentTime)}`;
}, 10);

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    // Update boid
    for(let boid of boids){
        boid.flock(boids);
        boid.update(camera);
    }

    renderer.render(scene, camera);
}

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Start animation
animate();
