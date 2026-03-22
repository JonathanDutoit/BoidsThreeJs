import * as THREE from 'three';

export default class SceneSetup {
    constructor(config, container) {
        this.config = config;
        this.container = container;

        this.scene = new THREE.Scene();

        this.camera = new THREE.PerspectiveCamera(
            config.fov,
            1, // temporary, real value set by ResizeSystem
            config.near,
            config.far
        );
        this.camera.position.copy(config.position);
        this.camera.updateProjectionMatrix();

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setPixelRatio(window.devicePixelRatio);

        this.container.appendChild(this.renderer.domElement);
    }

    visibleSizeAtDepth(depth) {
        const halfFovRad = (this.config.fov / 2) * (Math.PI / 180);
        const height = 2 * depth * Math.tan(halfFovRad);
        return { width: height * this.camera.aspect, height };
    }
}