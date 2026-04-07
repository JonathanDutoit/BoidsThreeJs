import * as THREE from 'three';
class BoidConfig {
    /**
     * @param {object} steering     - Steering configuration that stablishes boids behavior
     * @param {object} spawning     - Spawning bounds of the boids in the scene
     * @param {object} rendering    - Rendering configuration associated to the boids mesh
     * @param {boolean} isLeader    - If true, this boid is the leader and follows the curve instead of the four rules. 
     */
    constructor({
        steering  = new SteeringConfig(),
        spawning  = new SpawningConfig(),
        rendering = new RenderingConfig(),
        isLeader  = false, 
    } = {}) {
        this.steering  = steering;
        this.spawning  = spawning;
        this.rendering = rendering;
        this.isLeader  = isLeader;
    }
}

class SteeringConfig {
    /**
     * @param {number} alignmentCoefficient     - Strength of alignment steering [0, 1].
     * @param {number} cohesionCoefficient      - Strength of cohesion steering [0, 1].
     * @param {number} separationCoefficient    - Strength of separation steering [0, 1].
     * @param {number} followLeaderCoefficient  - Strength of leader-following force [0.1, 100].
     * @param {number} alignmentRadius          - Radius within which alignment neighbours are counted.
     * @param {number} cohesionRadius           - Radius within which cohesion neighbours are counted.
     * @param {number} separationRadius         - Radius within which separation neighbours are counted.
     * @param {number} turnFactor               - Force applied when avoiding screen edges.
     * @param {number} minSpeed                 - Minimum achievable speed
     * @param {number} maxSpeed                 - Maximum achievable speed
     */
    constructor({
        alignmentCoefficient    = 0.009,
        cohesionCoefficient     = 0.000003,
        separationCoefficient   = 0.1,
        followLeaderCoefficient = 20,
        alignmentRadius         = 80,
        cohesionRadius          = 80,
        separationRadius        = 40,
        turnFactor              = 0.05,
        minSpeed                = 2,
        maxSpeed                = 3,
    } = {}) {
        this.alignmentCoefficient    = alignmentCoefficient;
        this.cohesionCoefficient     = cohesionCoefficient;
        this.separationCoefficient   = separationCoefficient;
        this.followLeaderCoefficient = followLeaderCoefficient;
        this.alignmentRadius         = alignmentRadius;
        this.cohesionRadius          = cohesionRadius;
        this.separationRadius        = separationRadius;
        this.turnFactor              = turnFactor;
        this.minSpeed                = minSpeed;
        this.maxSpeed                = maxSpeed;
    }
}

//Spawn bounds
class SpawningConfig {
    constructor({
        spawnRangeX = [-400, 400],
        spawnRangeY = [-300, 300],
        spawnRangeZ = [-200, 200],
    } = {}) {
        this.spawnRangeX = spawnRangeX;
        this.spawnRangeY = spawnRangeY;
        this.spawnRangeZ = spawnRangeZ;
    }
}

class RenderingConfig {
    constructor({
        meshColor    = 0xff0000,
        meshGeometry = new THREE.ConeGeometry(1, 2, 8),
    } = {}) {
        this.meshColor    = meshColor;
        this.meshGeometry = meshGeometry;
    }
}

export { SteeringConfig, SpawningConfig, RenderingConfig };
export default BoidConfig;