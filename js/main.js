// Main entry point - orchestrates the night sky birthday experience

import { StarManager, Phase } from './stars.js';
import { Renderer } from './renderer.js';

class NightSkyExperience {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.hintEl = document.getElementById('hint');

        this.renderer = null;
        this.starManager = null;

        this.hasStarted = false;

        this.init();
    }

    init() {
        // Initialize renderer
        this.renderer = new Renderer(this.canvas);
        const { width, height } = this.renderer.resize();

        // Initialize star manager
        this.starManager = new StarManager(width, height);

        // Handle resize
        window.addEventListener('resize', () => this.handleResize());
        window.addEventListener('orientationchange', () => {
            // Delay to let orientation settle
            setTimeout(() => this.handleResize(), 100);
        });

        // Handle clicks and touches
        this.canvas.addEventListener('click', (e) => this.handleInteraction(e));
        this.canvas.addEventListener('touchend', (e) => this.handleTouch(e));

        // Prevent default touch behaviors
        this.canvas.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
        this.canvas.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });

        // Show hint after a moment
        setTimeout(() => {
            this.hintEl.classList.add('visible');
        }, 2000);

        // Start render loop
        this.render();
    }

    handleTouch(e) {
        e.preventDefault();
        if (this.hasStarted) return;

        const touch = e.changedTouches[0];
        if (!touch) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;

        if (this.starManager.checkInitiatorClick(x, y)) {
            this.startExperience();
        }
    }

    handleInteraction(e) {
        if (this.hasStarted) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (this.starManager.checkInitiatorClick(x, y)) {
            this.startExperience();
        }
    }

    startExperience() {
        this.hasStarted = true;

        // Fade out hint
        this.hintEl.classList.add('fade-out');

        // Start the star formation sequence
        this.starManager.startExperience(performance.now());
    }

    handleResize() {
        const { width, height } = this.renderer.resize();
        this.starManager.resize(width, height);
    }

    render() {
        const currentTime = performance.now();

        // Update star manager
        this.starManager.update(currentTime);

        // Render
        this.renderer.render(
            this.starManager.getStars(),
            this.starManager.getBackgroundStars(),
            this.starManager.getInitiatorStar(),
            this.starManager.getPhase(),
            currentTime,
            this.starManager.getConnectionLines(),
            this.starManager.getLinesFadeIn(),
            this.starManager.getAnsamBounds()
        );

        requestAnimationFrame(() => this.render());
    }
}

// Start the experience when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new NightSkyExperience();
});
