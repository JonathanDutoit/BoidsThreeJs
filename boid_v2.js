import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.module.js';


class Boid {
    /**
     * - Coefficients: take values between [0, 1] and represents how "fast" or "strong" the corresponding property is applied to Boids. 
     * @param {*} alignmentCoefficient 
     * @param {*} cohesionCoefficient 
     * @param {*} separationCoefficient 
     * @param {*} alignementRadius
     * @param {*} cohesionRadius 
     * @param {*} separationRadius 
     * @param {*} isLeader 
     */
    constructor(
        alignmentCoefficient,
        cohesionCoefficient,
        separationCoefficient,
        alignementRadius,
        cohesionRadius,
        separationRadius,
        isLeader
    ) {
        // Boid properties
        this.alignmentCoefficient = alignmentCoefficient;
        this.cohesionCoefficient = cohesionCoefficient;
        this.separationCoefficient = separationCoefficient;
        this.alignementRadius = alignementRadius;
        this.cohesionRadius = cohesionRadius;
        this.separationRadius = separationRadius;
        this.isLeader = isLeader;

        // Boid mesh
        this.mesh = new THREE.Mesh(
            new THREE.ConeGeometry(6, 10, 10),
            new THREE.MeshBasicMaterial({ color: isLeader ? 0x0000ff : 0xff0000, wireframe: true })
        );

        // Initialize position, speed, and acceleration
        this.position = new THREE.Vector3(
            THREE.MathUtils.randInt(-400, 400),
            THREE.MathUtils.randInt(0, 500),
            THREE.MathUtils.randInt(0, 10)
        );

        this.speed = new THREE.Vector3(
            THREE.MathUtils.randInt(-1, 1),
            THREE.MathUtils.randInt(-1, 1),
            THREE.MathUtils.randInt(-1, 1)
        );

        this.mesh.position.copy(this.position);
    }

    /**
     * 
     */
    updateBoidProperties(camera, boids) {
        if (!this.isLeader) {
            this.updateBoidPosition(boids);
            this.updateBoidScale(camera);
            this.rotateTowardsDirection();
        }
    }

    /**
     * 
     */
    updateBoidPosition(boids) {
        console.log(this.alignementRadius);
        this.alignmentSteer(boids);
        this.cohesionSteer(boids);
        this.separationSteer(boids);

        this.position.add(this.speed);

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
            if (neighbor !== this && this.position.distanceTo(neighbor.position) < this.alignementRadius) {
                tempVector.copy(neighbor.speed);
                groupVelocity.add(tempVector);

                nbBoidsInRadius++;
            }
        }

        if (nbBoidsInRadius > 0) {
            groupVelocity.divideScalar(nbBoidsInRadius);

            const previousSpeed = this.speed.clone();

            // sub( v: Vector3) -> substracts v from this vector 
            const steerVector = groupVelocity.sub(previousSpeed).multiplyScalar(this.alignmentCoefficient);
            this.speed.copy(previousSpeed.add(steerVector));
        }
    }

    /**
     * 
     */
    cohesionSteer(boids) {
        const groupPosition = new THREE.Vector3();
        let nbBoidsInRadius = 0;

        for (let neighbor of boids) {
            if (neighbor !== this && this.position.distanceTo(neighbor.position) < this.cohesionRadius) {
                groupPosition.add(neighbor.position);
                nbBoidsInRadius++;
            }
        }

        if (nbBoidsInRadius > 0) {
            groupPosition.divideScalar(nbBoidsInRadius);

            const previousPosition = this.position.clone();
            const previousSpeed = this.speed.clone();


            // sub( v: Vector3) -> substracts v from this vector 
            const steerVector = groupPosition.sub(previousPosition).multiplyScalar(this.cohesionCoefficient);
            this.speed.copy(previousSpeed.add(steerVector));
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
                tempVector.subVectors(this.position, neighbor.position).divideScalar(d);
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

export default Boid;