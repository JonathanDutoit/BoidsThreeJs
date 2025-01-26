import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.module.js';

class Boid {
    constructor(
        maxForce = 0.005,
        maxSpeed = 0.05,
        alignRadius = 0.5,
        separationRadius = 0.4,
        cohesionRadius = 0.05,
        showArrows = false,
        showDebug = false,
        isLeader = false
    ) {
        // Boid properties
        this.maxForce = maxForce;
        this.maxSpeed = maxSpeed;
        this.alignRadius = alignRadius;
        this.separationRadius = separationRadius;
        this.cohesionRadius = cohesionRadius;
        this.isLeader = isLeader;

       
        // Boid mesh
        this.mesh = new THREE.Mesh(
            new THREE.ConeGeometry(0.1, 0.2, 8),
            new THREE.MeshBasicMaterial({ color: isLeader ? 0x0000ff : 0xff0000, wireframe: true })
        );

        // Initialize position, speed, and acceleration
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

        // Debugging tools
        if (showArrows) {
            this.speedArrow = new THREE.ArrowHelper(this.speed.clone().normalize(), this.position, 1, 0x00ff00);
            this.accelerationArrow = new THREE.ArrowHelper(this.acceleration.clone().normalize(), this.position, 1, 0xff0000);
        }

        if (showDebug) {
            this.debugAlignSphere = new THREE.Mesh(
                new THREE.SphereGeometry(this.alignRadius, 16, 16),
                new THREE.MeshBasicMaterial({ wireframe: true, color: 0x00ff00 })
            );
            this.debugSeparationSphere = new THREE.Mesh(
                new THREE.SphereGeometry(this.separationRadius, 16, 16),
                new THREE.MeshBasicMaterial({ wireframe: true, color: 0xff0000 })
            );
            this.debugCohesionSphere = new THREE.Mesh(
                new THREE.SphereGeometry(this.cohesionRadius, 16, 16),
                new THREE.MeshBasicMaterial({ wireframe: true, color: 0x0000ff })
            );
            this.mesh.add(this.debugAlignSphere, this.debugSeparationSphere, this.debugCohesionSphere);
        }
    }

    applyForce(force) {
        this.acceleration.add(force);
    }

    updatePosition() {
        this.speed.add(this.acceleration).clampLength(0, this.maxSpeed);
        this.position.add(this.speed);
        this.mesh.position.copy(this.position);
        this.acceleration.set(0, 0, 0);

        if (this.speedArrow) this.updateArrows();
        
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
        const axis = new THREE.Vector3(0, 1, 0); // Assuming the fish is initially pointing up (along Y-axis)
        const targetQuaternion = new THREE.Quaternion().setFromUnitVectors(axis, direction);

        // Smoothly interpolate towards the target rotation
        this.mesh.quaternion.slerp(targetQuaternion, 0.1);
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

    avoidEdges(camera) {
        const { width, height } = this.getCameraView(camera, camera.position.distanceTo(this.position));
        const margin = 0.1; // Distance from edge to start avoiding

        if (this.position.x > width / 2 - margin) this.applyForce(new THREE.Vector3(-this.maxForce, 0, 0));
        else if (this.position.x < -width / 2 + margin) this.applyForce(new THREE.Vector3(this.maxForce, 0, 0));
        if (this.position.y > height / 2 - margin) this.applyForce(new THREE.Vector3(0, -this.maxForce, 0));
        else if (this.position.y < -height / 2 + margin) this.applyForce(new THREE.Vector3(0, this.maxForce, 0));
    }

    updateScale(camera) {
        const distance = Math.max(0.1, camera.position.distanceTo(this.position));
        const scale = Math.log(distance + 1); // Logarithmic scaling
        this.mesh.scale.set(scale, scale, scale);
    }

    update(camera) {
        this.edges(camera);
        this.avoidEdges(camera);
        this.updatePosition();
        this.updateScale(camera);
    }

    align(boids) {
        const groupVelocity = new THREE.Vector3();
        const tempVector = new THREE.Vector3(); // Reusable vector
        let total = 0;

        for (let neighbor of boids) {
            if (neighbor !== this && this.position.distanceTo(neighbor.position) < this.alignRadius) {
                tempVector.copy(neighbor.speed);
                groupVelocity.add(tempVector);
                total++;
            }
        }

        if (total > 0) {
            groupVelocity.divideScalar(total).clampLength(0, this.maxForce);
        }
        return groupVelocity;
    }

    separation(boids) {
        const steering = new THREE.Vector3();
        const tempVector = new THREE.Vector3(); // Reusable vector
        let total = 0;

        for (let neighbor of boids) {
            const d = this.position.distanceTo(neighbor.position);
            if (neighbor !== this && d < this.separationRadius) {
                tempVector.subVectors(this.position, neighbor.position).divideScalar(d);
                steering.add(tempVector);
                total++;
            }
        }

        if (total > 0) {
            steering.divideScalar(total).clampLength(0, this.maxForce);
        }
        return steering;
    }

    cohesion(boids) {
        const groupPosition = new THREE.Vector3();
        let total = 0;

        for (let neighbor of boids) {
            if (neighbor !== this && this.position.distanceTo(neighbor.position) < this.cohesionRadius) {
                groupPosition.add(neighbor.position);
                total++;
            }
        }

        if (total > 0) {
            groupPosition.divideScalar(total).sub(this.position).clampLength(0, this.maxForce);
        }
        return groupPosition;
    }

    followLeader(leader, curve, t) {
        if (!this.isLeader) {
            const target = curve.getPointAt(t);
            const desired = new THREE.Vector3().subVectors(target, this.position).normalize().multiplyScalar(this.maxSpeed);
            const steer = new THREE.Vector3().subVectors(desired, this.speed).clampLength(0, this.maxForce);
            this.applyForce(steer);
        }
    }

    flock(boids, leader, curve, t) {
        if (!this.isLeader) {
            this.applyForce(this.align(boids));
            this.applyForce(this.separation(boids));
            this.applyForce(this.cohesion(boids));
            this.followLeader(leader, curve, t);
        }
    }
}

// Helper function to generate a random value within a range
function randomInRange(min, max) {
    return Math.random() * (max - min) + min;
}

export default Boid;