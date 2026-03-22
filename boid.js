import BoidConfig from './boid_config';
import * as THREE from 'three';
/**
 * Represents a single Boid in the simulation.
 *
 * Each boid steers itself every frame according to four rules:
 *
 * 1. **Alignment**   — Match the average velocity of nearby boids, so the flock
 *                      moves in a coherent direction rather than scattering.
 *
 * 2. **Cohesion**    — Steer towards the average position of nearby boids, keeping
 *                      the flock together as a group.
 *
 * 3. **Separation**  — Push away from boids that are too close, preventing crowding
 *                      and overlapping within the flock.
 *
 * 4. **Follow leader** — Steer towards the leader boid's position. When the leader
 *                        is active, this overrides pure flocking and pulls the group
 *                        along the leader's path. When the leader is inactive
 *                          (`leader.active = false`), this rule is skipped entirely and
 *                        boids fall back to rules 1–3 only.
 *
 * The influence of each rule is controlled by its corresponding coefficient and
 * radius parameters passed with @class BoidConfig parameters.
 */
class Boid {
    constructor(config = new BoidConfig()) {
        this.alignmentCoefficient = config.steering.alignmentCoefficient;
        this.cohesionCoefficient = config.steering.cohesionCoefficient;
        this.separationCoefficient = config.steering.separationCoefficient;
        this.followLeaderCoefficient = config.steering.followLeaderCoefficient;
        this.alignmentRadius = config.steering.alignmentRadius;
        this.cohesionRadius = config.steering.cohesionRadius;
        this.separationRadius = config.steering.eparationRadius;
        this.turnFactor = config.steering.turnFactor;
        this.isLeader = config.isLeader;
        this.minSpeed = config.steering.minSpeed;
        this.maxSpeed = config.steering.maxSpeed;

        this.mesh = new THREE.Mesh(
            config.rendering.meshGeometry,
            new THREE.MeshBasicMaterial({ color: config.rendering.meshColor, wireframe: true })
        );

        // Starting position and speed
        this.position = new THREE.Vector3(
            THREE.MathUtils.randInt(...config.spawning.spawnRangeX),
            THREE.MathUtils.randInt(...config.spawning.spawnRangeY),
            THREE.MathUtils.randInt(...config.spawning.spawnRangeZ),
        );

        this.speed = new THREE.Vector3(
            Math.random() - 0.5,
            Math.random() - 0.5,
            Math.random() - 0.5,
        ).normalize().multiplyScalar(this.minSpeed);

        this.mesh.position.copy(this.position);
    }   

    /**
     * The main boid update loop
     */
    mainBoidUpdateLoop(camera, boids, leader) {
        if (!this.isLeader) {
            this.avoidEdges(camera);
            this.updateBoidPosition(boids, leader);
            this.rotateTowardsDirection();
            this.updateBoidScale(camera);
        }
    }

    /**
     * Updates boid position based on the 4 rules: Alignment, Cohesion, Separation and Follow Leader. 
     */
    updateBoidPosition(boids, leader) {
        this.alignmentSteer(boids);
        this.cohesionSteer(boids);
        this.separationSteer(boids);
        this.steerTowardsLeader(leader);
        
        this.speed.clampLength(this.minSpeed, this.maxSpeed);
        this.position.add(this.speed);
        this.mesh.position.copy(this.position);
    }

    /**
     * Updates Boids with logarithmic distance scaling based on camera position and configuration
     */
    updateBoidScale(camera) {
        const distance = Math.max(camera.near, camera.position.distanceTo(this.position));
        const scale = Math.log(distance);
        this.mesh.scale.set(scale, scale, scale);
    }

    /**
     * When boids goes closer to an edge, they are dragged in the opposite direction
     */
    avoidEdges(camera) {
        const margin = 0.3;
        const p = this.position.clone().project(camera);
        const push = new THREE.Vector3();

        if (p.x > 1 - margin)  push.x -= this.turnFactor;
        if (p.x < -1 + margin) push.x += this.turnFactor;
        if (p.y > 1 - margin)  push.y -= this.turnFactor;
        if (p.y < -1 + margin) push.y += this.turnFactor;
        // In the z direction, we make the boid turn completely 
        if (p.z > 1 - margin)  push.z -= 2 * this.speed.z;
        if (p.z < -1 + margin) push.z += 2 * this.speed.z;

        this.speed.add(push);
    }

    
    /**
     * Alignment force - match the average velocity of nearby boid
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
            const steerVector = groupVelocity.sub(previousSpeed).multiplyScalar(this.alignmentCoefficient);
            this.speed.copy(previousSpeed.add(steerVector));
        }
    }

    /**
     * Cohesion force - steer towards the average position of nearby boids
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
            const steerVector = groupPosition.sub(previousPosition).multiplyScalar(this.cohesionCoefficient);
            this.speed.copy(previousSpeed.add(steerVector));
        }
    }

    /**
     * Separation force - push away from boids that are too close
     */
    separationSteer(boids) {
        const steering = new THREE.Vector3();
        const tempVector = new THREE.Vector3();
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
     * Steers the boid towards the leader.
     * Skips entirely if the leader is not active (toggled off).
     * Guards against division by zero when very close to the leader.
     */
    steerTowardsLeader(leader) {
        if (!leader.active) return;

        const previousSpeed = this.speed.clone();
        const previousPosition = this.position.clone();

        const d = Math.max(1, this.position.distanceTo(leader.position)); // Guard against d=0
        const steerVector = leader.position.clone().sub(previousPosition).divideScalar(d * d).multiplyScalar(this.followLeaderCoefficient);

        this.speed.copy(previousSpeed.add(steerVector));
    }
    
    /**
     * Rotates the mesh axis towards it's speed direction 
     */
    rotateTowardsDirection() {
        const direction = this.speed.clone().normalize();
        const axis = new THREE.Vector3(0, 1, 0);
        const targetQuaternion = new THREE.Quaternion().setFromUnitVectors(axis, direction);
        this.mesh.quaternion.slerp(targetQuaternion, 0.1);
    }

}

export default Boid;