import * as THREE from 'three';

export default class SceneSetup {
    constructor(config, container) {
        this.config = config;
        this.container = container;

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000);

        this.camera = new THREE.PerspectiveCamera(
            config.fov,
            1, // temporary, real value set by ResizeSystem
            config.near,
            config.far
        );
        this.camera.position.copy(config.position);

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setPixelRatio(window.devicePixelRatio);

        this.container.appendChild(this.renderer.domElement);
    }
}