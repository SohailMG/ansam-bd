// Book Page Scene
// A single aged book page with a highlighted passage and handwritten margin note

export default class BookPageScene {
    constructor(canvas, container, message) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.container = container;
        this.message = message;
    }

    init() {
        // Draw warm dark background
        this.drawBackground();

        const scene = document.createElement('div');
        scene.className = 'book-scene scene-fade-in';

        const page = document.createElement('div');
        page.className = 'book-page';

        // The main passage with highlighted text
        const passage = document.createElement('div');
        passage.className = 'book-passage';
        if (this.message.lang === 'en') {
            passage.classList.add('ltr');
        }

        // Split message into lines, highlight the middle portion
        const lines = this.message.text.split('\n');
        const highlightStart = Math.max(0, Math.floor(lines.length * 0.25));
        const highlightEnd = Math.min(lines.length, Math.ceil(lines.length * 0.75));

        lines.forEach((line, i) => {
            if (i > 0) {
                passage.appendChild(document.createElement('br'));
            }
            if (i >= highlightStart && i < highlightEnd) {
                const highlight = document.createElement('span');
                highlight.className = 'book-highlight';
                highlight.textContent = line;
                passage.appendChild(highlight);
            } else {
                passage.appendChild(document.createTextNode(line));
            }
        });

        // Annotation in the margin
        const annotation = document.createElement('div');
        annotation.className = 'book-annotation';
        if (this.message.lang === 'en') {
            annotation.classList.add('ltr');
        }

        // Pick an annotation based on language
        const annotations_ar = [
            'هذا عنكِ.',
            'ذكّرتني بكِ.',
            'صدق.',
            'كأنهم يعرفونكِ.',
        ];
        const annotations_en = [
            'This is about you.',
            'Reminded me of you.',
            'True.',
            'As if they know you.',
        ];

        const annotations = this.message.lang === 'ar' ? annotations_ar : annotations_en;
        const dayIndex = new Date().getDate();
        annotation.textContent = annotations[dayIndex % annotations.length];

        page.appendChild(passage);
        page.appendChild(annotation);
        scene.appendChild(page);
        this.container.appendChild(scene);
    }

    drawBackground() {
        const ctx = this.ctx;
        const w = window.innerWidth;
        const h = window.innerHeight;

        // Dark warm background like a reading room at night
        const gradient = ctx.createRadialGradient(
            w * 0.5, h * 0.5, 0,
            w * 0.5, h * 0.5, Math.max(w, h) * 0.8
        );
        gradient.addColorStop(0, '#0e0b08');
        gradient.addColorStop(0.5, '#080604');
        gradient.addColorStop(1, '#030201');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);

        // Subtle warm light source from above-right (like a reading lamp)
        const lampGlow = ctx.createRadialGradient(
            w * 0.55, h * 0.2, 0,
            w * 0.55, h * 0.3, Math.max(w, h) * 0.5
        );
        lampGlow.addColorStop(0, 'rgba(255, 220, 160, 0.03)');
        lampGlow.addColorStop(0.5, 'rgba(255, 200, 140, 0.01)');
        lampGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = lampGlow;
        ctx.fillRect(0, 0, w, h);
    }

    update(time) {
        // Static scene, no continuous updates needed
    }

    render(time) {
        // Background is static
    }

    resize() {
        this.drawBackground();
    }
}
