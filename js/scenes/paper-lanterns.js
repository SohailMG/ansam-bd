// Paper Lanterns Scene
// Tap to release paper lanterns that float upward.
// Each lantern carries a strong Arabic word that describes her.
// After all lanterns are released, a final message appears.

export default class PaperLanternsScene {
    constructor(canvas, container, message) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.container = container;
        this.message = message;

        this.lanterns = [];
        this.currentWordIndex = 0;
        this.hintEl = null;
        this.hintShown = false;
        this.backgroundStars = [];
        this.startTime = 0;

        // Strong Arabic words that describe her
        this.words = [
            'مَهيبة',        // awe-inspiring, majestic
            'فاتنة',         // captivating, enchanting
            'ساحرة',         // bewitching, mesmerizing
            'مُلهِمة',       // inspiring
            'رائعة',         // magnificent, wonderful
            'باهرة',         // dazzling, radiant
            'أنيقة',         // elegant, refined
            'جليلة',         // dignified, sublime
            'بهيّة',         // splendid, beautiful, radiant
            'وضّاءة',        // luminous, glowing
            'نيّرة',         // bright, brilliant, enlightened
            'عزيزة',         // precious, cherished, dear
            'صافية',         // pure, clear, serene
            'رشيقة',         // graceful, lithe
            'حنونة',         // tender, compassionate
            'شامخة',         // towering, proud, dignified
            'فريدة',         // unique, one of a kind
            'نادرة',         // rare, extraordinary
            'أصيلة',         // genuine, authentic, noble
            'سَنيّة',        // exalted, sublime, magnificent
        ];

