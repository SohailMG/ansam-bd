// Main entry point — loads the daily scene

import { SceneRouter } from './scene-router.js';

class App {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.container = document.getElementById('scene-container');
        this.router = new SceneRouter(this.canvas, this.container);

        this.init();
    }

    async init() {
        // Setup canvas
        this.resizeCanvas();

        window.addEventListener('resize', () => {
            this.resizeCanvas();
            this.router.resize();
        });

        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.resizeCanvas();
                this.router.resize();
            }, 100);
        });

        // Load today's scene
        await this.router.load();

        // Start render loop
        this.loop(performance.now());
    }

    resizeCanvas() {
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = window.innerWidth * dpr;
        this.canvas.height = window.innerHeight * dpr;
        const ctx = this.canvas.getContext('2d');
        ctx.scale(dpr, dpr);
    }

    loop(time) {
        this.router.update(time);
        this.router.render(time);
        requestAnimationFrame((t) => this.loop(t));
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new App();
});
