import * as THREE from 'three';
export default class WorldConfig {
    constructor({
        fov = 50,
        near = 0.1,
        far = 1000,
        position = new THREE.Vector3(0, 0, 1000),
        targetFrameMs = 33, // TODO: timing baseline, makes most influence in leader
        baseScaleReference = 1000, // Defines the base scale reference for scaling points for the leader
    } = {}) {
        this.fov = fov;
        this.near = near;
        this.far = far;
        this.position = position;

        this.targetFrameMs = targetFrameMs;
        this.baseScaleReference = baseScaleReference;
        this.scaleFactor = 1; 
    }
}