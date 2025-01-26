import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.module.js';
import Boid from './boid.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 10);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);


// Create a cubic Bézier curve
const curve = new THREE.CubicBezierCurve3(
    new THREE.Vector3(3, 2, 0),
    new THREE.Vector3(-2, -4, 1),
    new THREE.Vector3(-3, -2, 4),
    new THREE.Vector3(3, 2, 0)
);

// Create a leader boid
const leader = new Boid(0.005, 0.02, 0.2, 0.075, 0.1, true, false, true);
scene.add(leader.mesh);

//scene.add(leader.accelerationArrow);
//scene.add(leader.speedArrow);


// Create a Boid instance and add its mesh to the scene
const boids = []
for (let i = 0; i < 100; i++){
    const boid = new Boid();
    boids.push(boid);
    scene.add(boid.mesh);
    //scene.add(boid.accelerationArrow);
    //scene.add(boid.speedArrow);
}

// Set initial camera position
camera.position.z = 10;

let currentTime = 0;
let deltaT = 0.0025;

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

    if(currentTime > 1) currentTime = 0;

     // Update leader position along the curve
     leader.position.copy(curve.getPointAt(currentTime));
     leader.speed.copy(leader.position);
     leader.rotateTowardsDirection();
     leader.update(camera);
 
    // Update boids
    for(let boid of boids){
        boid.flock(boids, leader, curve, currentTime);
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
