// Scene Router — picks a scene based on the day and loads it

import { getDayOfYear, getMessageForDay } from './messages.js';

const SCENES = [
    'typewriter',
    'paper-lanterns',
    'moon-clouds',
    'candle',
];

export class SceneRouter {
    constructor(canvas, container) {
        this.canvas = canvas;
        this.container = container;
        this.currentScene = null;
        this.currentSceneName = null;
        this.dayOfYear = getDayOfYear();
    }

    async load() {
        const sceneIndex = this.dayOfYear % SCENES.length;
        const sceneName = SCENES[sceneIndex];
        const message = getMessageForDay(this.dayOfYear);

        try {
            this.currentSceneName = sceneName;
            const module = await import(`./scenes/${sceneName}.js`);
            this.currentScene = new module.default(this.canvas, this.container, message);
            this.currentScene.init();
        } catch (e) {
            console.error(`Failed to load scene: ${sceneName}`, e);
        }
    }

    update(time) {
        if (this.currentScene && this.currentScene.update) {
            this.currentScene.update(time);
        }
    }

    render(time) {
        if (this.currentScene && this.currentScene.render) {
            this.currentScene.render(time);
        }
    }

    resize() {
        if (this.currentScene && this.currentScene.resize) {
            this.currentScene.resize();
        }
    }
}
