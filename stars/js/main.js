// Main entry point - orchestrates the night sky birthday experience

import { StarManager, Phase } from './stars.js';
import { Renderer } from './renderer.js';
import { initGate } from '../../js/gate.js';

class NightSkyExperience {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.hintEl = document.getElementById('hint');

        this.renderer = null;
        this.starManager = null;

        this.hasStarted = false;
        this.isDraggingPoem = false;

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

        // Handle clicks and touches for initiator star
        this.canvas.addEventListener('click', (e) => this.handleInteraction(e));

        // Mouse events for dragging poem stars
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('mouseleave', (e) => this.handleMouseUp(e));

        // Touch events for dragging poem stars
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });

        // Show hint after a moment
        setTimeout(() => {
            this.hintEl.classList.add('visible');
        }, 2000);

        // Start render loop
        this.render();
    }

    // Mouse drag handlers
    handleMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Try to start dragging a poem star
        if (this.renderer.startDrag(x, y)) {
            this.isDraggingPoem = true;
            this.canvas.style.cursor = 'grabbing';
        }
    }

    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (this.isDraggingPoem) {
            this.renderer.updateDrag(x, y);
        } else {
            // Update cursor if hovering over a poem star
            const star = this.renderer.findPoemStarAt(x, y);
            this.canvas.style.cursor = star ? 'grab' : 'default';
        }
    }

    handleMouseUp(e) {
        if (this.isDraggingPoem) {
            this.isDraggingPoem = false;
            this.renderer.endDrag();
            this.canvas.style.cursor = 'default';
        }
    }

    // Touch drag handlers
    handleTouchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        if (!touch) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;

        // Try to start dragging a poem star
        if (this.renderer.startDrag(x, y)) {
            this.isDraggingPoem = true;
        }
    }

    handleTouchMove(e) {
        e.preventDefault();
        if (!this.isDraggingPoem) return;

        const touch = e.touches[0];
        if (!touch) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;

        this.renderer.updateDrag(x, y);
    }

    handleTouchEnd(e) {
        e.preventDefault();

        // If we were dragging, just end the drag
        if (this.isDraggingPoem) {
            this.isDraggingPoem = false;
            this.renderer.endDrag();
            return;
        }

        // Otherwise, check for initiator click (only if not started)
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
        // Don't trigger if we just finished dragging
        if (this.isDraggingPoem) return;
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

// Start the experience when DOM is ready, after gate is passed
document.addEventListener('DOMContentLoaded', () => {
    initGate(() => {
        new NightSkyExperience();
    });
});
