// Sunflower Field Scene
// A field of sunflowers. Hold to blow — petals scatter in the wind.
// Pure visual experience, no message. Just beauty.

export default class DandelionBlowScene {
    constructor(canvas, container, message) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.container = container;
        this.message = message;

        this.flowers = [];
        this.petals = []; // Loose petals floating in the wind
        this.isBlowing = false;
        this.hintEl = null;
        this.startTime = 0;
        this.windPhase = 0;
        this.blowStrength = 0; // Ramps up while holding, fades when released
    }

    init() {
        this.startTime = performance.now();
        this.generateFlowers();

        // Hint
        this.hintEl = document.createElement('div');
        this.hintEl.className = 'dandelion-hint';
        this.hintEl.textContent = this.message.lang === 'ar' ? 'اضغطي مطولاً' : 'Press and hold';

        const scene = document.createElement('div');
        scene.className = 'dandelion-scene scene-fade-in';
        scene.appendChild(this.hintEl);
        this.container.appendChild(scene);

        setTimeout(() => {
            this.hintEl.classList.add('visible');
        }, 2000);

        // Hold events
        window.addEventListener('mousedown', () => this.startBlow());
        window.addEventListener('mouseup', () => this.stopBlow());
        window.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.startBlow();
        }, { passive: false });
        window.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.stopBlow();
        }, { passive: false });
    }

    generateFlowers() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        const count = 15 + Math.floor(Math.random() * 4); // 15-18

        this.flowers = [];
        for (let i = 0; i < count; i++) {
            // Distribute across the width, with depth layers
            const depth = Math.random(); // 0 = far back, 1 = foreground
            const scale = 0.35 + depth * 0.65;
            const groundY = h * (0.55 + depth * 0.35); // Back flowers higher, front lower
            const stemHeight = (120 + Math.random() * 100) * scale;

            const flower = {
                x: w * (0.05 + Math.random() * 0.9),
                groundY: groundY,
                stemHeight: stemHeight,
                headY: groundY - stemHeight,
                headRadius: (14 + Math.random() * 10) * scale,
                scale: scale,
                depth: depth,
                petalCount: 14 + Math.floor(Math.random() * 6),
                // Each petal tracks its own state
                petals: [],
                swayOffset: Math.random() * Math.PI * 2,
                swayAmount: 2 + Math.random() * 3,
                // Leaves
                leaves: [
                    { t: 0.3 + Math.random() * 0.15, side: -1, scale: 0.6 + Math.random() * 0.4 },
                    { t: 0.5 + Math.random() * 0.15, side: 1, scale: 0.5 + Math.random() * 0.4 }
                ]
            };

            // Generate petals for this flower
            for (let p = 0; p < flower.petalCount; p++) {
                flower.petals.push({
                    angle: (p / flower.petalCount) * Math.PI * 2,
                    attached: true,
                    detachTime: 0,
                    brightness: 0.8 + Math.random() * 0.2,
                    lengthMult: 0.9 + Math.random() * 0.2,
                    widthMult: 0.8 + Math.random() * 0.4
                });
            }

            this.flowers.push(flower);
        }

        // Sort by depth so far flowers render first
        this.flowers.sort((a, b) => a.depth - b.depth);
    }

    startBlow() {
        this.isBlowing = true;
        if (this.hintEl && this.hintEl.classList.contains('visible')) {
            this.hintEl.classList.add('fade-out');
        }
    }

    stopBlow() {
        this.isBlowing = false;
    }

    update(time) {
        this.windPhase += 0.008;

        // Ramp blow strength
        if (this.isBlowing) {
            this.blowStrength = Math.min(1, this.blowStrength + 0.02);
        } else {
            this.blowStrength = Math.max(0, this.blowStrength - 0.01);
        }

        // Detach petals while blowing
        if (this.blowStrength > 0.2) {
            for (const flower of this.flowers) {
                const attached = flower.petals.filter(p => p.attached);
                if (attached.length === 0) continue;

                // Probability of detaching a petal — stronger blow = faster
                const prob = this.blowStrength * 0.03;
                if (Math.random() < prob) {
                    // Pick a random attached petal
                    const petal = attached[Math.floor(Math.random() * attached.length)];
                    petal.attached = false;
                    petal.detachTime = time;

                    // Spawn a loose petal
                    const sway = Math.sin(this.windPhase + flower.swayOffset) * flower.swayAmount;
                    const headX = flower.x + sway * 0.5;
                    const headY = flower.headY;
                    const petalLen = flower.headRadius * 1.1 * petal.lengthMult;
                    const tipX = headX + Math.cos(petal.angle) * (flower.headRadius * 0.6 + petalLen);
                    const tipY = headY + Math.sin(petal.angle) * (flower.headRadius * 0.6 + petalLen);

                    this.petals.push({
                        x: tipX,
                        y: tipY,
                        vx: 1.5 + Math.random() * 2.5 + this.blowStrength * 2,
                        vy: -1.5 + Math.random() * 2,
                        rotation: petal.angle,
                        rotSpeed: (Math.random() - 0.5) * 0.06,
                        size: flower.headRadius * 0.5 * petal.lengthMult,
                        widthMult: petal.widthMult,
                        brightness: petal.brightness,
                        opacity: 0.85,
                        life: 0,
                        scale: flower.scale
                    });
                }
            }
        }

        const w = window.innerWidth;
        const h = window.innerHeight;

        // Update loose petals
        for (const p of this.petals) {
            p.life += 1;

            // Wind + gravity
            const wind = Math.sin(this.windPhase * 2 + p.life * 0.02) * 0.3;
            p.vx += wind * 0.05 + this.blowStrength * 0.08;
            p.vy += 0.025; // Gentle gravity
            p.vx *= 0.993;
            p.vy *= 0.993;

            // Flutter — oscillate vy for leaf-like tumbling
            p.vy += Math.sin(p.life * 0.08 + p.rotation) * 0.06;

            p.x += p.vx;
            p.y += p.vy;
            p.rotation += p.rotSpeed;

            // Fade out over time or when off screen
            if (p.life > 200) {
                p.opacity -= 0.005;
            }
            if (p.x > w + 50 || p.y > h + 50 || p.x < -50) {
                p.opacity -= 0.02;
            }
        }

        // Remove dead petals
        this.petals = this.petals.filter(p => p.opacity > 0);
    }

    render(time) {
        const ctx = this.ctx;
        const w = window.innerWidth;
        const h = window.innerHeight;

        // Sky gradient — warm dusk
        const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
        skyGrad.addColorStop(0, '#0a0812');
        skyGrad.addColorStop(0.3, '#12100a');
        skyGrad.addColorStop(0.6, '#1a150c');
        skyGrad.addColorStop(1, '#0d0b06');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, w, h);

        // Subtle ground
        const groundTop = h * 0.55;
        const gndGrad = ctx.createLinearGradient(0, groundTop, 0, h);
        gndGrad.addColorStop(0, 'rgba(20, 25, 10, 0)');
        gndGrad.addColorStop(0.3, 'rgba(20, 25, 10, 0.15)');
        gndGrad.addColorStop(1, 'rgba(15, 18, 8, 0.4)');
        ctx.fillStyle = gndGrad;
        ctx.fillRect(0, groundTop, w, h - groundTop);

        // Draw each flower
        for (const flower of this.flowers) {
            this.renderFlower(ctx, flower, time);
        }

        // Draw loose petals (on top of everything)
        for (const p of this.petals) {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);
            ctx.globalAlpha = p.opacity;
            ctx.scale(p.scale, p.scale);

            const len = p.size;
            const wid = len * 0.35 * p.widthMult;

            ctx.beginPath();
            ctx.moveTo(-len * 0.3, 0);
            ctx.quadraticCurveTo(0, -wid, len * 0.7, 0);
            ctx.quadraticCurveTo(0, wid, -len * 0.3, 0);
            ctx.closePath();

            const r = Math.floor(230 * p.brightness);
            const g = Math.floor(180 * p.brightness);
            const b = Math.floor(30 * p.brightness);
            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.85)`;
            ctx.fill();

            ctx.restore();
        }
    }

    renderFlower(ctx, flower, time) {
        const sway = Math.sin(this.windPhase * 2 + flower.swayOffset) * flower.swayAmount;
        const blowSway = this.blowStrength * 8; // Extra lean when blowing
        const totalSway = sway + blowSway;

        const baseX = flower.x;
        const baseY = flower.groundY;
        const headX = baseX + totalSway * 0.5;
        const headY = flower.headY + Math.abs(totalSway) * 0.1; // Slight dip when swaying
        const midX = baseX + totalSway * 0.25;
        const midY = (baseY + headY) / 2;

        ctx.save();

        // Depth-based dimming
        const dimFactor = 0.4 + flower.depth * 0.6;

        // Draw leaves
        for (const leaf of flower.leaves) {
            const lx = baseX + (midX - baseX) * leaf.t + totalSway * leaf.t * 0.3;
            const ly = baseY + (headY - baseY) * leaf.t;
            this.drawLeaf(ctx, lx, ly, leaf.side * (0.3 + totalSway * 0.02), flower.scale * leaf.scale, dimFactor);
        }

        // Draw stem
        ctx.strokeStyle = `rgba(${Math.floor(55 * dimFactor)}, ${Math.floor(85 * dimFactor)}, ${Math.floor(28 * dimFactor)}, 0.85)`;
        ctx.lineWidth = Math.max(2, 3.5 * flower.scale);
        ctx.beginPath();
        ctx.moveTo(baseX, baseY);
        ctx.quadraticCurveTo(midX, midY, headX, headY);
        ctx.stroke();

        // Stem highlight
        ctx.strokeStyle = `rgba(${Math.floor(75 * dimFactor)}, ${Math.floor(110 * dimFactor)}, ${Math.floor(38 * dimFactor)}, 0.25)`;
        ctx.lineWidth = Math.max(1, 1.5 * flower.scale);
        ctx.beginPath();
        ctx.moveTo(baseX - 0.5, baseY);
        ctx.quadraticCurveTo(midX - 0.5, midY, headX - 0.5, headY);
        ctx.stroke();

        // Draw attached petals
        const petalLength = flower.headRadius * 1.1;
        const petalWidth = flower.headRadius * 0.3;

        for (const petal of flower.petals) {
            if (!petal.attached) continue;

            const angle = petal.angle + totalSway * 0.01;
            const len = petalLength * petal.lengthMult;
            const wid = petalWidth * petal.widthMult;

            const pBaseX = headX + Math.cos(angle) * flower.headRadius * 0.55;
            const pBaseY = headY + Math.sin(angle) * flower.headRadius * 0.55;
            const tipX = headX + Math.cos(angle) * (flower.headRadius * 0.55 + len);
            const tipY = headY + Math.sin(angle) * (flower.headRadius * 0.55 + len);

            const perpX = -Math.sin(angle) * wid;
            const perpY = Math.cos(angle) * wid;

            ctx.beginPath();
            ctx.moveTo(pBaseX, pBaseY);
            ctx.quadraticCurveTo(
                (pBaseX + tipX) / 2 + perpX,
                (pBaseY + tipY) / 2 + perpY,
                tipX, tipY
            );
            ctx.quadraticCurveTo(
                (pBaseX + tipX) / 2 - perpX,
                (pBaseY + tipY) / 2 - perpY,
                pBaseX, pBaseY
            );
            ctx.closePath();

            const b = petal.brightness * dimFactor;
            const shimmer = 1 + Math.sin(time * 0.001 + petal.angle * 3) * 0.05;
            const r = Math.floor(230 * b * shimmer);
            const g = Math.floor(180 * b * shimmer);
            const bl = Math.floor(30 * b * shimmer);
            ctx.fillStyle = `rgba(${r}, ${g}, ${bl}, 0.8)`;
            ctx.fill();

            ctx.strokeStyle = `rgba(${Math.floor(180 * dimFactor)}, ${Math.floor(130 * dimFactor)}, ${Math.floor(20 * dimFactor)}, 0.2)`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
        }

        // Draw center disc
        const discR = flower.headRadius * 0.6;
        const discGrad = ctx.createRadialGradient(
            headX - discR * 0.15, headY - discR * 0.15, 0,
            headX, headY, discR
        );
        discGrad.addColorStop(0, `rgba(${Math.floor(90 * dimFactor)}, ${Math.floor(60 * dimFactor)}, ${Math.floor(20 * dimFactor)}, 0.95)`);
        discGrad.addColorStop(0.6, `rgba(${Math.floor(55 * dimFactor)}, ${Math.floor(32 * dimFactor)}, ${Math.floor(10 * dimFactor)}, 0.95)`);
        discGrad.addColorStop(1, `rgba(${Math.floor(35 * dimFactor)}, ${Math.floor(20 * dimFactor)}, ${Math.floor(6 * dimFactor)}, 0.9)`);
        ctx.fillStyle = discGrad;
        ctx.beginPath();
        ctx.arc(headX, headY, discR, 0, Math.PI * 2);
        ctx.fill();

        // Spiral seed dots on disc
        const dotCount = 25;
        for (let i = 0; i < dotCount; i++) {
            const theta = i * 2.4;
            const r = Math.sqrt(i / dotCount) * (discR - 2);
            const dx = headX + Math.cos(theta) * r;
            const dy = headY + Math.sin(theta) * r;

            ctx.beginPath();
            ctx.arc(dx, dy, 1.2 * flower.scale, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${Math.floor(25 * dimFactor)}, ${Math.floor(15 * dimFactor)}, ${Math.floor(5 * dimFactor)}, 0.5)`;
            ctx.fill();
        }

        ctx.restore();
    }

    drawLeaf(ctx, x, y, angle, scale, dim) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);

        const len = 30 * scale;
        const wid = 9 * scale;

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(wid, -len * 0.4, len * 0.2, -len);
        ctx.quadraticCurveTo(-wid * 0.4, -len * 0.6, 0, 0);
        ctx.closePath();

        ctx.fillStyle = `rgba(${Math.floor(45 * dim)}, ${Math.floor(72 * dim)}, ${Math.floor(22 * dim)}, 0.6)`;
        ctx.fill();
        ctx.strokeStyle = `rgba(${Math.floor(35 * dim)}, ${Math.floor(58 * dim)}, ${Math.floor(18 * dim)}, 0.3)`;
        ctx.lineWidth = 0.6;
        ctx.stroke();

        ctx.restore();
    }

    resize() {
        this.generateFlowers();
    }
}
