// Moon & Clouds Scene
// A large moon with drifting clouds in a starry sky.
// The moon pulses gently to invite interaction.
// Clicking the moon reveals a full message. Each click shows a new one.
// Tapping the sky creates light ripples and pushes clouds.

export default class MoonCloudsScene {
    constructor(canvas, container, message) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.container = container;

        // English-only messages — warm, personal, not poems
        this.messages = [
            'The moon doesn\'t know\nhow beautiful it is\nuntil someone stops\nand looks up.',
            'You don\'t have to be perfect\nto deserve good things.\nYou just have to be you.\nThat\'s already enough.',
            'Some people make the world\nfeel less heavy\njust by existing in it.\nYou\'re one of them.',
            'I hope you know\nthat somewhere tonight\nsomeone is grateful\nyou exist.',
            'You carry more light\nthan you realize.\nEven on the days\nyou feel dim.',
            'Not everyone gets to meet\nsomeone who makes silence\nfeel like home.\nI did.',
            'The best things about you\nare the things\nyou never had to try to be.',
            'You make kindness\nlook effortless\nand strength\nlook gentle.',
            'I hope today was soft on you.\nAnd if it wasn\'t,\nI hope tomorrow is.',
            'You\'re the kind of person\npeople write about\nwithout even knowing\nthey\'re doing it.',
        ];

        this.currentMessageIndex = -1; // nothing shown yet
        this.messageOpacity = 0;
        this.messageFadingIn = false;
        this.messageFadingOut = false;
        this.messageText = '';

        this.clouds = [];
        this.backgroundStars = [];
        this.startTime = 0;
        this.moonPhase = 0;

        // Interaction
        this.ripples = [];
        this.moonTapGlow = 0;

        // Moon idle pulse — makes it look alive and clickable
        this.moonIdlePulse = 0;

        // Shooting star
        this.shootingStar = null;
        this.lastShootingStarTime = 0;

