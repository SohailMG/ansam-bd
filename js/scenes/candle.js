// Candle Scene
// The candle starts unlit in complete darkness.
// She touches it — it ignites. Warm light spreads outward.
// As light grows, hidden words scattered in the dark are revealed.
// The main message appears: she lights up everything around her.

export default class CandleScene {
    constructor(canvas, container, message) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.container = container;
        this.message = message;

        // Candle state
        this.lit = false;
        this.lightProgress = 0; // 0 = dark, 1 = full glow
        this.igniteTime = 0;

        // Flame
        this.flamePhase = 0;
        this.flameFlicker = 0;
        this.flickerTarget = 0;
        this.flickerSpeed = 0;
        this.flameScale = 0; // grows from 0 to 1 on ignite

        // Particles
        this.particles = [];

        // Hidden words scattered around the screen
        this.hiddenWords = [];

        // Main message
        this.mainMessageOpacity = 0;
        this.mainMessageRevealed = false;

        // Hint
        this.hintOpacity = 0;
        this.hintDismissed = false;
        this.startTime = 0;
    }

    init() {
        this.startTime = performance.now();
        this.placeWords();

        // Event listeners
        window.addEventListener('click', (e) => this.handleTap(e));
        window.addEventListener('touchend', (e) => {
            const touch = e.changedTouches[0];
            if (touch) {
                this.handleTap({ clientX: touch.clientX, clientY: touch.clientY });
            }
        });
    }

    placeWords() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        const isMobile = w < 768;
        const isSmall = w < 480;

        // Words that describe her — rare, beautiful, worth looking up
        const allWords = [
            'ineffable',      // too extraordinary to be expressed in words
            'ethereal',       // extremely delicate and light; heavenly
            'luminous',       // radiating or reflecting light; brilliant
            'resplendent',    // dazzling in appearance; impressively beautiful
            'incandescent',   // full of strong emotion; brilliant; glowing
            'mellifluous',    // sweet-sounding; pleasant to hear
            'dulcet',         // sweet and soothing (of sound or manner)
            'effervescent',   // vivacious, bubbly, full of life
            'eunoia',         // beautiful thinking; a well and open mind
            'diaphanous',     // delicate, translucent, almost otherworldly
            'elysian',        // divinely beautiful, blissful, heavenly
            'iridescent',     // showing shifting, luminous colors
            'seraphic',       // angelic; resembling a seraph in beauty
            'svelte',         // slender, elegant, graceful
            'winsome',        // attractive and charming in an open way
            'halcyon',        // happy, golden, idyllically peaceful
            'lambent',        // softly bright or radiant; gently glowing
            'aureate',        // golden; brilliant, splendid
            'beguiling',      // enchanting, charming, captivating
            'demure',         // reserved, modest, and shy in a charming way
            'felicitous',     // well-suited, perfectly apt, delightful
            'lissome',        // thin, supple, graceful
            'effulgent',      // shining brightly; radiant
            'supernal',       // of exceptional quality; celestial, divine
            'captivating',    // capable of holding attention; enchanting
        ];

        // Fewer words on small screens to avoid crowding
        const wordCount = isSmall ? 14 : isMobile ? 18 : allWords.length;

        // Shuffle and pick
        const shuffled = [...allWords].sort(() => Math.random() - 0.5);
        const words = shuffled.slice(0, wordCount);

        const baseSize = isSmall ? 14 : isMobile ? 15 : 16;
        const candle = this.getCandlePosition();

        // Clear existing words (for resize)
        this.hiddenWords = [];

        // Place words using a grid-based approach to avoid overlap
        const placed = [];
        for (let i = 0; i < words.length; i++) {
            const sizeVariation = 0.85 + Math.random() * 0.35;
            const fontSize = Math.round(baseSize * sizeVariation);
            const wordWidth = words[i].length * fontSize * 0.55; // Approximate text width

            let x, y;
            let attempts = 0;
            let valid = false;

            while (attempts < 80 && !valid) {
                // Generous margins from edges
                const margin = isMobile ? 20 : 30;
                x = margin + Math.random() * (w - margin * 2 - wordWidth);
                y = margin + fontSize + Math.random() * (h * 0.75 - margin - fontSize);

                // Avoid candle zone (wider exclusion on mobile)
                const candleExcludeW = isMobile ? w * 0.2 : w * 0.12;
                const candleExcludeTop = candle.candleTop - 60;
                const inCandleZone = Math.abs(x + wordWidth / 2 - candle.cx) < candleExcludeW
                    && y > candleExcludeTop;

                // Avoid main message zone at top center
                const inMessageZone = Math.abs(x + wordWidth / 2 - w / 2) < w * 0.3
                    && y < h * 0.22;

                // Avoid overlap with existing placed words
                let overlaps = false;
                for (const p of placed) {
                    const padX = isMobile ? 8 : 12;
                    const padY = isMobile ? 6 : 10;
                    if (Math.abs(x - p.x) < p.w + padX && Math.abs(y - p.y) < p.h + padY) {
                        overlaps = true;
                        break;
                    }
                }

                valid = !inCandleZone && !inMessageZone && !overlaps;
                attempts++;
            }

            if (!valid) {
                // Fallback — just place it somewhere
                x = 20 + Math.random() * (w - 60);
                y = 30 + Math.random() * (h * 0.7);
            }

            placed.push({ x, y, w: wordWidth, h: fontSize });

            this.hiddenWords.push({
                text: words[i],
                x: x + wordWidth / 2, // Store center x for textAlign center
                y,
                opacity: 0,
                revealed: false,
                size: fontSize,
                angle: (Math.random() - 0.5) * 0.15,
            });
        }
    }

    getCandlePosition() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        const isMobile = w < 768;
        const isSmall = w < 480;

        const candleBottom = h * (isMobile ? 0.82 : 0.85);
        const candleHeight = h * (isSmall ? 0.22 : isMobile ? 0.2 : 0.18);
        const candleTop = candleBottom - candleHeight;
        const candleWidth = isSmall ? 30 : isMobile ? 28 : 22;

        return {
            cx: w / 2,
            candleTop,
            candleBottom,
            candleHeight,
            candleWidth
        };
    }

    handleTap(e) {
        if (this.lit) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const candle = this.getCandlePosition();
        const isMobile = window.innerWidth < 768;

        // Check if tap is near the candle wick/top area
        const dx = x - candle.cx;
        const dy = y - candle.candleTop;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const hitRadius = isMobile ? 70 : 50;

        if (dist < hitRadius) {
            this.lit = true;
            this.igniteTime = performance.now();
            this.hintDismissed = true;
        }
    }

    update(time) {
        // Hint
        if (!this.hintDismissed) {
            const elapsed = time - this.startTime;
            if (elapsed > 2000) {
                this.hintOpacity = Math.min(1, (elapsed - 2000) / 2000);
            }
        } else {
            this.hintOpacity = Math.max(0, this.hintOpacity - 0.03);
        }

        if (!this.lit) return;

        // Grow flame
        this.flameScale = Math.min(1, this.flameScale + 0.012);

        // Grow light radius — slow, organic spread
        const timeSinceLit = time - this.igniteTime;
        // Light takes about 8 seconds to fully spread
        this.lightProgress = Math.min(1, timeSinceLit / 8000);

        // Flame physics
        this.flamePhase += 0.05;
        if (Math.random() < 0.08) {
            this.flickerTarget = (Math.random() - 0.5) * 0.4;
            this.flickerSpeed = 0.02 + Math.random() * 0.06;
        }
        this.flameFlicker += (this.flickerTarget - this.flameFlicker) * this.flickerSpeed;

        // Reveal hidden words based on light progress and distance from candle
        const candle = this.getCandlePosition();
        const maxLightDist = Math.max(window.innerWidth, window.innerHeight) * this.lightProgress;

        for (const word of this.hiddenWords) {
            const dx = word.x - candle.cx;
            const dy = word.y - candle.candleTop;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < maxLightDist && !word.revealed) {
                word.revealed = true;
            }

            if (word.revealed) {
                word.opacity = Math.min(1, word.opacity + 0.015);
            }
        }

        // Main message appears when light is ~70% spread
        if (this.lightProgress > 0.7 && !this.mainMessageRevealed) {
            this.mainMessageRevealed = true;
        }
        if (this.mainMessageRevealed) {
            this.mainMessageOpacity = Math.min(1, this.mainMessageOpacity + 0.008);
        }

        // Particles — only when lit
        if (this.flameScale > 0.3 && Math.random() < 0.06) {
            this.particles.push({
                x: 0,
                y: 0,
                vx: (Math.random() - 0.5) * 0.3,
                vy: -0.5 - Math.random() * 0.8,
                life: 1,
                decay: 0.005 + Math.random() * 0.008,
                size: 1 + Math.random() * 1.5
            });
        }

        this.particles = this.particles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.life -= p.decay;
            p.vx += (Math.random() - 0.5) * 0.05;
            return p.life > 0;
        });
    }

    render(time) {
        const ctx = this.ctx;
        const w = window.innerWidth;
        const h = window.innerHeight;
        const isMobile = w < 768;

        // Pitch black background
        ctx.fillStyle = '#020101';
        ctx.fillRect(0, 0, w, h);

        const candle = this.getCandlePosition();
        const { cx, candleTop, candleBottom, candleHeight, candleWidth } = candle;

        // --- Warm ambient glow (only when lit, grows with lightProgress) ---
        if (this.lit && this.lightProgress > 0) {
            const flicker = 0.85 + Math.sin(this.flamePhase * 1.7) * 0.05 + this.flameFlicker * 0.1;
            const glowRadius = Math.max(w, h) * (0.1 + this.lightProgress * 0.8);

            const ambientGlow = ctx.createRadialGradient(
                cx, candleTop - 30, 0,
                cx, candleTop, glowRadius
            );
            const intensity = this.lightProgress * flicker;
            ambientGlow.addColorStop(0, `rgba(255, 180, 80, ${0.08 * intensity})`);
            ambientGlow.addColorStop(0.2, `rgba(255, 150, 60, ${0.04 * intensity})`);
            ambientGlow.addColorStop(0.5, `rgba(200, 110, 40, ${0.015 * intensity})`);
            ambientGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = ambientGlow;
            ctx.fillRect(0, 0, w, h);
        }

        // --- Candle body (always visible, dimly in the dark) ---
        const bodyVisibility = this.lit ? 1 : 0.2; // barely visible when unlit
        const bodyGradient = ctx.createLinearGradient(cx - candleWidth / 2, 0, cx + candleWidth / 2, 0);
        bodyGradient.addColorStop(0, `rgba(232, 220, 200, ${bodyVisibility})`);
        bodyGradient.addColorStop(0.3, `rgba(245, 238, 224, ${bodyVisibility})`);
        bodyGradient.addColorStop(0.7, `rgba(240, 232, 213, ${bodyVisibility})`);
        bodyGradient.addColorStop(1, `rgba(216, 204, 184, ${bodyVisibility})`);

        ctx.fillStyle = bodyGradient;
        ctx.beginPath();
        const bx = cx - candleWidth / 2;
        const by = candleTop;
        const bw = candleWidth;
        const bh = candleHeight;
        ctx.moveTo(bx + 3, by);
        ctx.lineTo(bx + bw - 3, by);
        ctx.quadraticCurveTo(bx + bw, by, bx + bw, by + 3);
        ctx.lineTo(bx + bw, by + bh - 1);
        ctx.quadraticCurveTo(bx + bw, by + bh, bx + bw - 1, by + bh);
        ctx.lineTo(bx + 1, by + bh);
        ctx.quadraticCurveTo(bx, by + bh, bx, by + bh - 1);
        ctx.lineTo(bx, by + 3);
        ctx.quadraticCurveTo(bx, by, bx + 3, by);
        ctx.closePath();
        ctx.fill();

        // Wax drip (scales with candle width)
        ctx.fillStyle = `rgba(245, 238, 225, ${bodyVisibility * 0.6})`;
        ctx.beginPath();
        ctx.ellipse(cx - candleWidth * 0.22, candleTop + 3, candleWidth * 0.17, candleWidth * 0.35, 0.2, 0, Math.PI * 2);
        ctx.fill();

        // --- Wick (always visible) ---
        const wickHeight = isMobile ? 14 : 12;
        const wickSway = this.lit ? (Math.sin(this.flamePhase * 2) * 1 + this.flameFlicker * 3) : 0;
        ctx.strokeStyle = this.lit ? '#1a1510' : 'rgba(40, 35, 28, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cx, candleTop);
        ctx.quadraticCurveTo(cx + wickSway * 0.5, candleTop - wickHeight * 0.5, cx + wickSway, candleTop - wickHeight);
        ctx.stroke();

        // Tiny unlit wick tip (visible in darkness to hint something is there)
        if (!this.lit) {
            ctx.beginPath();
            ctx.arc(cx, candleTop - wickHeight, 2, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(60, 50, 35, 0.5)';
            ctx.fill();
        }

        // --- Flame (only when lit, grows from 0) ---
        if (this.lit && this.flameScale > 0) {
            const flameX = cx + wickSway;
            const flameY = candleTop - wickHeight;
            const scale = this.flameScale;
            const flicker = 0.85 + Math.sin(this.flamePhase * 1.7) * 0.05 + this.flameFlicker * 0.1;
            const flameH = (28 + Math.sin(this.flamePhase * 3) * 4 + this.flameFlicker * 8) * scale;
            const flameW = (10 + Math.sin(this.flamePhase * 2.3) * 2 + Math.abs(this.flameFlicker) * 4) * scale;

            // Flame glow
            const outerGlow = ctx.createRadialGradient(
                flameX, flameY - flameH * 0.3, 0,
                flameX, flameY - flameH * 0.3, flameH * 1.5
            );
            outerGlow.addColorStop(0, `rgba(255, 200, 80, ${0.3 * flicker * scale})`);
            outerGlow.addColorStop(0.5, `rgba(255, 150, 30, ${0.08 * flicker * scale})`);
            outerGlow.addColorStop(1, 'rgba(255, 100, 0, 0)');
            ctx.fillStyle = outerGlow;
            ctx.beginPath();
            ctx.arc(flameX, flameY - flameH * 0.3, flameH * 1.5, 0, Math.PI * 2);
            ctx.fill();

            // Outer flame shape
            ctx.save();
            ctx.translate(flameX, flameY);

            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.quadraticCurveTo(-flameW * 0.8, -flameH * 0.3, -flameW * 0.2, -flameH * 0.7);
            ctx.quadraticCurveTo(0, -flameH * 1.1, flameW * 0.2, -flameH * 0.7);
            ctx.quadraticCurveTo(flameW * 0.8, -flameH * 0.3, 0, 0);
            ctx.closePath();

            const outerFlame = ctx.createLinearGradient(0, 0, 0, -flameH);
            outerFlame.addColorStop(0, `rgba(255, 100, 20, ${0.9 * scale})`);
            outerFlame.addColorStop(0.4, `rgba(255, 180, 50, ${0.85 * scale})`);
            outerFlame.addColorStop(0.8, `rgba(255, 220, 100, ${0.6 * scale})`);
            outerFlame.addColorStop(1, `rgba(255, 255, 200, ${0.1 * scale})`);
            ctx.fillStyle = outerFlame;
            ctx.fill();

            // Inner flame
            const innerH = flameH * 0.55;
            const innerW = flameW * 0.5;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.quadraticCurveTo(-innerW * 0.6, -innerH * 0.3, -innerW * 0.15, -innerH * 0.75);
            ctx.quadraticCurveTo(0, -innerH * 1.05, innerW * 0.15, -innerH * 0.75);
            ctx.quadraticCurveTo(innerW * 0.6, -innerH * 0.3, 0, 0);
            ctx.closePath();

            const innerFlame = ctx.createLinearGradient(0, 0, 0, -innerH);
            innerFlame.addColorStop(0, `rgba(100, 130, 255, ${0.7 * scale})`);
            innerFlame.addColorStop(0.3, `rgba(255, 255, 220, ${0.9 * scale})`);
            innerFlame.addColorStop(0.7, `rgba(255, 255, 180, ${0.7 * scale})`);
            innerFlame.addColorStop(1, `rgba(255, 255, 255, ${0.2 * scale})`);
            ctx.fillStyle = innerFlame;
            ctx.fill();

            ctx.restore();

            // Embers
            for (const p of this.particles) {
                const px = flameX + p.x;
                const py = flameY - flameH * 0.5 + p.y;
                ctx.beginPath();
                ctx.arc(px, py, p.size * p.life, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 200, 100, ${p.life * 0.6})`;
                ctx.fill();
            }
        }

        // --- Hidden words revealed by candlelight ---
        for (const word of this.hiddenWords) {
            if (word.opacity <= 0) continue;

            // Distance-based warmth — closer to candle = warmer color
            const dx = word.x - cx;
            const dy = word.y - candleTop;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const maxDist = Math.max(w, h);
            const warmth = 1 - Math.min(1, dist / maxDist);

            const r = Math.round(255);
            const g = Math.round(200 + warmth * 40);
            const b = Math.round(140 + warmth * 40);

            ctx.save();
            ctx.translate(word.x, word.y);
            ctx.rotate(word.angle);
            ctx.font = `${word.size}px "Lora", "Georgia", serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Soft glow behind word
            ctx.shadowColor = `rgba(255, 200, 120, ${word.opacity * 0.3})`;
            ctx.shadowBlur = 12;
            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${word.opacity * 0.55})`;
            ctx.fillText(word.text, 0, 0);
            ctx.shadowBlur = 0;
            ctx.restore();
        }

        // --- Main message ---
        if (this.mainMessageOpacity > 0) {
            const isSmall = w < 480;
            const fontSize = isSmall ? 16 : isMobile ? 18 : 23;
            const mainLines = [
                'You light up',
                'everything around you.',
                '',
                'You always have.',
            ];

            ctx.font = `${fontSize}px "Lora", "Georgia", serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            const lineHeight = fontSize * (isSmall ? 2 : 2.2);
            const totalH = mainLines.length * lineHeight;
            const startY = h * (isSmall ? 0.12 : 0.18) - totalH / 2;

            for (let i = 0; i < mainLines.length; i++) {
                if (!mainLines[i]) continue;
                ctx.shadowColor = `rgba(255, 200, 120, ${this.mainMessageOpacity * 0.35})`;
                ctx.shadowBlur = 20;
                ctx.fillStyle = `rgba(255, 235, 200, ${this.mainMessageOpacity * 0.8})`;
                ctx.fillText(mainLines[i], w / 2, startY + i * lineHeight);
            }
            ctx.shadowBlur = 0;
        }

        // --- Hint to tap the candle (before lit) ---
        if (!this.lit && this.hintOpacity > 0.01) {
            const pulse = 0.6 + Math.sin(time * 0.003) * 0.4;
            const opacity = this.hintOpacity * 0.45 * pulse;

            // Small downward arrow above candle
            const arrowX = cx;
            const arrowGap = isMobile ? 50 : 40;
            const arrowY = candleTop - arrowGap;

            ctx.save();
            ctx.translate(arrowX, arrowY);

            ctx.strokeStyle = `rgba(200, 180, 150, ${opacity})`;
            ctx.lineWidth = isMobile ? 2 : 1.5;
            ctx.beginPath();
            ctx.moveTo(0, -12);
            ctx.lineTo(0, 2);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(-5, -2);
            ctx.lineTo(0, 4);
            ctx.lineTo(5, -2);
            ctx.stroke();

            ctx.restore();

            const fontSize = isMobile ? 13 : 14;
            ctx.font = `${fontSize}px "Lora", "Georgia", serif`;
            ctx.fillStyle = `rgba(180, 165, 140, ${opacity})`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.fillText('touch to light', cx, arrowY - 16);
        }
    }

    resize() {
        // Only reposition if nothing has been revealed yet
        const anyRevealed = this.hiddenWords.some(w => w.revealed);
        if (!anyRevealed) {
            this.placeWords();
        }
    }
}
