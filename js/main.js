// Main entry point - orchestrates the night sky birthday experience

import { StarManager, Phase } from './stars.js';
import { Renderer } from './renderer.js';

class NightSkyExperience {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.hintEl = document.getElementById('hint');
        this.completionEl = document.getElementById('completion');

        this.renderer = null;
        this.starManager = null;

        this.hasStarted = false;
        this.isComplete = false;

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

        // Handle clicks
        this.canvas.addEventListener('click', (e) => this.handleClick(e));

        // Show hint after a moment
        setTimeout(() => {
            this.hintEl.classList.add('visible');
        }, 2500);

        // Start render loop
        this.render();
    }

    handleClick(e) {
        if (this.hasStarted) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Check if initiator star was clicked
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

        // Render with connection lines
        this.renderer.render(
            this.starManager.getStars(),
            this.starManager.getBackgroundStars(),
            this.starManager.getInitiatorStar(),
            this.starManager.getPhase(),
            currentTime,
            this.starManager.getConnectionLines(),
            this.starManager.getLinesFadeIn()
        );

        // Check for completion
        if (!this.isComplete && this.starManager.isComplete()) {
            this.onComplete();
        }

        requestAnimationFrame(() => this.render());
    }

    onComplete() {
        this.isComplete = true;

        // Show completion message after a pause
        setTimeout(() => {
            this.completionEl.classList.add('visible');
        }, 3000);
    }
}

// Start the experience when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new NightSkyExperience();
});
