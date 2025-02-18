import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.module.js';

class Boid {
    /**
     * - Coefficients: take values between [0, 1] and represents how "fast" or "strong" the corresponding property is applied to Boids. 
     * @param {*} alignmentCoefficient 
     * @param {*} cohesionCoefficient 
     * @param {*} separationCoefficient 
     * @param {*} alignCohesionRadius 
     * @param {*} separationRadius 
     * @param {*} isLeader 
     */
    constructor(
        alignmentCoefficient = 0.5,
        cohesionCoefficient = 0.5,
        separationCoefficient = 0.5,
        alignCohesionRadius = 10,
        separationRadius = 10,
        isLeader = false
    ) {
        // Boid properties
        this.alignmentCoefficient = alignmentCoefficient;
        this.cohesionCoefficient = cohesionCoefficient;
        this.separationCoefficient = separationCoefficient;
        this.alignCohesionRadius = alignCohesionRadius;
        this.separationRadius = separationRadius;
        this.isLeader = isLeader;

        // Boid mesh
        this.mesh = new THREE.Mesh(
            new THREE.ConeGeometry(6, 10, 10),
            new THREE.MeshBasicMaterial({ color: isLeader ? 0x0000ff : 0xff0000, wireframe: true })
        );

        // Initialize position, speed, and acceleration
        this.position = new THREE.Vector3(
            randomInRange(10, 20),
            randomInRange(10, 20),
            randomInRange(5, 6)
        );

        this.speed = new THREE.Vector3(
            randomInRange(0, 10),
            randomInRange(0, 10),
            randomInRange(0, 10)
        );

        this.mesh.position.copy(this.position);
    }

    /**
     * 
     */
    updateBoidProperties(camera, boids) {
        this.updateBoidPosition(boids);
        this.updateBoidScale(camera);
        this.rotateTowardsDirection();
    }

    /**
     * 
     */
    updateBoidPosition(boids) {
        this.alignmentSteer(boids);
        this.cohesionSteer(boids);
        this.separationSteer(boids);

        const prevPosition = this.position.clone();

        this.position.copy(this.speed.clone().clampLength(-10, 10).add(prevPosition));

        this.mesh.position.copy(this.position);
    }
    /**
     * Updates the scaling so that it gets smaller as it goes further away, or bigger when it gets closer to the camera
     * @param {*} camera 
     */
    updateBoidScale(camera) {
        const distance = Math.max(0.1, camera.position.distanceTo(this.position));
        const scale = Math.log(distance + 1); // Logarithmic scaling
        this.mesh.scale.set(scale, scale, scale);
    }

    /**
     * 
     */
    alignmentSteer(boids) {
        const groupVelocity = new THREE.Vector3();
        const tempVector = new THREE.Vector3();
        let nbBoidsInRadius = 0;

        for (let neighbor of boids) {
            if (neighbor !== this && this.position.distanceTo(neighbor.position) < this.alignCohesionRadius) {
                tempVector.copy(neighbor.speed);
                groupVelocity.add(tempVector);
                nbBoidsInRadius++;
            }
        }

        if (nbBoidsInRadius > 0) {
            groupVelocity.divideScalar(nbBoidsInRadius);
            this.speed.add(groupVelocity.multiplyScalar(this.alignmentCoefficient));
        }
    }

    /**
     * 
     */
    cohesionSteer(boids) {
        const groupPosition = new THREE.Vector3();
        let nbBoidsInRadius = 0;

        for (let neighbor of boids) {
            if (neighbor !== this && this.position.distanceTo(neighbor.position) < this.alignCohesionRadius) {
                groupPosition.add(neighbor.position);
                nbBoidsInRadius++;
            }
        }

        if (nbBoidsInRadius > 0) {
            groupPosition.divideScalar(nbBoidsInRadius).sub(this.position);
            this.speed.add(groupPosition.multiplyScalar(this.cohesionCoefficient));
        }
    }

    /**
     * 
     */
    separationSteer(boids) {
        const steering = new THREE.Vector3();
        const tempVector = new THREE.Vector3(); // Reusable vector
        let nbBoidsInRadius = 0;

        for (let neighbor of boids) {
            const d = this.position.distanceTo(neighbor.position);
            if (neighbor !== this && d < this.separationRadius) {
                tempVector.subVectors(this.position, neighbor.position).divideScalar(d * d);
                steering.add(tempVector);
                nbBoidsInRadius++;
            }
        }

        if (nbBoidsInRadius > 0) {
            this.speed.add(steering.multiplyScalar(this.separationCoefficient));
        }
        return steering;

    }

    /**
     * 
     * @param {*} camera 
     * @param {*} dist 
     * @returns 
     */
    getCameraView(camera, dist) {
        const vFOV = THREE.MathUtils.degToRad(camera.fov);
        const height = 2 * Math.tan(vFOV / 2) * dist;
        const width = height * camera.aspect;
        return { width, height };
    }

    /**
     * 
     */
    rotateTowardsDirection() {
        const direction = this.speed.clone().normalize();
        const axis = new THREE.Vector3(0, 1, 0); // Assuming the fish is initially pointing up (along Y-axis)
        const targetQuaternion = new THREE.Quaternion().setFromUnitVectors(axis, direction);

        // Smoothly interpolate towards the target rotation
        this.mesh.quaternion.slerp(targetQuaternion, 0.1);
    }
}

/**
 * Helper function to generate a random value within a range
 * @param {*} min 
 * @param {*} max 
 * @returns 
 */
function randomInRange(min, max) {
    return Math.random() * (max - min) + min;
}

export default Boid;