        // Hint
        this.hintOpacity = 0;
        this.hintDismissed = false;
    }

    init() {
        this.startTime = performance.now();

        const w = window.innerWidth;
        const h = window.innerHeight;

        // Generate background stars
        const starCount = Math.floor((w * h) / 10000);
        for (let i = 0; i < starCount; i++) {
            this.backgroundStars.push({
                x: Math.random() * w,
                y: Math.random() * h,
                size: 0.3 + Math.random() * 1.2,
                brightness: 0.2 + Math.random() * 0.5,
                twinkle: Math.random() * Math.PI * 2,
                twinkleSpeed: 0.3 + Math.random() * 0.8
            });
        }

        // Generate clouds
        this.generateClouds();

        // Event listeners
        window.addEventListener('click', (e) => this.handleTap(e));
        window.addEventListener('touchend', (e) => {
            const touch = e.changedTouches[0];
            if (touch) {
                this.handleTap({ clientX: touch.clientX, clientY: touch.clientY });
            }
        });
    }

    generateClouds() {
        const w = window.innerWidth;
        const h = window.innerHeight;

        for (let i = 0; i < 12; i++) {
            this.clouds.push({
                x: (i / 12) * w * 1.2 - w * 0.1,
                y: h * 0.3 + Math.random() * h * 0.4,
                width: 250 + Math.random() * 350,
                height: 55 + Math.random() * 75,
                speed: 0.05 + Math.random() * 0.1,
                opacity: 0.2 + Math.random() * 0.25,
                layer: Math.random(),
                wobble: Math.random() * Math.PI * 2,
                wobbleSpeed: 0.001 + Math.random() * 0.002,
                pushVx: 0,
                pushVy: 0,
                pushed: false
            });
        }

        this.clouds.sort((a, b) => a.layer - b.layer);
    }

    getMoonPosition() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        return {
            x: w * 0.5,
            y: h * 0.25,
            radius: Math.min(w, h) * 0.12
        };
    }

    handleTap(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Create ripple at tap point
        this.ripples.push({
            x, y,
            radius: 0,
            maxRadius: 80 + Math.random() * 60,
            opacity: 0.35,
            speed: 1.5 + Math.random() * 1
        });

        // Check if tapped on the moon
        const moon = this.getMoonPosition();
        const dx = x - moon.x;
        const dy = y - moon.y;
        const distToMoon = Math.sqrt(dx * dx + dy * dy);
        const isMobile = window.innerWidth < 768;
        const hitRadius = isMobile ? moon.radius * 2 : moon.radius * 1.6;

        if (distToMoon < hitRadius) {
            this.onMoonTap();
        }

        // Push nearby clouds
        for (const cloud of this.clouds) {
            const cdx = cloud.x - x;
            const cdy = cloud.y - y;
            const dist = Math.sqrt(cdx * cdx + cdy * cdy);

            if (dist < cloud.width * 0.8) {
                const pushStrength = (1 - dist / (cloud.width * 0.8)) * 3;
                const angle = Math.atan2(cdy, cdx);
                cloud.pushVx += Math.cos(angle) * pushStrength;
                cloud.pushVy += Math.sin(angle) * pushStrength * 0.3;
                cloud.pushed = true;
            }
        }
    }

    onMoonTap() {
        // Big glow burst
        this.moonTapGlow = 1.0;

        // Dismiss hint
        this.hintDismissed = true;

        // If currently showing a message, fade it out then show next
        if (this.messageFadingIn || this.messageOpacity > 0.5) {
            // Fade out current, then show next
            this.messageFadingIn = false;
            this.messageFadingOut = true;
            this.pendingNext = true;
        } else {
            // Show next message directly
            this.showNextMessage();
        }
    }

    showNextMessage() {
        this.currentMessageIndex = (this.currentMessageIndex + 1) % this.messages.length;
        this.messageText = this.messages[this.currentMessageIndex];
        this.messageOpacity = 0;
        this.messageFadingIn = true;
        this.messageFadingOut = false;
        this.pendingNext = false;
    }

    update(time) {
        const w = window.innerWidth;
        const h = window.innerHeight;

        // Update clouds
        for (const cloud of this.clouds) {
            cloud.x += cloud.speed;
            cloud.wobble += cloud.wobbleSpeed;

            if (cloud.pushed) {
                cloud.x += cloud.pushVx;
                cloud.y += cloud.pushVy;
                cloud.pushVx *= 0.96;
                cloud.pushVy *= 0.96;
                if (Math.abs(cloud.pushVx) < 0.01 && Math.abs(cloud.pushVy) < 0.01) {
                    cloud.pushVx = 0;
                    cloud.pushVy = 0;
                }
            }

            const targetY = h * 0.3 + cloud.layer * h * 0.4;
            cloud.y += (targetY - cloud.y) * 0.001;

            if (cloud.x - cloud.width / 2 > w + 200) {
                cloud.x = -cloud.width - 200;
                cloud.pushed = false;
                cloud.pushVx = 0;
                cloud.pushVy = 0;
            }
        }

        // Moon phase for idle pulse
        this.moonPhase += 0.003;
        this.moonIdlePulse = 0.5 + Math.sin(this.moonPhase * 1.5) * 0.5; // 0 to 1

        // Decay moon tap glow
        if (this.moonTapGlow > 0) {
            this.moonTapGlow *= 0.98;
            if (this.moonTapGlow < 0.01) this.moonTapGlow = 0;
        }

        // Update ripples
        this.ripples = this.ripples.filter(r => {
            r.radius += r.speed;
            r.opacity -= 0.004;
            return r.opacity > 0;
        });

        // Message fade in/out
        if (this.messageFadingIn) {
            this.messageOpacity = Math.min(1, this.messageOpacity + 0.018);
            if (this.messageOpacity >= 1) {
                this.messageFadingIn = false;
            }
        }
        if (this.messageFadingOut) {
            this.messageOpacity = Math.max(0, this.messageOpacity - 0.025);
            if (this.messageOpacity <= 0) {
                this.messageFadingOut = false;
                if (this.pendingNext) {
                    this.showNextMessage();
                }
            }
        }

        // Hint fade in after 2.5s
        if (!this.hintDismissed) {
            const elapsed = time - this.startTime;
            if (elapsed > 2500) {
                this.hintOpacity = Math.min(1, (elapsed - 2500) / 2000);
            }
        } else {
            this.hintOpacity = Math.max(0, this.hintOpacity - 0.02);
        }

        // Shooting star
        if (time - this.lastShootingStarTime > 12000 + Math.random() * 20000) {
            if (!this.shootingStar) {
                this.shootingStar = {
                    x: Math.random() * w * 0.6 + w * 0.1,
                    y: Math.random() * h * 0.2,
                    vx: 3 + Math.random() * 4,
                    vy: 1.5 + Math.random() * 2,
                    life: 1,
                    trail: []
                };
                this.lastShootingStarTime = time;
            }
        }

        if (this.shootingStar) {
            const ss = this.shootingStar;
            ss.x += ss.vx;
            ss.y += ss.vy;
            ss.life -= 0.015;
            ss.trail.push({ x: ss.x, y: ss.y, opacity: ss.life });
            if (ss.trail.length > 20) ss.trail.shift();
            if (ss.life <= 0 || ss.x > w || ss.y > h) {
                this.shootingStar = null;
            }
        }
    }

    render(time) {
        const ctx = this.ctx;
        const w = window.innerWidth;
        const h = window.innerHeight;

        // Dark night sky
        const skyGradient = ctx.createLinearGradient(0, 0, 0, h);
        skyGradient.addColorStop(0, '#050515');
        skyGradient.addColorStop(0.4, '#080820');
        skyGradient.addColorStop(1, '#040410');
        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, 0, w, h);

        // Draw stars
        for (const star of this.backgroundStars) {
            star.twinkle += star.twinkleSpeed * 0.015;
            const twinkle = 0.6 + Math.sin(star.twinkle) * 0.4;
            const brightness = star.brightness * twinkle;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(200, 210, 255, ${brightness})`;
            ctx.fill();
        }

        // Shooting star
        if (this.shootingStar) {
            const ss = this.shootingStar;
            for (let i = 0; i < ss.trail.length; i++) {
                const t = ss.trail[i];
                const trailOpacity = (i / ss.trail.length) * t.opacity * 0.6;
                const trailSize = (i / ss.trail.length) * 1.5;
                ctx.beginPath();
                ctx.arc(t.x, t.y, trailSize, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(230, 240, 255, ${trailOpacity})`;
                ctx.fill();
            }
        }

        // Moon
        const moon = this.getMoonPosition();

        // Idle breathing glow — makes moon look alive/interactive
        const breathe = this.moonIdlePulse;
        const tapGlow = this.moonTapGlow;
        const combinedGlow = Math.max(breathe * 0.3, tapGlow);

        // Outer halo that pulses (the "come tap me" indicator)
        const haloRadius = moon.radius * (1.8 + breathe * 0.4 + tapGlow * 1.5);
        const haloGradient = ctx.createRadialGradient(
            moon.x, moon.y, moon.radius,
            moon.x, moon.y, haloRadius
        );
        haloGradient.addColorStop(0, `rgba(200, 215, 245, ${0.08 + combinedGlow * 0.12})`);
        haloGradient.addColorStop(0.5, `rgba(180, 200, 235, ${0.03 + combinedGlow * 0.05})`);
        haloGradient.addColorStop(1, 'rgba(150, 180, 220, 0)');
        ctx.fillStyle = haloGradient;
        ctx.beginPath();
        ctx.arc(moon.x, moon.y, haloRadius, 0, Math.PI * 2);
        ctx.fill();

        // Wider ambient glow
        const ambientRadius = moon.radius * (4 + tapGlow * 2);
        const moonGlow = ctx.createRadialGradient(
            moon.x, moon.y, moon.radius * 0.8,
            moon.x, moon.y, ambientRadius
        );
        moonGlow.addColorStop(0, `rgba(200, 210, 235, ${0.12 + tapGlow * 0.15})`);
        moonGlow.addColorStop(0.3, `rgba(180, 195, 225, ${0.04 + tapGlow * 0.06})`);
        moonGlow.addColorStop(0.6, `rgba(150, 170, 210, ${0.01 + tapGlow * 0.02})`);
        moonGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = moonGlow;
        ctx.beginPath();
        ctx.arc(moon.x, moon.y, ambientRadius, 0, Math.PI * 2);
        ctx.fill();

        // Moon body
        const bodyBrightness = 1 + tapGlow * 0.2 + breathe * 0.03;
        const moonBody = ctx.createRadialGradient(
            moon.x - moon.radius * 0.15, moon.y - moon.radius * 0.15, 0,
            moon.x, moon.y, moon.radius
        );
        moonBody.addColorStop(0, this.adjustBrightness('#f0ede5', bodyBrightness));
        moonBody.addColorStop(0.5, this.adjustBrightness('#e0dcd0', bodyBrightness));
        moonBody.addColorStop(0.85, this.adjustBrightness('#ccc8bc', bodyBrightness));
        moonBody.addColorStop(1, this.adjustBrightness('#b8b4a8', bodyBrightness));
        ctx.fillStyle = moonBody;
        ctx.beginPath();
        ctx.arc(moon.x, moon.y, moon.radius, 0, Math.PI * 2);
        ctx.fill();

        // Craters
        this.drawCrater(ctx, moon.x - moon.radius * 0.3, moon.y - moon.radius * 0.2, moon.radius * 0.12, 0.06);
        this.drawCrater(ctx, moon.x + moon.radius * 0.25, moon.y + moon.radius * 0.15, moon.radius * 0.18, 0.04);
        this.drawCrater(ctx, moon.x - moon.radius * 0.1, moon.y + moon.radius * 0.4, moon.radius * 0.1, 0.05);
        this.drawCrater(ctx, moon.x + moon.radius * 0.45, moon.y - moon.radius * 0.3, moon.radius * 0.08, 0.04);

        // Her name etched into the moon surface
        const nameSize = moon.radius * 0.38;
        ctx.save();
        ctx.font = `${nameSize}px "Amiri", "Geeza Pro", serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        // Slightly darker than the moon surface — like an engraving
        ctx.fillStyle = `rgba(165, 158, 145, ${0.18 + tapGlow * 0.12})`;
        ctx.fillText('أنسام', moon.x + moon.radius * 0.05, moon.y + moon.radius * 0.1);
        ctx.restore();

        // Tap burst ring
        if (tapGlow > 0.05) {
            const ringRadius = moon.radius * (1.3 + tapGlow * 0.8);
            ctx.beginPath();
            ctx.arc(moon.x, moon.y, ringRadius, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(220, 230, 255, ${tapGlow * 0.2})`;
            ctx.lineWidth = 2;
            ctx.stroke();

            // Second ring expanding outward
            const ring2Radius = moon.radius * (1.6 + tapGlow * 1.5);
            ctx.beginPath();
            ctx.arc(moon.x, moon.y, ring2Radius, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(200, 215, 245, ${tapGlow * 0.08})`;
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        // Ripples (from sky taps)
        for (const r of this.ripples) {
            ctx.beginPath();
            ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(180, 200, 240, ${r.opacity * 0.5})`;
            ctx.lineWidth = 1.5;
            ctx.stroke();

            if (r.radius > 15) {
                ctx.beginPath();
                ctx.arc(r.x, r.y, r.radius * 0.6, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(200, 215, 250, ${r.opacity * 0.25})`;
                ctx.lineWidth = 1;
                ctx.stroke();
            }
        }

        // Back-layer clouds
        for (const cloud of this.clouds) {
            if (cloud.layer < 0.5) {
                this.drawCloud(ctx, cloud);
            }
        }

        // Message below the moon
        if (this.messageOpacity > 0 && this.messageText) {
            this.renderMessage(ctx, w, h, time);
        }

        // Front-layer clouds
        for (const cloud of this.clouds) {
            if (cloud.layer >= 0.5) {
                this.drawCloud(ctx, cloud);
            }
        }

        // Hint — arrow pointing up at moon + text
        if (this.hintOpacity > 0.01) {
            this.renderHint(ctx, w, h, time, moon);
        }
    }

    renderMessage(ctx, w, h, time) {
        const isMobile = w < 768;
        const fontSize = isMobile ? 16 : 22;
        ctx.font = `${fontSize}px "Lora", "Georgia", serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const lines = this.messageText.split('\n');
        const lineHeight = fontSize * 2.2;
        const totalHeight = lines.length * lineHeight;
        const startY = h * 0.55 - totalHeight / 2;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (!line) continue;

            ctx.shadowColor = `rgba(180, 200, 240, ${this.messageOpacity * 0.4})`;
            ctx.shadowBlur = 20;
            ctx.fillStyle = `rgba(210, 220, 240, ${this.messageOpacity * 0.85})`;
            ctx.fillText(line, w / 2, startY + i * lineHeight);
        }

        ctx.shadowBlur = 0;
    }

    renderHint(ctx, w, h, time, moon) {
        const pulse = 0.6 + Math.sin(time * 0.003) * 0.4;
        const opacity = this.hintOpacity * 0.4 * pulse;

        const hintY = moon.y + moon.radius + 35;
        const isMobile = w < 768;

        // Small upward arrow pointing at moon
        ctx.save();
        ctx.translate(w / 2, hintY);

        // Arrow
        ctx.strokeStyle = `rgba(200, 215, 240, ${opacity})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -12);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(-5, -7);
        ctx.lineTo(0, -13);
        ctx.lineTo(5, -7);
        ctx.strokeStyle = `rgba(200, 215, 240, ${opacity})`;
        ctx.stroke();

        ctx.restore();

        // Text below arrow
        ctx.font = `${isMobile ? 12 : 14}px "Lora", "Georgia", serif`;
        ctx.fillStyle = `rgba(180, 195, 225, ${opacity})`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('tap the moon', w / 2, hintY + 6);
    }

    adjustBrightness(hex, factor) {
        const r = Math.min(255, parseInt(hex.slice(1, 3), 16) * factor);
        const g = Math.min(255, parseInt(hex.slice(3, 5), 16) * factor);
        const b = Math.min(255, parseInt(hex.slice(5, 7), 16) * factor);
        return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
    }

    drawCrater(ctx, x, y, radius, opacity) {
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(160, 155, 145, ${opacity})`;
        ctx.fill();
    }

    drawCloud(ctx, cloud) {
        const { x, y, width, height, opacity, wobble } = cloud;
        const wobbleY = Math.sin(wobble) * 8;

        ctx.save();
        ctx.globalAlpha = opacity;

        const gradient = ctx.createRadialGradient(x, y + wobbleY, 0, x, y + wobbleY, width * 0.6);
        gradient.addColorStop(0, 'rgba(40, 45, 60, 1)');
        gradient.addColorStop(0.5, 'rgba(30, 35, 50, 0.8)');
        gradient.addColorStop(1, 'rgba(20, 25, 40, 0)');

        ctx.fillStyle = gradient;

        ctx.beginPath();
        ctx.ellipse(x, y + wobbleY, width * 0.5, height * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.ellipse(x - width * 0.25, y + wobbleY - height * 0.1, width * 0.3, height * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.ellipse(x + width * 0.2, y + wobbleY + height * 0.05, width * 0.28, height * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.ellipse(x + width * 0.35, y + wobbleY - height * 0.08, width * 0.2, height * 0.25, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    resize() {
        this.backgroundStars = [];
        const w = window.innerWidth;
        const h = window.innerHeight;
        const starCount = Math.floor((w * h) / 10000);
        for (let i = 0; i < starCount; i++) {
            this.backgroundStars.push({
                x: Math.random() * w,
                y: Math.random() * h,
                size: 0.3 + Math.random() * 1.2,
                brightness: 0.2 + Math.random() * 0.5,
                twinkle: Math.random() * Math.PI * 2,
                twinkleSpeed: 0.3 + Math.random() * 0.8
            });
        }
    }
}