        // Final message after all lanterns
        this.finalMessage = 'كلّ هذا وأكثر\nولا تكفي الكلمات';
        // "All of this and more — and words are not enough"
        this.finalMessageOpacity = 0;
        this.allReleased = false;
        this.allReleasedTime = 0;
    }

    init() {
        this.startTime = performance.now();
        const w = window.innerWidth;
        const h = window.innerHeight;

        // Background stars
        const starCount = Math.floor((w * h) / 18000);
        for (let i = 0; i < starCount; i++) {
            this.backgroundStars.push({
                x: Math.random() * w,
                y: Math.random() * h,
                size: 0.3 + Math.random() * 1,
                brightness: 0.15 + Math.random() * 0.35,
                twinkle: Math.random() * Math.PI * 2,
                twinkleSpeed: 0.3 + Math.random() * 0.7
            });
        }

        // Hint text
        this.hintEl = document.createElement('div');
        this.hintEl.className = 'lantern-hint';
        this.hintEl.textContent = 'المسي الشاشة';

        const scene = document.createElement('div');
        scene.className = 'lantern-scene scene-fade-in';
        scene.appendChild(this.hintEl);
        this.container.appendChild(scene);

        setTimeout(() => {
            this.hintEl.classList.add('visible');
            this.hintShown = true;
        }, 2000);

        // Handle taps
        window.addEventListener('click', (e) => this.handleTap(e));
        window.addEventListener('touchend', (e) => {
            const touch = e.changedTouches[0];
            if (touch) {
                this.handleTap({ clientX: touch.clientX, clientY: touch.clientY });
            }
        });
    }

    handleTap(e) {
        if (this.currentWordIndex >= this.words.length) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const w = window.innerWidth;
        const h = window.innerHeight;

        // Fade out hint after first tap
        if (this.hintShown) {
            this.hintEl.classList.add('fade-out');
            this.hintShown = false;
        }

        // Lantern spawns from the bottom area near tap X
        const word = this.words[this.currentWordIndex];
        const spawnY = Math.max(y, h * 0.7);

        // Spread target Y positions so lanterns fill the sky nicely
        const row = Math.floor(this.currentWordIndex / 5);
        const col = this.currentWordIndex % 5;
        const targetY = h * 0.06 + row * (h * 0.15) + Math.random() * h * 0.06;
        const targetX = w * 0.12 + col * (w * 0.19) + (Math.random() - 0.5) * w * 0.06;

        this.lanterns.push({
            x: x,
            y: spawnY,
            targetX: targetX,
            targetY: targetY,
            word: word,
            opacity: 0,
            fadeIn: true,
            size: 32 + Math.random() * 8,
            swayPhase: Math.random() * Math.PI * 2,
            swayAmount: 10 + Math.random() * 15,
            speed: 0.4 + Math.random() * 0.25,
            glowPhase: Math.random() * Math.PI * 2,
            settled: false,
            createdAt: performance.now()
        });

        this.currentWordIndex++;

        // Check if all released
        if (this.currentWordIndex >= this.words.length && !this.allReleased) {
            this.allReleased = true;
            this.allReleasedTime = performance.now();
        }
    }

    update(time) {
        for (const lantern of this.lanterns) {
            // Fade in
            if (lantern.fadeIn && lantern.opacity < 1) {
                lantern.opacity = Math.min(1, lantern.opacity + 0.025);
            }

            // Float upward and drift toward target X
            if (!lantern.settled) {
                lantern.y -= lantern.speed;
                lantern.x += (lantern.targetX - lantern.x) * 0.008;

                if (lantern.y <= lantern.targetY) {
                    lantern.settled = true;
                }
            }

            // Gentle sway
            lantern.swayPhase += 0.006;
            lantern.glowPhase += 0.02;
        }

        // Final message fade in after all lanterns released + delay
        if (this.allReleased) {
            const timeSinceAll = time - this.allReleasedTime;
            if (timeSinceAll > 2500) {
                this.finalMessageOpacity = Math.min(1, this.finalMessageOpacity + 0.008);
            }
        }
    }

    render(time) {
        const ctx = this.ctx;
        const w = window.innerWidth;
        const h = window.innerHeight;
        const isMobile = w < 768;

        // Dark sky
        const skyGradient = ctx.createLinearGradient(0, 0, 0, h);
        skyGradient.addColorStop(0, '#030308');
        skyGradient.addColorStop(0.6, '#060612');
        skyGradient.addColorStop(1, '#08050a');
        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, 0, w, h);

        // Stars
        for (const star of this.backgroundStars) {
            star.twinkle += star.twinkleSpeed * 0.015;
            const twinkle = 0.5 + Math.sin(star.twinkle) * 0.5;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(200, 210, 255, ${star.brightness * twinkle})`;
            ctx.fill();
        }

        // Draw lanterns
        for (const lantern of this.lanterns) {
            const sway = Math.sin(lantern.swayPhase) * lantern.swayAmount;
            const floatY = lantern.settled ? Math.sin(lantern.swayPhase * 0.7) * 4 : 0;
            const drawX = lantern.x + sway;
            const drawY = lantern.y + floatY;
            const glow = 0.7 + Math.sin(lantern.glowPhase) * 0.3;

            ctx.save();
            ctx.globalAlpha = lantern.opacity;

            // Warm glow
            const glowSize = lantern.size * 3;
            const glowGradient = ctx.createRadialGradient(drawX, drawY, 0, drawX, drawY, glowSize);
            glowGradient.addColorStop(0, `rgba(255, 180, 80, ${0.2 * glow})`);
            glowGradient.addColorStop(0.4, `rgba(255, 150, 50, ${0.06 * glow})`);
            glowGradient.addColorStop(1, 'rgba(255, 120, 30, 0)');
            ctx.fillStyle = glowGradient;
            ctx.beginPath();
            ctx.arc(drawX, drawY, glowSize, 0, Math.PI * 2);
            ctx.fill();

            // Lantern body
            const lw = lantern.size * 0.6;
            const lh = lantern.size * 0.9;

            const paperGradient = ctx.createLinearGradient(drawX - lw, drawY, drawX + lw, drawY);
            paperGradient.addColorStop(0, `rgba(220, 120, 50, ${0.7 * glow})`);
            paperGradient.addColorStop(0.3, `rgba(255, 180, 80, ${0.85 * glow})`);
            paperGradient.addColorStop(0.7, `rgba(255, 170, 70, ${0.8 * glow})`);
            paperGradient.addColorStop(1, `rgba(210, 110, 40, ${0.65 * glow})`);

            ctx.fillStyle = paperGradient;
            ctx.beginPath();
            ctx.ellipse(drawX, drawY, lw, lh, 0, 0, Math.PI * 2);
            ctx.fill();

            // Inner light
            const innerGradient = ctx.createRadialGradient(drawX, drawY, 0, drawX, drawY, lw * 0.7);
            innerGradient.addColorStop(0, `rgba(255, 240, 200, ${0.4 * glow})`);
            innerGradient.addColorStop(1, 'rgba(255, 200, 120, 0)');
            ctx.fillStyle = innerGradient;
            ctx.beginPath();
            ctx.ellipse(drawX, drawY, lw * 0.7, lh * 0.7, 0, 0, Math.PI * 2);
            ctx.fill();

            // Arabic word on lantern
            const fontSize = isMobile ? 14 : 18;
            ctx.font = `bold ${fontSize}px "Amiri", "Geeza Pro", serif`;
            ctx.fillStyle = `rgba(60, 30, 10, ${0.9 * glow})`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(lantern.word, drawX, drawY);

            // String hanging down
            ctx.strokeStyle = `rgba(180, 150, 100, ${0.3 * lantern.opacity})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(drawX, drawY + lh);
            ctx.lineTo(drawX + Math.sin(lantern.swayPhase * 2) * 3, drawY + lh + 15);
            ctx.stroke();

            ctx.restore();
        }

        // Final message at the bottom
        if (this.finalMessageOpacity > 0) {
            const fontSize = isMobile ? 18 : 24;
            const lineHeight = fontSize * 2.4;
            ctx.font = `${fontSize}px "Amiri", "Geeza Pro", serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            const lines = this.finalMessage.split('\n');
            const startY = h * 0.85 - (lines.length * lineHeight) / 2;

            for (let i = 0; i < lines.length; i++) {
                ctx.shadowColor = `rgba(255, 200, 120, ${this.finalMessageOpacity * 0.3})`;
                ctx.shadowBlur = 15;
                ctx.fillStyle = `rgba(255, 235, 200, ${this.finalMessageOpacity * 0.75})`;
                ctx.fillText(lines[i], w / 2, startY + i * lineHeight);
            }
            ctx.shadowBlur = 0;
        }

        // Lantern count hint (subtle, bottom-right)
        if (this.currentWordIndex > 0 && this.currentWordIndex < this.words.length) {
            const remaining = this.words.length - this.currentWordIndex;
            ctx.font = `${isMobile ? 11 : 13}px "Lora", serif`;
            ctx.fillStyle = 'rgba(200, 180, 150, 0.2)';
            ctx.textAlign = 'right';
            ctx.textBaseline = 'bottom';
            ctx.fillText(`${remaining}`, w - 20, h - 15);
        }
    }

    resize() {
        this.backgroundStars = [];
        const w = window.innerWidth;
        const h = window.innerHeight;
        const starCount = Math.floor((w * h) / 18000);
        for (let i = 0; i < starCount; i++) {
            this.backgroundStars.push({
                x: Math.random() * w,
                y: Math.random() * h,
                size: 0.3 + Math.random() * 1,
                brightness: 0.15 + Math.random() * 0.35,
                twinkle: Math.random() * Math.PI * 2,
                twinkleSpeed: 0.3 + Math.random() * 0.7
            });
        }
    }
}
