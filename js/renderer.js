// Canvas renderer for night sky and stars

export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.dpr = 1;

        // Hearts animation
        this.hearts = [];
        this.lastHeartTime = 0;
        this.heartInterval = 400; // ms between new hearts

        this.resize();
    }

    resize() {
        this.dpr = window.devicePixelRatio || 1;
        this.canvas.width = window.innerWidth * this.dpr;
        this.canvas.height = window.innerHeight * this.dpr;
        this.ctx.scale(this.dpr, this.dpr);

        return {
            width: window.innerWidth,
            height: window.innerHeight
        };
    }

    clear() {
        const ctx = this.ctx;
        const w = window.innerWidth;
        const h = window.innerHeight;

        // Deep night sky gradient
        const gradient = ctx.createRadialGradient(
            w * 0.5, h * 0.4, 0,
            w * 0.5, h * 0.5, Math.max(w, h) * 0.8
        );
        gradient.addColorStop(0, '#0a0a18');
        gradient.addColorStop(0.5, '#050510');
        gradient.addColorStop(1, '#000008');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);
    }

    render(stars, backgroundStars, initiatorStar, phase, currentTime, connectionLines, linesFadeIn, ansamBounds) {
        this.clear();

        const ctx = this.ctx;

        // Draw background stars first
        for (const star of backgroundStars) {
            this.drawStar(star, currentTime, false);
        }

        // Draw constellation lines (behind main stars)
        if (connectionLines && connectionLines.length > 0 && linesFadeIn > 0) {
            this.drawConnectionLines(connectionLines, linesFadeIn);
        }

        // Draw main stars
        for (const star of stars) {
            this.drawStar(star, currentTime, star.isActivated);
        }

        // Draw initiator star with name
        if (initiatorStar && phase === 'waiting') {
            this.drawInitiatorStar(initiatorStar, currentTime);
        }

        // Draw hearts around ANSAM when complete
        if (phase === 'complete' && ansamBounds) {
            this.updateAndDrawHearts(currentTime, ansamBounds);
        }
    }

    drawConnectionLines(lines, fadeIn) {
        const ctx = this.ctx;

        for (const line of lines) {
            if (!line.visible) continue;

            const opacity = fadeIn * 0.4; // Subtle lines

            // Create gradient along the line for a nicer effect
            const gradient = ctx.createLinearGradient(
                line.fromX, line.fromY,
                line.toX, line.toY
            );
            gradient.addColorStop(0, `rgba(180, 200, 255, ${opacity})`);
            gradient.addColorStop(0.5, `rgba(200, 220, 255, ${opacity * 0.7})`);
            gradient.addColorStop(1, `rgba(180, 200, 255, ${opacity})`);

            ctx.beginPath();
            ctx.moveTo(line.fromX, line.fromY);
            ctx.lineTo(line.toX, line.toY);
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    }

    drawStar(star, currentTime, isActivated) {
        const ctx = this.ctx;
        const { x, y, size, brightness, twinklePhase, glowIntensity } = star;

        // Calculate twinkle
        const twinkle = 0.7 + Math.sin(twinklePhase) * 0.3;
        const finalBrightness = (glowIntensity || brightness) * twinkle;

        // Star color
        let r, g, b;
        if (isActivated) {
            // Warmer, brighter white
            r = 255;
            g = 250;
            b = 240;
        } else {
            // Cool blue-white
            r = 200 + Math.random() * 20;
            g = 210 + Math.random() * 20;
            b = 255;
        }

        // Outer glow
        if (isActivated || glowIntensity > 0.5) {
            const glowSize = size * (isActivated ? 8 : 4);
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, glowSize);
            gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${finalBrightness * 0.4})`);
            gradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${finalBrightness * 0.1})`);
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(x, y, glowSize, 0, Math.PI * 2);
            ctx.fill();
        }

        // Core
        ctx.beginPath();
        ctx.arc(x, y, size * (isActivated ? 1.3 : 1), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${finalBrightness})`;
        ctx.fill();

        // Bright center point
        ctx.beginPath();
        ctx.arc(x, y, size * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${finalBrightness * 1.2})`;
        ctx.fill();
    }

    drawInitiatorStar(star, currentTime) {
        const ctx = this.ctx;
        const { x, y, size, pulsePhase } = star;

        const pulse = 0.85 + Math.sin(pulsePhase) * 0.15;
        const slowPulse = 0.9 + Math.sin(pulsePhase * 0.3) * 0.1;

        // Outer glow - larger and warmer
        const glowSize = size * 12 * slowPulse;
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, glowSize);
        gradient.addColorStop(0, `rgba(255, 252, 245, ${0.5 * pulse})`);
        gradient.addColorStop(0.3, `rgba(255, 248, 235, ${0.2 * pulse})`);
        gradient.addColorStop(0.6, `rgba(255, 245, 225, ${0.08 * pulse})`);
        gradient.addColorStop(1, 'rgba(255, 250, 240, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, glowSize, 0, Math.PI * 2);
        ctx.fill();

        // Secondary subtle glow ring
        const ringSize = size * 6 * pulse;
        ctx.beginPath();
        ctx.arc(x, y, ringSize, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 250, 240, ${0.1 * pulse})`;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Core star
        ctx.beginPath();
        ctx.arc(x, y, size * 1.2 * pulse, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 253, 248, ${0.95})`;
        ctx.fill();

        // Bright center
        ctx.beginPath();
        ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 1)';
        ctx.fill();

        // Subtle cross flare
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.15 * pulse})`;
        ctx.lineWidth = 0.5;

        const flareLength = size * 4 * pulse;
        ctx.beginPath();
        ctx.moveTo(x - flareLength, y);
        ctx.lineTo(x + flareLength, y);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(x, y - flareLength);
        ctx.lineTo(x, y + flareLength);
        ctx.stroke();

        // Draw Arabic name "سهيل" (Sohail) floating near the star
        const floatOffset = Math.sin(pulsePhase * 0.5) * 3;
        const isMobile = window.innerWidth < 768;
        const fontSize = isMobile ? 14 : 16;

        ctx.font = `${fontSize}px "Geeza Pro", "Arabic Typesetting", "Traditional Arabic", serif`;
        ctx.fillStyle = `rgba(255, 250, 240, ${0.6 + pulse * 0.2})`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('سهيل', x, y + size * 3 + floatOffset);
    }

    updateAndDrawHearts(currentTime, bounds) {
        const ctx = this.ctx;

        // Add new hearts periodically
        if (currentTime - this.lastHeartTime > this.heartInterval) {
            this.hearts.push({
                x: bounds.x + Math.random() * bounds.width,
                y: bounds.y + Math.random() * bounds.height,
                size: 8 + Math.random() * 10,
                opacity: 0,
                phase: 'in', // 'in', 'visible', 'out'
                createdAt: currentTime,
                duration: 2000 + Math.random() * 1500
            });
            this.lastHeartTime = currentTime;

            // Limit total hearts
            if (this.hearts.length > 15) {
                this.hearts.shift();
            }
        }

        // Update and draw hearts
        this.hearts = this.hearts.filter(heart => {
            const age = currentTime - heart.createdAt;
            const progress = age / heart.duration;

            if (progress >= 1) return false;

            // Fade in for first 20%, visible for 60%, fade out for last 20%
            if (progress < 0.2) {
                heart.opacity = progress / 0.2;
            } else if (progress < 0.8) {
                heart.opacity = 1;
            } else {
                heart.opacity = (1 - progress) / 0.2;
            }

            // Gentle float upward
            const floatY = heart.y - (age * 0.01);

            this.drawHeart(ctx, heart.x, floatY, heart.size, heart.opacity);
            return true;
        });
    }

    drawHeart(ctx, x, y, size, opacity) {
        ctx.save();
        ctx.translate(x, y);

        ctx.beginPath();
        ctx.moveTo(0, size * 0.3);

        // Left curve
        ctx.bezierCurveTo(
            -size * 0.5, -size * 0.3,
            -size, size * 0.1,
            0, size
        );

        // Right curve
        ctx.bezierCurveTo(
            size, size * 0.1,
            size * 0.5, -size * 0.3,
            0, size * 0.3
        );

        ctx.closePath();

        // Soft pink/red gradient
        const gradient = ctx.createRadialGradient(0, size * 0.4, 0, 0, size * 0.4, size);
        gradient.addColorStop(0, `rgba(255, 150, 170, ${opacity * 0.9})`);
        gradient.addColorStop(1, `rgba(255, 100, 130, ${opacity * 0.7})`);

        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.restore();
    }
}
