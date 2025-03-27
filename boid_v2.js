import * as THREE from 'three';
import { SortUtils } from 'three/examples/jsm/Addons.js';

class Boid {
    /**
     * - Coefficients: take values between [0, 1] and represents how "fast" or "strong" the corresponding property is applied to Boids. 
     * @param {*} alignmentCoefficient 
     * @param {*} cohesionCoefficient 
     * @param {*} separationCoefficient 
     * @param {*} alignmentRadius
     * @param {*} cohesionRadius 
     * @param {*} separationRadius
     * @param {*} turnFactor 
     * @param {*} isLeader 
     */
    constructor(
        alignmentCoefficient,
        cohesionCoefficient,
        separationCoefficient,
        alignmentRadius,
        cohesionRadius,
        separationRadius,
        turnFactor,
        isLeader
    ) {
        // Boid properties
        this.alignmentCoefficient = alignmentCoefficient;
        this.cohesionCoefficient = cohesionCoefficient;
        this.separationCoefficient = separationCoefficient;
        this.alignmentRadius = alignmentRadius;
        this.cohesionRadius = cohesionRadius;
        this.separationRadius = separationRadius;
        this.turnFactor = turnFactor;
        this.isLeader = isLeader;

        // Boid mesh
        this.mesh = new THREE.Mesh(
            new THREE.ConeGeometry(1, 2, 8),
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
            this.avoidEdges(camera);
            this.updateBoidPosition(boids);
            this.rotateTowardsDirection();
            this.updateBoidScale(camera);
        }
    }

    /**
     * 
     */
    updateBoidPosition(boids) {
        this.alignmentSteer(boids);
        this.cohesionSteer(boids);
        this.separationSteer(boids);
        
        const maxSpeed = 3;
        const minSpeed = 1;

        
        this.speed.clampLength(minSpeed, maxSpeed);

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
     * @param {*} camera 
     */
    avoidEdges(camera) {
        const margin = 0.3; // Distance from edge to start avoiding

        const projectedPosition = this.position.clone().project(camera);
        if (projectedPosition.x > 1 - margin) {
            this.speed.add(new THREE.Vector3(-this.turnFactor, 0, 0));
        } 
        if (projectedPosition.x < -1 + margin) {
            this.speed.add(new THREE.Vector3(this.turnFactor, 0, 0));
        }
        if(projectedPosition.y > 1 - margin) {
            this.speed.add(new THREE.Vector3(0, -this.turnFactor, 0));
        }
        if(projectedPosition.y < -1 + margin) {
            this.speed.add(new THREE.Vector3(0, this.turnFactor, 0));
        }
        if((projectedPosition.z -0.999) * 1000 > 1 - margin) {
            this.speed.add(new THREE.Vector3(0, 0, -2 * this.speed.z));
        }
        if((projectedPosition.z -0.999) * 1000 < -1 + margin) {
            this.speed.add(new THREE.Vector3(0, 0, - 2 * this.speed.z));
        }
    }

    /**
     * 
     */
    alignmentSteer(boids) {
        const groupVelocity = new THREE.Vector3();
        const tempVector = new THREE.Vector3();
        let nbBoidsInRadius = 0;

        for (let neighbor of boids) {
            if (neighbor !== this && this.position.distanceTo(neighbor.position) < this.alignmentRadius) {
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
     */
    rotateTowardsDirection() {
        const direction = this.speed.clone().normalize();
        const axis = new THREE.Vector3(0, 1, 0); // Assuming the fish is initially pointing up (along Y-axis)
        const targetQuaternion = new THREE.Quaternion().setFromUnitVectors(axis, direction);

        // Smoothly interpolate towards the target rotation
        this.mesh.quaternion.slerp(targetQuaternion, 0.1);
    }

    getLeader() {
        return this.isLeader;
    }
}

export default Boid;