export default class ResizeSystem {
    constructor(sceneSetup) {
        this.sceneSetup = sceneSetup;

        this.resize = this.resize.bind(this);

        this.observer = new ResizeObserver(this.resize);
        this.observer.observe(this.sceneSetup.container);

        this.resize();
    }

    resize() {
        const { renderer, camera, config, container } = this.sceneSetup;

        const width = container.clientWidth;
        const height = container.clientHeight;

        if (width === 0 || height === 0) return;

        const pixelRatio = renderer.getPixelRatio();

        const targetWidth = Math.floor(width * pixelRatio);
        const targetHeight = Math.floor(height * pixelRatio);

        const canvas = renderer.domElement;

        if (
            canvas.width === targetWidth &&
            canvas.height === targetHeight
        ) return;

        renderer.setSize(width, height, false);

        camera.aspect = width / height;
        camera.updateProjectionMatrix();

        config.scaleFactor = Math.min(width, height) / config.baseScaleReference;
    }

    

    dispose() {
        this.observer.disconnect();
    }
}