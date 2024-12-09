import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.module.js';

class Boid {
    constructor() {
        // Create a point (small sphere)
        const geometry = new THREE.SphereGeometry(0.05, 32, 32);
        const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        this.mesh = new THREE.Mesh(geometry, material);

        // Vectors
        this.position = new THREE.Vector3(
            randomInRange(-5, 0),
            randomInRange(-5, 0),
            randomInRange(-5, 0)
        );

        // Speed and Acceleration vectors
        this.speed = new THREE.Vector3(
            randomInRange(2, 4),
            randomInRange(2, 4),
            randomInRange(2, 4)
        );

        this.acceleration = new THREE.Vector3();  // Initialize acceleration as zero

        // Set initial position for the mesh
        this.mesh.position.copy(this.position);

        this.maxForce = 1;
        this.maxSpeed = 0.1;
    }

    applyForce(force) {
        this.acceleration.add(force);
        this.acceleration.clampLength(0, this.maxForce);
    }

    // Update the boid's position based on speed and acceleration
    updatePosition() {
        this.position.add(this.speed);

        this.speed.add(this.acceleration);
        this.speed.clampLength(0, this.maxSpeed);

        this.acceleration.set(0, 0, 0);

        // Set the new position of the mesh
        this.mesh.position.copy(this.position);

    }

    // Function to calculate the camera's bounds
    getCameraView(camera, dist) {
        const vFOV = THREE.MathUtils.degToRad(camera.fov);
        const height = 2 * Math.tan(vFOV / 2) * dist;
        const width = height * camera.aspect;

        return {
            width: width,
            height: height,
        };
    }

    edges(camera) {
        const cameraViewPort = this.getCameraView(camera, camera.position.distanceTo(this.position));
        if (this.position.x > cameraViewPort.width / 2) {
            this.position.x = -cameraViewPort.width / 2;
        } else if (this.position.x < -cameraViewPort.width / 2) {
            this.position.x = cameraViewPort.width / 2;
        }

        if (this.position.y > cameraViewPort.height / 2) {
            this.position.y = -cameraViewPort.height / 2;
        } else if (this.position.y < -cameraViewPort.height / 2) {
            this.position.y = cameraViewPort.height / 2;
        }

        if (this.position.z > camera.position.z / 2)
            this.position.z = 0;

    }

    // Update the boid's scale based on the camera's distance
    updateScale(camera) {
        // Calculate distance from camera
        const distance = camera.position.distanceTo(this.position);

        // Update point scale based on distance
        const scale = Math.max(0.1, 1 / distance);
        this.mesh.scale.set(scale, scale, scale);
    }

    // Main update method for the boid
    update(camera) {
        this.edges(camera);
        this.updatePosition();
        this.updateScale(camera);
    }

    align(boids) {
        let groupVelocity = new THREE.Vector3(0, 0, 0);
        let perceptionRadius = 1000;
        let total = 0;
        for (let neighbor of boids) {
            let d = this.position.distanceTo(neighbor.position);
            if (neighbor != this && d < perceptionRadius) {
                groupVelocity.add(neighbor.speed);
                total++;

            }

        }
        if (total > 0) {
            groupVelocity.divideScalar(total);
            groupVelocity.sub(this.speed);
        }
        return groupVelocity;
    }

    flock(boids) {
        let alignment = this.align(boids);
        this.applyForce(alignment);
    }
}

// Helper function to generate a random value within a range
function randomInRange(min, max) {
    return Math.random() * (max - min) + min;
}

export default Boid;
