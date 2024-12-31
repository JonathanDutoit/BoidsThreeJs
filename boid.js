import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.module.js';

class Boid {
    constructor() {
        this.mesh = new THREE.Mesh(
            new THREE.ConeGeometry(0.1, 0.2, 8),
            new THREE.MeshBasicMaterial({ color: 0xff0000 })
        );

        this.maxForce = 0.005;
        this.maxSpeed = 0.02;

        this.position = new THREE.Vector3(
            randomInRange(-0.3, 0.3),
            randomInRange(-0.3, 0.3),
            4
        );
        this.speed = new THREE.Vector3(
            0,
            randomInRange(0, this.maxSpeed),
            randomInRange(0, this.maxSpeed)
        );
        this.acceleration = new THREE.Vector3(0, 0, 0);

        this.mesh.position.copy(this.position);

        // Create arrow helpers for speed and acceleration
        this.speedArrow = new THREE.ArrowHelper(this.speed.clone().normalize(), this.position, 1, 0x00ff00);
        this.accelerationArrow = new THREE.ArrowHelper(this.acceleration.clone().normalize(), this.position, 1, 0xff0000);

    }

    applyForce(force) {
        this.acceleration.add(force);
    }

    updatePosition() {
        this.speed.add(this.acceleration).clampLength(0, this.maxSpeed);
        this.position.add(this.speed);
        this.mesh.position.copy(this.position);
        this.acceleration.set(0, 0, 0);

        this.updateArrows();
        this.rotateTowardsDirection();
    }

    updateArrows() {
        this.speedArrow.setDirection(this.speed.clone().normalize());
        this.speedArrow.setLength(1);
        this.speedArrow.position.copy(this.position);

        this.accelerationArrow.setDirection(this.acceleration.clone().normalize());
        this.accelerationArrow.setLength(1);
        this.accelerationArrow.position.copy(this.position);
    }

    rotateTowardsDirection() {
        const direction = this.speed.clone().normalize();
        const axis = new THREE.Vector3(0, 1, 0);  // Assuming the cone is initially pointing up (along Y-axis)

        // Compute the quaternion for rotation
        const quaternion = new THREE.Quaternion().setFromUnitVectors(axis, direction);

        // Apply the rotation to the mesh
        this.mesh.quaternion.copy(quaternion);
    }

    getCameraView(camera, dist) {
        const vFOV = THREE.MathUtils.degToRad(camera.fov);
        const height = 2 * Math.tan(vFOV / 2) * dist;
        const width = height * camera.aspect;
        return { width, height };
    }

    edges(camera) {
        const { width, height } = this.getCameraView(camera, camera.position.distanceTo(this.position));
        if (this.position.x > width / 2) this.position.x = -width / 2;
        else if (this.position.x < -width / 2) this.position.x = width / 2;
        if (this.position.y > height / 2) this.position.y = -height / 2;
        else if (this.position.y < -height / 2) this.position.y = height / 2;
        if (this.position.z > camera.position.z / 2) this.position.z = 0;
        else if (this.position.z < 0) this.position.z = camera.position.z / 2;
    }

    updateScale(camera) {
        const distance = Math.max(0.1, camera.position.distanceTo(this.position));
        const scale = 1 / distance;
        this.mesh.scale.set(scale, scale, scale);
    }

    update(camera) {
        this.edges(camera);
        this.updatePosition();
        this.updateScale(camera);
    }

    align(boids) {
        let groupVelocity = new THREE.Vector3();
        let total = 0;
        const perceptionRadius = 0.2;
        for (let neighbor of boids) {
            if (neighbor !== this && this.position.distanceTo(neighbor.position) < perceptionRadius) {
                groupVelocity.add(neighbor.speed);
                total++;
            }
        }
        if (total > 0) {
            groupVelocity.divideScalar(total).clampLength(0, this.maxForce);
        }
        return groupVelocity;
    }

    separation(boids) {
        let steering = new THREE.Vector3();
        let total = 0;
        const perceptionRadius = 0.075;
        for (let neighbor of boids) {
            const d = this.position.distanceTo(neighbor.position);
            if (neighbor !== this && d < perceptionRadius) {
                steering.add(
                    new THREE.Vector3().subVectors(this.position, neighbor.position).divideScalar(d)
                );
                total++;
            }
        }
        if (total > 0) {
            steering.divideScalar(total).clampLength(0, this.maxForce);
        }
        return steering;
    }

    cohesion(boids) {
        let groupPosition = new THREE.Vector3();
        let total = 0;
        const perceptionRadius = 0.1;
        for (let neighbor of boids) {
            if (neighbor !== this && this.position.distanceTo(neighbor.position) < perceptionRadius) {
                groupPosition.add(neighbor.position);
                total++;
            }
        }
        if (total > 0) {
            groupPosition.divideScalar(total).sub(this.position).clampLength(0, this.maxForce);
        }
        return groupPosition;
    }

    flock(boids) {
        this.applyForce(this.align(boids));
        this.applyForce(this.separation(boids));
        this.applyForce(this.cohesion(boids));
    }
}

// Helper function to generate a random value within a range
function randomInRange(min, max) {
    return Math.random() * (max - min) + min;
}

export default Boid;
