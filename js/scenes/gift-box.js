// Gift Box Scene
// A wrapped gift box wobbles invitingly. Press and hold to unwrap.
// When fully opened, sky blue hearts burst out and bounce within the screen.
// A personal message reveals: "You fix smiles all day — this one's for you."

export default class GiftBoxScene {
    constructor(canvas, container, message) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.container = container;
        this.message = message;

        // Hold state
        this.isHolding = false;
        this.holdProgress = 0; // 0 = wrapped, 1 = fully open
        this.holdOnBox = false;

        // Box state
        this.boxShakePhase = 0;
        this.boxShakeIntensity = 0;
        this.lidOpenAmount = 0;
        this.ribbonLoose = 0;

        // Light seeping through cracks
        this.crackGlow = 0;

        // Hearts
        this.hearts = [];
        this.heartsBurst = false;

        // Letter formation
        this.formationStarted = false;
        this.formationTime = 0; // time when formation begins
        this.ribbonOpacity = 0; // ribbon emoji fade-in
        this.letterTopX = 0;
        this.letterTopY = 0;

        // Background stars
        this.bgStars = [];

        // Floating ambient particles (soft bokeh-like)
        this.bgParticles = [];

        // Ambient sparkles (near box)
        this.sparkles = [];

        // Messages — cycle through in random order
        this.allMessages = [
            'You fix smiles all day \u2014 this one\u2019s for you.',
            'A small surprise for my favorite dentist.',
            'Prescribed: one well-deserved smile.',
            'Side effect: spontaneous happiness.',
            'Your smile might be my favorite one.',
            'Official diagnosis: you\u2019re wonderful.',
            'Some hearts escaped just to find you.',
            'You make ordinary days better.',
            'Just a reminder that you\u2019re special.',
            'This was made just for you.',
            'The world is brighter with your smile in it.',
            'Tiny moment of happiness delivered.',
            'Someone out there appreciates you a lot.',
            'Today felt like a good day to remind you.',
            'In case no one told you today: you\u2019re amazing.',
        ];
        // Shuffle messages
        this.messageOrder = [...this.allMessages].sort(() => Math.random() - 0.5);
        this.messageIndex = 0;
        this.messageOpacity = 0;
        this.messagePhase = 'waiting'; // waiting | fadein | hold | fadeout
        this.messagePhaseStart = 0;
        this._messageRevealStart = 0;

        // Confetti burst particles (gold/white, ~40, on box open)
        this.confetti = [];

        // Pop sparkles (from tapping orbit hearts)
        this.popSparkles = [];

        // Glow behind formed letter A
        this.letterGlowOpacity = 0;

        // Shooting star (triggered when all orbit hearts are popped)
        this.shootingStar = null;
        this._allOrbitsPopped = false;
        this._allOrbitsPoppedTime = 0;

        // Tilt parallax (mobile gyroscope)
        this.tiltX = 0;
        this.tiltY = 0;
        this._rawTiltX = 0;
        this._rawTiltY = 0;

        // Hint
        this.hintEl = null;
        this.hintDismissed = false;
        this.startTime = 0;

        // Bound handlers
        this._onMouseDown = (e) => this.handleStart(e.clientX, e.clientY);
        this._onMouseUp = () => this.handleEnd();
        // Touch tap tracking for orbit heart easter egg
        this._touchStartPos = null;
        this._touchStartTime = 0;

        this._onTouchStart = (e) => {
            e.preventDefault();
            const t = e.touches[0];
            if (t) {
                this._touchStartPos = { x: t.clientX, y: t.clientY };
                this._touchStartTime = performance.now();
                this.handleStart(t.clientX, t.clientY);
            }
        };
        this._onTouchEnd = (e) => {
            e.preventDefault();
            const t = e.changedTouches?.[0];
            // Detect tap: short duration (<300ms) and minimal movement (<15px)
            if (t && this._touchStartPos && this.formationStarted) {
                const dt = performance.now() - this._touchStartTime;
                const dx = t.clientX - this._touchStartPos.x;
                const dy = t.clientY - this._touchStartPos.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dt < 300 && dist < 15) {
                    this.handleHeartTap(t.clientX, t.clientY);
                }
            }
            this._touchStartPos = null;
            this.handleEnd();
        };

        // Click handler for desktop orbit heart tap
        this._onTap = (e) => {
            if (!this.formationStarted) return;
            this.handleHeartTap(e.clientX, e.clientY);
        };

        // Tilt handler
        this._onDeviceOrientation = (e) => {
            if (e.gamma != null) this._rawTiltX = Math.max(-30, Math.min(30, e.gamma));
            if (e.beta != null) this._rawTiltY = Math.max(-30, Math.min(30, e.beta - 45));
        };
    }

    init() {
        this.startTime = performance.now();

        // Generate background stars
        this.generateBgStars();

        // Generate floating particles
        this.generateBgParticles();

        // Generate initial sparkles
        for (let i = 0; i < 20; i++) {
            this.spawnSparkle();
        }

        // Hint element
        this.hintEl = document.createElement('div');
        this.hintEl.className = 'gift-hint';
        this.hintEl.textContent = 'hold to open';

        const scene = document.createElement('div');
        scene.className = 'gift-scene scene-fade-in';
        scene.appendChild(this.hintEl);
        this.container.appendChild(scene);

        setTimeout(() => {
            if (this.hintEl) this.hintEl.classList.add('visible');
        }, 2500);

        // Events
        window.addEventListener('mousedown', this._onMouseDown);
        window.addEventListener('mouseup', this._onMouseUp);
        window.addEventListener('touchstart', this._onTouchStart, { passive: false });
        window.addEventListener('touchend', this._onTouchEnd, { passive: false });

        // Tap for orbit heart easter egg (use click / touchend for tap detection)
        window.addEventListener('click', this._onTap);

        // Tilt parallax — request permission on iOS 13+
        if (typeof DeviceOrientationEvent !== 'undefined') {
            if (typeof DeviceOrientationEvent.requestPermission === 'function') {
                // iOS 13+ — we'll request on first user interaction
                const requestTilt = () => {
                    DeviceOrientationEvent.requestPermission().then(state => {
                        if (state === 'granted') {
                            window.addEventListener('deviceorientation', this._onDeviceOrientation);
                        }
                    }).catch(() => {});
                    window.removeEventListener('touchstart', requestTilt);
                };
                window.addEventListener('touchstart', requestTilt, { once: true });
                this._tiltPermissionHandler = requestTilt;
            } else {
                window.addEventListener('deviceorientation', this._onDeviceOrientation);
            }
        }
    }

    getBoxDimensions() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        const isMobile = w < 768;
        const isSmall = w < 480;

        const boxW = isSmall ? 130 : isMobile ? 155 : 170;
        const boxH = isSmall ? 110 : isMobile ? 130 : 140;
        const lidH = isSmall ? 32 : isMobile ? 38 : 42;
        const cx = w / 2;
        const cy = h / 2 + (isMobile ? 10 : 0);

        return { boxW, boxH, lidH, cx, cy, isMobile, isSmall };
    }

    isPointOnBox(px, py) {
        const { boxW, boxH, lidH, cx, cy } = this.getBoxDimensions();
        const pad = 50;
        const left = cx - boxW / 2 - pad;
        const right = cx + boxW / 2 + pad;
        const top = cy - boxH / 2 - lidH - pad;
        const bottom = cy + boxH / 2 + pad;
        return px >= left && px <= right && py >= top && py <= bottom;
    }

    handleStart(x, y) {
        if (this.heartsBurst) return;
        if (this.isPointOnBox(x, y)) {
            this.isHolding = true;
            this.holdOnBox = true;
            if (this.hintEl && !this.hintDismissed) {
                this.hintDismissed = true;
                this.hintEl.classList.add('fade-out');
            }
        }
    }

    handleEnd() {
        this.isHolding = false;
        this.holdOnBox = false;
    }

    handleHeartTap(px, py) {
        // Account for tilt parallax offset so tap lands where the heart visually is
        const tiltNormX = this.tiltX / 30;
        const tiltNormY = this.tiltY / 30;
        const offsetX = tiltNormX * 4;
        const offsetY = tiltNormY * 3;

        // Check orbit hearts for hit (reverse order so topmost gets priority)
        for (let i = this.hearts.length - 1; i >= 0; i--) {
            const heart = this.hearts[i];
            if (heart.role !== 'orbit') continue;

            const dx = px - (heart.x + offsetX);
            const dy = py - (heart.y + offsetY);
            const dist = Math.sqrt(dx * dx + dy * dy);
            // Generous hit radius — hearts are small and moving
            const hitRadius = Math.max(heart.size, 30);

            if (dist < hitRadius) {
                // Pop this heart into sparkle particles
                this.spawnPopSparkles(heart.x, heart.y, heart.hue);
                // Haptic for pop
                navigator.vibrate?.(30);
                // Remove this heart
                this.hearts.splice(i, 1);
                break;
            }
        }
    }

    spawnPopSparkles(x, y, hue) {
        const count = 8 + Math.floor(Math.random() * 6);
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1.5 + Math.random() * 3;
            this.popSparkles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 2 + Math.random() * 4,
                hue: hue + (Math.random() - 0.5) * 20,
                opacity: 0.8 + Math.random() * 0.2,
                life: 0,
                maxLife: 40 + Math.random() * 30,
            });
        }
    }

    generateBgStars() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        const count = w < 768 ? 60 : 100;
        this.bgStars = [];
        for (let i = 0; i < count; i++) {
            this.bgStars.push({
                x: Math.random() * w,
                y: Math.random() * h,
                size: 0.5 + Math.random() * 1.5,
                baseOpacity: 0.15 + Math.random() * 0.45,
                twinkleSpeed: 0.01 + Math.random() * 0.03,
                twinklePhase: Math.random() * Math.PI * 2,
            });
        }
    }

    generateBgParticles() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        const count = w < 768 ? 12 : 18;
        this.bgParticles = [];
        for (let i = 0; i < count; i++) {
            this.bgParticles.push({
                x: Math.random() * w,
                y: Math.random() * h,
                size: 15 + Math.random() * 40,
                opacity: 0.015 + Math.random() * 0.03,
                vx: (Math.random() - 0.5) * 0.15,
                vy: (Math.random() - 0.5) * 0.1,
                // Soft color — blue/purple tones
                hue: 220 + Math.random() * 40,
                driftPhase: Math.random() * Math.PI * 2,
                driftSpeed: 0.003 + Math.random() * 0.005,
            });
        }
    }

    spawnSparkle() {
        const { cx, cy, boxW, boxH } = this.getBoxDimensions();
        const range = Math.max(boxW, boxH) * 1.5;
        this.sparkles.push({
            x: cx + (Math.random() - 0.5) * range,
            y: cy + (Math.random() - 0.5) * range,
            size: 1 + Math.random() * 2,
            opacity: 0,
            maxOpacity: 0.3 + Math.random() * 0.4,
            phase: Math.random() * Math.PI * 2,
            speed: 0.02 + Math.random() * 0.03,
            life: 0,
            maxLife: 120 + Math.random() * 200,
        });
    }

    spawnHearts() {
        const { cx, cy } = this.getBoxDimensions();
        const w = window.innerWidth;
        const h = window.innerHeight;
        const count = 50;

        for (let i = 0; i < count; i++) {
            // Explosive burst in ALL directions (full 360)
            const angle = Math.random() * Math.PI * 2;
            const speed = 10 + Math.random() * 14;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;

            // Give each heart a target zone to drift toward after burst settles
            // This spreads them across the entire screen
            const targetX = Math.random() * w;
            const targetY = Math.random() * h;

            this.hearts.push({
                x: cx + (Math.random() - 0.5) * 30,
                y: cy + (Math.random() - 0.5) * 20,
                vx: vx,
                vy: vy,
                size: 30 + Math.random() * 35,
                rotation: (Math.random() - 0.5) * 0.5,
                rotSpeed: (Math.random() - 0.5) * 0.08,
                opacity: 0.7 + Math.random() * 0.3,
                hue: 195 + Math.random() * 20,
                saturation: 65 + Math.random() * 25,
                lightness: 60 + Math.random() * 15,
                // Drift/float properties
                targetX: targetX,
                targetY: targetY,
                driftPhaseX: Math.random() * Math.PI * 2,
                driftPhaseY: Math.random() * Math.PI * 2,
                driftSpeed: 0.006 + Math.random() * 0.01,
                age: 0, // frames since spawn
                // Trail buffer — ring buffer of last 6 positions
                trail: [],
                trailIndex: 0,
            });
        }
    }

    spawnConfetti() {
        const { cx, cy } = this.getBoxDimensions();
        const count = 40;
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 3 + Math.random() * 6;
            // Gold and white mix
            const isGold = Math.random() > 0.4;
            this.confetti.push({
                x: cx + (Math.random() - 0.5) * 20,
                y: cy + (Math.random() - 0.5) * 20,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 2, // slight upward bias
                size: 2 + Math.random() * 3,
                rotation: Math.random() * Math.PI * 2,
                rotSpeed: (Math.random() - 0.5) * 0.3,
                opacity: 0.9,
                hue: isGold ? (40 + Math.random() * 15) : 0,
                saturation: isGold ? (80 + Math.random() * 20) : 0,
                lightness: isGold ? (55 + Math.random() * 15) : (85 + Math.random() * 15),
                life: 0,
                maxLife: 50 + Math.random() * 40,
                // Shape: 0 = circle, 1 = rectangle
                shape: Math.random() > 0.5 ? 1 : 0,
            });
        }
    }

    getLetterAPoints(count) {
        // Letter "A" as three line segments in normalized coords (0-1)
        const segments = [
            // Left leg (bottom-left to top-center)
            { x1: 0.15, y1: 1, x2: 0.5, y2: 0 },
            // Right leg (top-center to bottom-right)
            { x1: 0.5, y1: 0, x2: 0.85, y2: 1 },
            // Crossbar
            { x1: 0.28, y1: 0.55, x2: 0.72, y2: 0.55 },
        ];

        // Distribute points proportionally by segment length
        const segLengths = segments.map(s => {
            const dx = s.x2 - s.x1;
            const dy = s.y2 - s.y1;
            return Math.sqrt(dx * dx + dy * dy);
        });
        const totalLen = segLengths.reduce((a, b) => a + b, 0);

        const points = [];
        for (let si = 0; si < segments.length; si++) {
            const s = segments[si];
            const segCount = Math.max(2, Math.round((segLengths[si] / totalLen) * count));
            for (let i = 0; i < segCount; i++) {
                const t = segCount > 1 ? i / (segCount - 1) : 0.5;
                points.push({
                    nx: s.x1 + (s.x2 - s.x1) * t,
                    ny: s.y1 + (s.y2 - s.y1) * t,
                });
            }
        }

        // Scale to screen — big and readable, especially on mobile
        const w = window.innerWidth;
        const h = window.innerHeight;
        const isMobile = w < 768;

        const letterH = isMobile ? w * 0.6 : Math.min(w, h) * 0.38;
        const letterW = letterH * 0.7;
        const cx = w / 2;
        const cy = h * (isMobile ? 0.36 : 0.38);
        const offsetX = cx - letterW / 2;
        const offsetY = cy - letterH * 0.4;

        // Store the tip of the A for the ribbon emoji
        this.letterTopX = cx;
        this.letterTopY = offsetY;

        const trimmed = points.slice(0, count);
        return trimmed.map(p => ({
            x: offsetX + p.nx * letterW,
            y: offsetY + p.ny * letterH,
        }));
    }

    startFormation(time) {
        this.formationStarted = true;
        this.formationTime = time;

        const w = window.innerWidth;
        const h = window.innerHeight;
        const isMobile = w < 768;

        // On mobile: most hearts form the A, only a few float (less clutter)
        // On desktop: more room, so more can float
        const floatCount = isMobile ? 8 : 12;
        const letterCount = this.hearts.length - floatCount;
        const letterPoints = this.getLetterAPoints(letterCount);

        // Shuffle hearts so the assignment feels random
        const indices = this.hearts.map((_, i) => i);
        for (let i = indices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [indices[i], indices[j]] = [indices[j], indices[i]];
        }

        // Assign letter hearts
        for (let i = 0; i < letterCount && i < letterPoints.length; i++) {
            const heart = this.hearts[indices[i]];
            heart.role = 'letter';
            heart.targetX = letterPoints[i].x;
            heart.targetY = letterPoints[i].y;
            heart.targetSize = isMobile ? (14 + Math.random() * 10) : (16 + Math.random() * 12);
            heart.formDelay = Math.random() * 120;
            heart.formAge = 0;
        }

        // Assign orbiting hearts — any heart not assigned 'letter' becomes orbit
        const cx = w / 2;
        const cy = h * (isMobile ? 0.36 : 0.38);
        for (let i = 0; i < this.hearts.length; i++) {
            const heart = this.hearts[indices[i]];
            if (heart.role === 'letter') continue;
            heart.role = 'orbit';
            heart.orbitAngle = Math.random() * Math.PI * 2;
            heart.orbitSpeed = 0.002 + Math.random() * 0.004;
            heart.orbitRadiusX = (w * 0.15) + Math.random() * (w * 0.2);
            heart.orbitRadiusY = (h * 0.1) + Math.random() * (h * 0.15);
            heart.orbitCx = cx;
            heart.orbitCy = cy;
            heart.formDelay = Math.random() * 90;
            heart.formAge = 0;
        }
    }

    update(time) {
        const w = window.innerWidth;
        const h = window.innerHeight;

        // Box idle shake
        this.boxShakePhase += 0.03;
        const idleShake = Math.sin(this.boxShakePhase * 2.3) * 0.5 + Math.sin(this.boxShakePhase * 3.7) * 0.3;
        const holdShake = this.holdProgress * 3;
        this.boxShakeIntensity = this.heartsBurst ? 0 : (idleShake + holdShake);

        // Hold progress (~3.5 seconds to fully unwrap)
        if (this.isHolding && this.holdOnBox && !this.heartsBurst) {
            this.holdProgress = Math.min(1, this.holdProgress + 0.0048);
        }

        // Derived states from holdProgress
        if (this.holdProgress < 0.3) {
            this.ribbonLoose = this.holdProgress / 0.3;
            this.crackGlow = 0;
            this.lidOpenAmount = 0;
        } else if (this.holdProgress < 0.7) {
            this.ribbonLoose = 1;
            this.crackGlow = (this.holdProgress - 0.3) / 0.4;
            this.lidOpenAmount = 0;
        } else {
            this.ribbonLoose = 1;
            this.crackGlow = 1;
            this.lidOpenAmount = (this.holdProgress - 0.7) / 0.3;
        }

        // Burst hearts when fully opened
        if (this.holdProgress >= 1 && !this.heartsBurst) {
            this.heartsBurst = true;
            this.lidOpenAmount = 1;
            this.spawnHearts();
            this.spawnConfetti();
            this._messageRevealStart = time;

            // Haptic feedback
            navigator.vibrate?.(80);
        }

        // Trigger formation after ~4 seconds of floating
        if (this.heartsBurst && !this.formationStarted && this._messageRevealStart) {
            const elapsed = time - this._messageRevealStart;
            if (elapsed > 4000) {
                this.startFormation(time);
            }
        }

        // Heart physics — three phases:
        // 1. Burst: explosive scatter (first ~60 frames)
        // 2. Float: drift across screen (until formation triggers)
        // 3. Formation: hearts glide into A shape / orbit around it
        const margin = 10;

        for (const heart of this.hearts) {
            heart.age++;

            const burstPhase = Math.min(1, heart.age / 60);

            if (burstPhase < 1) {
                // BURST PHASE
                heart.vx *= 0.97;
                heart.vy *= 0.97;

            } else if (!this.formationStarted) {
                // FLOAT PHASE — drift freely across entire screen
                const dx = heart.targetX - heart.x;
                const dy = heart.targetY - heart.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist > 20) {
                    heart.vx += (dx / dist) * 0.04;
                    heart.vy += (dy / dist) * 0.04;
                }

                heart.driftPhaseX += heart.driftSpeed;
                heart.driftPhaseY += heart.driftSpeed * 0.73;
                heart.vx += Math.sin(heart.driftPhaseX) * 0.08;
                heart.vy += Math.cos(heart.driftPhaseY) * 0.07;
                heart.vx *= 0.98;
                heart.vy *= 0.98;

                heart.targetX += Math.sin(heart.driftPhaseX * 0.3) * 0.3;
                heart.targetY += Math.cos(heart.driftPhaseY * 0.4) * 0.3;
                heart.targetX = Math.max(margin + heart.size, Math.min(w - margin - heart.size, heart.targetX));
                heart.targetY = Math.max(margin + heart.size, Math.min(h - margin - heart.size, heart.targetY));

            } else {
                // FORMATION PHASE
                heart.formAge++;
                heart.driftPhaseX += heart.driftSpeed;
                heart.driftPhaseY += heart.driftSpeed * 0.73;

                if (heart.formAge < heart.formDelay) {
                    // Still waiting — keep floating gently
                    heart.vx += Math.sin(heart.driftPhaseX) * 0.05;
                    heart.vy += Math.cos(heart.driftPhaseY) * 0.04;
                    heart.vx *= 0.97;
                    heart.vy *= 0.97;

                } else if (heart.role === 'letter') {
                    // Glide toward letter position
                    const dx = heart.targetX - heart.x;
                    const dy = heart.targetY - heart.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    // Ease-in: stronger pull as formAge increases past delay
                    const formProgress = Math.min(1, (heart.formAge - heart.formDelay) / 120);
                    const pullStrength = 0.02 + formProgress * 0.08;

                    if (dist > 3) {
                        heart.vx += (dx / dist) * pullStrength * Math.min(dist * 0.1, 3);
                        heart.vy += (dy / dist) * pullStrength * Math.min(dist * 0.1, 3);
                    }

                    // Once close, add subtle breathing wobble so it doesn't look frozen
                    if (dist < 15) {
                        heart.vx += Math.sin(heart.driftPhaseX * 2) * 0.02;
                        heart.vy += Math.cos(heart.driftPhaseY * 2) * 0.02;
                    }

                    heart.vx *= 0.92;
                    heart.vy *= 0.92;

                    // Smooth size transition
                    if (heart.targetSize && heart.size !== heart.targetSize) {
                        heart.size += (heart.targetSize - heart.size) * 0.03;
                    }

                } else if (heart.role === 'orbit') {
                    // Float in lazy orbit around the letter
                    heart.orbitAngle += heart.orbitSpeed;

                    const orbX = heart.orbitCx + Math.cos(heart.orbitAngle) * heart.orbitRadiusX;
                    const orbY = heart.orbitCy + Math.sin(heart.orbitAngle) * heart.orbitRadiusY;

                    const dx = orbX - heart.x;
                    const dy = orbY - heart.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist > 5) {
                        heart.vx += (dx / dist) * 0.06;
                        heart.vy += (dy / dist) * 0.06;
                    }

                    // Wobble
                    heart.vx += Math.sin(heart.driftPhaseX) * 0.04;
                    heart.vy += Math.cos(heart.driftPhaseY) * 0.04;

                    heart.vx *= 0.96;
                    heart.vy *= 0.96;
                }
            }

            // Clamp max speed
            const maxSpeed = burstPhase < 1 ? 18 : (this.formationStarted ? 3.5 : 2);
            const spd = Math.sqrt(heart.vx * heart.vx + heart.vy * heart.vy);
            if (spd > maxSpeed) {
                heart.vx = (heart.vx / spd) * maxSpeed;
                heart.vy = (heart.vy / spd) * maxSpeed;
            }

            heart.x += heart.vx;
            heart.y += heart.vy;

            // Trail recording — only during burst phase (first 60 frames), every 2 frames
            if (burstPhase < 1 && heart.age % 2 === 0) {
                if (heart.trail.length < 6) {
                    heart.trail.push({ x: heart.x, y: heart.y });
                } else {
                    heart.trail[heart.trailIndex % 6] = { x: heart.x, y: heart.y };
                }
                heart.trailIndex++;
            }

            // Rotation — slow down for formation hearts once settled
            heart.rotation += heart.rotSpeed;
            if (this.formationStarted && heart.role === 'letter') {
                heart.rotSpeed *= 0.99;
                heart.rotation *= 0.995;
            } else {
                heart.rotSpeed *= 0.997;
                heart.rotSpeed += Math.sin(heart.driftPhaseX * 1.3) * 0.0008;
            }

            const halfSize = heart.size / 2;

            // Soft bounce off screen edges
            if (heart.x - halfSize < margin) {
                heart.x = margin + halfSize;
                heart.vx = Math.abs(heart.vx) * 0.5;
            }
            if (heart.x + halfSize > w - margin) {
                heart.x = w - margin - halfSize;
                heart.vx = -Math.abs(heart.vx) * 0.5;
            }
            if (heart.y - halfSize < margin) {
                heart.y = margin + halfSize;
                heart.vy = Math.abs(heart.vy) * 0.5;
            }
            if (heart.y + halfSize > h - margin) {
                heart.y = h - margin - halfSize;
                heart.vy = -Math.abs(heart.vy) * 0.5;
            }
        }

        // Message cycling — starts after formation settles
        if (this.heartsBurst && this._messageRevealStart) {
            const elapsed = time - this._messageRevealStart;

            if (this.messagePhase === 'waiting' && elapsed > 8000) {
                this.messagePhase = 'fadein';
                this.messagePhaseStart = time;
            }

            if (this.messagePhase === 'fadein') {
                this.messageOpacity = Math.min(1, this.messageOpacity + 0.012);
                if (this.messageOpacity >= 1) {
                    this.messagePhase = 'hold';
                    this.messagePhaseStart = time;
                }
            }

            if (this.messagePhase === 'hold') {
                // Hold for 4 seconds
                if (time - this.messagePhaseStart > 4000) {
                    this.messagePhase = 'fadeout';
                    this.messagePhaseStart = time;
                }
            }

            if (this.messagePhase === 'fadeout') {
                this.messageOpacity = Math.max(0, this.messageOpacity - 0.012);
                if (this.messageOpacity <= 0) {
                    // Advance to next message
                    this.messageIndex = (this.messageIndex + 1) % this.messageOrder.length;
                    this.messagePhase = 'fadein';
                    this.messagePhaseStart = time;
                }
            }
        }

        // Ribbon emoji fade-in — appears after formation settles
        if (this.formationStarted && this._messageRevealStart) {
            const elapsed = time - this._messageRevealStart;
            if (elapsed > 6500) {
                this.ribbonOpacity = Math.min(1, this.ribbonOpacity + 0.01);
            }
        }

        // Update background stars (twinkle phase)
        for (const star of this.bgStars) {
            star.twinklePhase += star.twinkleSpeed;
        }

        // Update floating particles (slow drift, wrap around)
        const pw = window.innerWidth;
        const ph = window.innerHeight;
        for (const p of this.bgParticles) {
            p.driftPhase += p.driftSpeed;
            p.x += p.vx + Math.sin(p.driftPhase) * 0.08;
            p.y += p.vy + Math.cos(p.driftPhase * 0.7) * 0.06;

            // Wrap around screen edges
            if (p.x < -p.size) p.x = pw + p.size;
            if (p.x > pw + p.size) p.x = -p.size;
            if (p.y < -p.size) p.y = ph + p.size;
            if (p.y > ph + p.size) p.y = -p.size;
        }

        // Update sparkles
        for (const s of this.sparkles) {
            s.life++;
            s.phase += s.speed;
            s.opacity = s.maxOpacity * (Math.sin(s.phase) * 0.5 + 0.5);
            if (s.life > s.maxLife) {
                s.opacity *= 0.95;
            }
        }
        this.sparkles = this.sparkles.filter(s => s.opacity > 0.01 || s.life < s.maxLife);
        if (!this.heartsBurst && this.sparkles.length < 20 && Math.random() < 0.05) {
            this.spawnSparkle();
        }

        // Update confetti particles
        for (const c of this.confetti) {
            c.life++;
            c.x += c.vx;
            c.y += c.vy;
            c.vy += 0.08; // gravity
            c.vx *= 0.98;
            c.rotation += c.rotSpeed;
            // Fade out in last third of life
            if (c.life > c.maxLife * 0.6) {
                c.opacity *= 0.94;
            }
        }
        this.confetti = this.confetti.filter(c => c.opacity > 0.02);

        // Update pop sparkles (from tapped orbit hearts)
        for (const ps of this.popSparkles) {
            ps.life++;
            ps.x += ps.vx;
            ps.y += ps.vy;
            ps.vx *= 0.95;
            ps.vy *= 0.95;
            ps.vy += 0.02; // tiny gravity
            ps.size *= 0.98;
            if (ps.life > ps.maxLife * 0.5) {
                ps.opacity *= 0.92;
            }
        }
        this.popSparkles = this.popSparkles.filter(ps => ps.opacity > 0.02);

        // Letter A glow — fade in after formation, with breathing
        if (this.formationStarted) {
            this.letterGlowOpacity = Math.min(1, this.letterGlowOpacity + 0.008);
        }

        // Tilt parallax — smooth toward raw values
        this.tiltX += (this._rawTiltX - this.tiltX) * 0.05;
        this.tiltY += (this._rawTiltY - this.tiltY) * 0.05;

        // Detect all orbit hearts popped → trigger shooting star after delay
        if (this.formationStarted && !this._allOrbitsPopped) {
            const remaining = this.hearts.filter(h => h.role === 'orbit');
            if (remaining.length === 0) {
                this._allOrbitsPopped = true;
                this._allOrbitsPoppedTime = time;
            }
        }

        // Spawn shooting star after 500ms delay
        if (this._allOrbitsPopped && !this.shootingStar && !this._shootingStarDone && time - this._allOrbitsPoppedTime > 500) {
            const sw = window.innerWidth;
            const sh = window.innerHeight;
            const letterIsMobile = sw < 768;
            // Letter A center — the star's path passes through this area at ~midpoint
            const letterCy = sh * (letterIsMobile ? 0.36 : 0.38);
            this.shootingStar = {
                progress: 0,
                // Full sweep: upper-left off-screen → arc past letter area → lower-right off-screen
                p0x: sw * -0.1,  p0y: sh * -0.05,
                // Control point pulls the arc so it passes through the letter zone
                p1x: sw * 0.5,   p1y: letterCy - sh * 0.08,
                p2x: sw * 1.15,  p2y: sh * 0.75,
                // The progress value where the star is closest to the letter center
                letterCx: sw / 2,
                letterCy: letterCy,
                trail: [],
                opacity: 1,
                brightness: 0,
            };
        }

        // Update shooting star
        if (this.shootingStar) {
            const ss = this.shootingStar;
            ss.progress += 0.0025; // ~6.5 seconds full sweep

            // Quadratic bezier position
            const t = ss.progress;
            const mt = 1 - t;
            const ssX = mt * mt * ss.p0x + 2 * mt * t * ss.p1x + t * t * ss.p2x;
            const ssY = mt * mt * ss.p0y + 2 * mt * t * ss.p1y + t * t * ss.p2y;

            // Record trail (keep last 30 positions for a longer, elegant tail)
            ss.trail.push({ x: ssX, y: ssY });
            if (ss.trail.length > 30) ss.trail.shift();

            ss.x = ssX;
            ss.y = ssY;

            // Brightness based on proximity to the letter center
            // Peaks when closest (around t ≈ 0.45-0.55), tapers off on both sides
            const dxL = ssX - ss.letterCx;
            const dyL = ssY - ss.letterCy;
            const distToLetter = Math.sqrt(dxL * dxL + dyL * dyL);
            const maxDist = Math.max(window.innerWidth, window.innerHeight) * 0.6;
            const proximity = Math.max(0, 1 - distToLetter / maxDist);
            // Smooth bell curve: raise proximity to a power for a sharp peak
            ss.brightness = 0.15 + proximity * proximity * 1.6;

            // Opacity: fade in at start, fade out at end, full in the middle
            if (t < 0.08) {
                ss.opacity = t / 0.08;
            } else if (t > 0.85) {
                ss.opacity = Math.max(0, (1 - t) / 0.15);
            } else {
                ss.opacity = 1;
            }

            // Proximity glow boost on background stars
            const starRadius = 100 + ss.brightness * 120;
            for (const star of this.bgStars) {
                const dx = star.x - ssX;
                const dy = star.y - ssY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < starRadius) {
                    const boost = (1 - dist / starRadius) * 0.6 * ss.brightness;
                    star.glowBoost = Math.max(star.glowBoost || 0, boost);
                }
            }

            // Proximity glow boost on letter hearts — very strong at peak
            const heartRadius = 120 + ss.brightness * 150;
            for (const heart of this.hearts) {
                if (heart.role !== 'letter') continue;
                const dx = heart.x - ssX;
                const dy = heart.y - ssY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < heartRadius) {
                    const boost = (1 - dist / heartRadius) * 22 * ss.brightness;
                    heart.glowBoost = Math.max(heart.glowBoost || 0, boost);
                }
            }

            // Done — off-screen
            if (ss.progress >= 1) {
                this.shootingStar = null;
                this._shootingStarDone = true;
            }
        }

        // Decay glowBoost on stars
        for (const star of this.bgStars) {
            if (star.glowBoost > 0) {
                star.glowBoost *= 0.95;
                if (star.glowBoost < 0.005) star.glowBoost = 0;
            }
        }

        // Decay glowBoost on letter hearts
        for (const heart of this.hearts) {
            if (heart.glowBoost > 0) {
                heart.glowBoost *= 0.96;
                if (heart.glowBoost < 0.3) heart.glowBoost = 0;
            }
        }
    }

    render(time) {
        const ctx = this.ctx;
        const w = window.innerWidth;
        const h = window.innerHeight;
        const dims = this.getBoxDimensions();
        const { boxW, boxH, lidH, cx, cy, isMobile, isSmall } = dims;

        // Tilt offsets for parallax layers (normalized -1 to 1)
        const tiltNormX = this.tiltX / 30;
        const tiltNormY = this.tiltY / 30;

        // Background — deep space gradient with subtle color
        const bgGrad = ctx.createRadialGradient(w * 0.3, h * 0.2, 0, cx, cy, Math.max(w, h) * 0.9);
        bgGrad.addColorStop(0, '#0d0a18');
        bgGrad.addColorStop(0.35, '#08061a');
        bgGrad.addColorStop(0.7, '#050412');
        bgGrad.addColorStop(1, '#02020a');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, w, h);

        // Subtle secondary glow (warm accent, bottom-right)
        const accentGrad = ctx.createRadialGradient(w * 0.8, h * 0.75, 0, w * 0.8, h * 0.75, w * 0.5);
        accentGrad.addColorStop(0, 'rgba(60, 30, 80, 0.08)');
        accentGrad.addColorStop(0.5, 'rgba(40, 20, 60, 0.03)');
        accentGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = accentGrad;
        ctx.fillRect(0, 0, w, h);

        // Background stars — with tilt parallax (subtle shift)
        const starShiftX = tiltNormX * 8;
        const starShiftY = tiltNormY * 6;
        for (const star of this.bgStars) {
            const twinkle = 0.5 + Math.sin(star.twinklePhase) * 0.5;
            const opacity = Math.min(1, star.baseOpacity * twinkle + (star.glowBoost || 0));
            if (opacity < 0.02) continue;

            const sx = star.x + starShiftX;
            const sy = star.y + starShiftY;

            ctx.beginPath();
            ctx.arc(sx, sy, star.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(200, 210, 240, ${opacity})`;
            ctx.fill();

            if (star.size > 1 && opacity > 0.3) {
                ctx.beginPath();
                ctx.arc(sx, sy, star.size * 3, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(180, 200, 255, ${opacity * 0.08})`;
                ctx.fill();
            }
        }

        // Floating soft particles (bokeh) — with tilt parallax (more shift)
        const bokehShiftX = tiltNormX * 15;
        const bokehShiftY = tiltNormY * 12;
        for (const p of this.bgParticles) {
            const px = p.x + bokehShiftX;
            const py = p.y + bokehShiftY;
            const grad = ctx.createRadialGradient(px, py, 0, px, py, p.size);
            grad.addColorStop(0, `hsla(${p.hue}, 40%, 60%, ${p.opacity})`);
            grad.addColorStop(0.5, `hsla(${p.hue}, 30%, 40%, ${p.opacity * 0.4})`);
            grad.addColorStop(1, `hsla(${p.hue}, 20%, 20%, 0)`);
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(px, py, p.size, 0, Math.PI * 2);
            ctx.fill();
        }

        // Near-box sparkles (behind box)
        if (!this.heartsBurst) {
            for (const s of this.sparkles) {
                if (s.opacity <= 0.01) continue;
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(200, 210, 255, ${s.opacity * 0.5})`;
                ctx.fill();
            }
        }

        // Letter A glow — soft breathing halo behind the formed letter
        if (this.letterGlowOpacity > 0 && this.formationStarted) {
            const glowCx = w / 2;
            const glowCy = h * (isMobile ? 0.36 : 0.38);
            const letterH = isMobile ? w * 0.6 : Math.min(w, h) * 0.38;
            const glowRadius = letterH * 0.7;
            // Breathing effect
            const breathe = 0.85 + Math.sin(time * 0.0015) * 0.15;
            const alpha = this.letterGlowOpacity * 0.12 * breathe;

            const glowGrad = ctx.createRadialGradient(glowCx, glowCy, 0, glowCx, glowCy, glowRadius);
            glowGrad.addColorStop(0, `rgba(135, 206, 235, ${alpha})`);
            glowGrad.addColorStop(0.4, `rgba(135, 206, 235, ${alpha * 0.4})`);
            glowGrad.addColorStop(0.7, `rgba(100, 160, 200, ${alpha * 0.1})`);
            glowGrad.addColorStop(1, 'rgba(100, 160, 200, 0)');
            ctx.fillStyle = glowGrad;
            ctx.beginPath();
            ctx.arc(glowCx, glowCy, glowRadius, 0, Math.PI * 2);
            ctx.fill();
        }

        // Crack glow — light seeping from inside
        if (this.crackGlow > 0 && !this.heartsBurst) {
            const glowRadius = (boxW + boxH) * 0.4 * this.crackGlow;
            const glowGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowRadius);
            const alpha = 0.15 * this.crackGlow;
            glowGrad.addColorStop(0, `rgba(135, 206, 235, ${alpha})`);
            glowGrad.addColorStop(0.5, `rgba(135, 206, 235, ${alpha * 0.3})`);
            glowGrad.addColorStop(1, 'rgba(135, 206, 235, 0)');
            ctx.fillStyle = glowGrad;
            ctx.fillRect(0, 0, w, h);
        }

        // Box shake transform
        const shakeX = Math.sin(this.boxShakePhase * 11) * this.boxShakeIntensity;
        const shakeY = Math.cos(this.boxShakePhase * 13) * this.boxShakeIntensity * 0.3;
        const shakeRot = Math.sin(this.boxShakePhase * 7) * this.boxShakeIntensity * 0.008;

        // Draw box (fade out after burst)
        if (!this.heartsBurst) {
            ctx.save();
            ctx.translate(cx + shakeX, cy + shakeY);
            ctx.rotate(shakeRot);
            this.renderBox(ctx, dims, time);
            ctx.restore();
        } else {
            const burstElapsed = time - this._messageRevealStart;
            const boxFade = Math.max(0, 1 - burstElapsed / 3000);
            if (boxFade > 0.01) {
                ctx.save();
                ctx.globalAlpha = boxFade;
                ctx.translate(cx, cy);
                this.renderBox(ctx, dims, time);
                ctx.restore();
            }
        }

        // Heart trails during burst phase — fading copies behind each heart
        if (this.heartsBurst) {
            for (const heart of this.hearts) {
                if (heart.trail.length === 0 || heart.age > 70) continue;
                const trailFade = Math.max(0, 1 - heart.age / 70);
                for (let ti = 0; ti < heart.trail.length; ti++) {
                    const tp = heart.trail[ti];
                    const trailAlpha = (ti / heart.trail.length) * 0.25 * trailFade;
                    if (trailAlpha < 0.01) continue;
                    ctx.save();
                    ctx.translate(tp.x, tp.y);
                    ctx.rotate(heart.rotation);
                    ctx.globalAlpha = trailAlpha;
                    const ts = heart.size * (0.4 + (ti / heart.trail.length) * 0.4);
                    ctx.beginPath();
                    ctx.moveTo(0, ts * 0.3);
                    ctx.bezierCurveTo(-ts * 0.5, -ts * 0.1, -ts * 0.5, -ts * 0.4, 0, -ts * 0.2);
                    ctx.bezierCurveTo(ts * 0.5, -ts * 0.4, ts * 0.5, -ts * 0.1, 0, ts * 0.3);
                    ctx.closePath();
                    ctx.fillStyle = `hsla(${heart.hue}, ${heart.saturation}%, ${heart.lightness}%, 0.5)`;
                    ctx.fill();
                    ctx.restore();
                }
            }
        }

        // Draw hearts — with tilt parallax (least shift)
        const heartShiftX = tiltNormX * 4;
        const heartShiftY = tiltNormY * 3;
        for (const heart of this.hearts) {
            this.renderHeart(ctx, heart, heartShiftX, heartShiftY);
        }

        // Pop sparkles (from tapped orbit hearts)
        for (const ps of this.popSparkles) {
            ctx.save();
            ctx.globalAlpha = ps.opacity;
            ctx.beginPath();
            ctx.arc(ps.x, ps.y, ps.size, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${ps.hue}, 70%, 70%, ${ps.opacity})`;
            ctx.fill();
            ctx.restore();
        }

        // Confetti particles
        for (const c of this.confetti) {
            if (c.opacity < 0.02) continue;
            ctx.save();
            ctx.translate(c.x, c.y);
            ctx.rotate(c.rotation);
            ctx.globalAlpha = c.opacity;

            if (c.saturation > 0) {
                ctx.fillStyle = `hsla(${c.hue}, ${c.saturation}%, ${c.lightness}%, 1)`;
            } else {
                ctx.fillStyle = `hsla(0, 0%, ${c.lightness}%, 1)`;
            }

            if (c.shape === 0) {
                ctx.beginPath();
                ctx.arc(0, 0, c.size, 0, Math.PI * 2);
                ctx.fill();
            } else {
                ctx.fillRect(-c.size, -c.size * 0.4, c.size * 2, c.size * 0.8);
            }
            ctx.restore();
        }

        // Shooting star
        if (this.shootingStar) {
            const ss = this.shootingStar;
            const br = ss.brightness; // 0.3 early → ~1.5 at letter

            // Ambient bloom — grows bigger and brighter as star approaches letter
            if (ss.opacity > 0.01) {
                const bloomRadius = Math.min(w, h) * (0.15 + br * 0.25);
                const bloomGrad = ctx.createRadialGradient(ss.x, ss.y, 0, ss.x, ss.y, bloomRadius);
                const bloomAlpha = ss.opacity * 0.04 * br;
                bloomGrad.addColorStop(0, `rgba(180, 210, 255, ${bloomAlpha})`);
                bloomGrad.addColorStop(0.3, `rgba(150, 190, 240, ${bloomAlpha * 0.4})`);
                bloomGrad.addColorStop(1, 'rgba(150, 190, 240, 0)');
                ctx.fillStyle = bloomGrad;
                ctx.beginPath();
                ctx.arc(ss.x, ss.y, bloomRadius, 0, Math.PI * 2);
                ctx.fill();
            }

            // Trail — tapered tiny stars, brightness affects alpha and size
            for (let ti = 0; ti < ss.trail.length; ti++) {
                const tp = ss.trail[ti];
                const t = ti / ss.trail.length; // 0 = oldest, 1 = newest
                const trailAlpha = t * (0.3 + br * 0.4) * ss.opacity;
                const trailSize = (0.8 + br * 0.5) + t * (2 + br * 2);
                if (trailAlpha < 0.01) continue;

                // Tiny 4-pointed stars in the trail
                ctx.save();
                ctx.translate(tp.x, tp.y);
                ctx.fillStyle = `rgba(200, 220, 255, ${trailAlpha})`;
                if (trailSize > 2) {
                    const ir = 0.3;
                    ctx.beginPath();
                    for (let si = 0; si < 8; si++) {
                        const a = (si / 8) * Math.PI * 2 - Math.PI / 2;
                        const r = si % 2 === 0 ? trailSize : trailSize * ir;
                        const px = Math.cos(a) * r;
                        const py = Math.sin(a) * r;
                        if (si === 0) ctx.moveTo(px, py);
                        else ctx.lineTo(px, py);
                    }
                    ctx.closePath();
                    ctx.fill();
                } else {
                    // Too small for star shape, just a dot
                    ctx.beginPath();
                    ctx.arc(0, 0, trailSize, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.restore();
            }

            // Core — star shape that scales up with brightness
            if (ss.opacity > 0.01) {
                // Outer glow — grows with brightness
                const coreGlowR = 20 + br * 40;
                const coreGrad = ctx.createRadialGradient(ss.x, ss.y, 0, ss.x, ss.y, coreGlowR);
                coreGrad.addColorStop(0, `rgba(230, 240, 255, ${ss.opacity * Math.min(1, 0.4 + br * 0.5)})`);
                coreGrad.addColorStop(0.25, `rgba(200, 220, 255, ${ss.opacity * Math.min(1, 0.15 + br * 0.3)})`);
                coreGrad.addColorStop(1, 'rgba(200, 220, 255, 0)');
                ctx.fillStyle = coreGrad;
                ctx.beginPath();
                ctx.arc(ss.x, ss.y, coreGlowR, 0, Math.PI * 2);
                ctx.fill();

                // Star shape core — 4-pointed star
                const starSize = 4 + br * 8;
                const innerRatio = 0.35;
                ctx.save();
                ctx.translate(ss.x, ss.y);
                // Slow rotation
                ctx.rotate(ss.progress * Math.PI * 2);
                ctx.beginPath();
                for (let i = 0; i < 8; i++) {
                    const angle = (i / 8) * Math.PI * 2 - Math.PI / 2;
                    const r = i % 2 === 0 ? starSize : starSize * innerRatio;
                    const sx = Math.cos(angle) * r;
                    const sy = Math.sin(angle) * r;
                    if (i === 0) ctx.moveTo(sx, sy);
                    else ctx.lineTo(sx, sy);
                }
                ctx.closePath();
                ctx.fillStyle = `rgba(255, 255, 255, ${ss.opacity * 0.95})`;
                ctx.fill();
                ctx.restore();
            }
        }

        // Ribbon emoji on top of the A
        if (this.ribbonOpacity > 0 && this.formationStarted) {
            ctx.save();
            ctx.globalAlpha = this.ribbonOpacity;
            const ribbonSize = isSmall ? 28 : isMobile ? 34 : 38;
            ctx.font = `${ribbonSize}px serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.translate(this.letterTopX + ribbonSize * 0.1, this.letterTopY - ribbonSize * 0.3);
            ctx.rotate(0.2);
            ctx.fillText('\uD83C\uDF80', 0, 0);
            ctx.restore();
        }

        // Message
        if (this.messageOpacity > 0) {
            this.renderMessage(ctx, w, h, isMobile, isSmall);
        }
    }

    renderBox(ctx, dims, time) {
        const { boxW, boxH, lidH } = dims;
        const halfW = boxW / 2;
        const halfH = boxH / 2;

        const bodyTop = -halfH + lidH * 0.3;
        const bodyBottom = halfH;
        const bodyLeft = -halfW;
        const bodyRight = halfW;
        const r = 4;

        // Box body — deep navy
        const bodyGrad = ctx.createLinearGradient(bodyLeft, 0, bodyRight, 0);
        bodyGrad.addColorStop(0, '#1a1a3e');
        bodyGrad.addColorStop(0.3, '#252555');
        bodyGrad.addColorStop(0.7, '#222250');
        bodyGrad.addColorStop(1, '#1a1a3e');
        ctx.fillStyle = bodyGrad;

        ctx.beginPath();
        ctx.moveTo(bodyLeft + r, bodyTop);
        ctx.lineTo(bodyRight - r, bodyTop);
        ctx.quadraticCurveTo(bodyRight, bodyTop, bodyRight, bodyTop + r);
        ctx.lineTo(bodyRight, bodyBottom - r);
        ctx.quadraticCurveTo(bodyRight, bodyBottom, bodyRight - r, bodyBottom);
        ctx.lineTo(bodyLeft + r, bodyBottom);
        ctx.quadraticCurveTo(bodyLeft, bodyBottom, bodyLeft, bodyBottom - r);
        ctx.lineTo(bodyLeft, bodyTop + r);
        ctx.quadraticCurveTo(bodyLeft, bodyTop, bodyLeft + r, bodyTop);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = 'rgba(100, 100, 180, 0.15)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Crack light lines
        if (this.crackGlow > 0 && !this.heartsBurst) {
            ctx.save();
            ctx.globalAlpha = this.crackGlow * 0.6;
            ctx.strokeStyle = 'rgba(135, 206, 235, 0.8)';
            ctx.lineWidth = 1.5;

            ctx.beginPath();
            ctx.moveTo(bodyLeft + 10, bodyTop);
            ctx.lineTo(bodyRight - 10, bodyTop);
            ctx.stroke();

            if (this.crackGlow > 0.4) {
                ctx.globalAlpha = (this.crackGlow - 0.4) * 0.5;
                ctx.beginPath();
                ctx.moveTo(-halfW * 0.3, bodyTop + 5);
                ctx.lineTo(-halfW * 0.25, bodyBottom * 0.3);
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(halfW * 0.4, bodyTop + 8);
                ctx.lineTo(halfW * 0.35, bodyBottom * 0.4);
                ctx.stroke();
            }
            ctx.restore();
        }

        // Vertical ribbon on body
        if (this.ribbonLoose < 1) {
            const ribbonAlpha = 1 - this.ribbonLoose * 0.7;
            ctx.fillStyle = `rgba(135, 206, 235, ${ribbonAlpha * 0.7})`;
            ctx.fillRect(-8, bodyTop, 16, bodyBottom - bodyTop);

            // Horizontal ribbon
            const midY = (bodyTop + bodyBottom) / 2;
            ctx.fillRect(bodyLeft, midY - 6, bodyRight - bodyLeft, 12);
        }

        // Lid
        const lidTop = -halfH - lidH * 0.5;
        const lidBottom = bodyTop + 4;
        const lidLeft = -halfW - 5;
        const lidRight = halfW + 5;

        // Lid opens upward
        if (this.lidOpenAmount > 0) {
            ctx.save();
            ctx.translate(0, bodyTop);
            ctx.rotate(-this.lidOpenAmount * Math.PI * 0.45);
            ctx.translate(0, -bodyTop);
        }

        const lidGrad = ctx.createLinearGradient(lidLeft, lidTop, lidRight, lidBottom);
        lidGrad.addColorStop(0, '#2a2a5e');
        lidGrad.addColorStop(0.5, '#303068');
        lidGrad.addColorStop(1, '#252555');
        ctx.fillStyle = lidGrad;

        ctx.beginPath();
        ctx.moveTo(lidLeft + r, lidTop);
        ctx.lineTo(lidRight - r, lidTop);
        ctx.quadraticCurveTo(lidRight, lidTop, lidRight, lidTop + r);
        ctx.lineTo(lidRight, lidBottom - r);
        ctx.quadraticCurveTo(lidRight, lidBottom, lidRight - r, lidBottom);
        ctx.lineTo(lidLeft + r, lidBottom);
        ctx.quadraticCurveTo(lidLeft, lidBottom, lidLeft, lidBottom - r);
        ctx.lineTo(lidLeft, lidTop + r);
        ctx.quadraticCurveTo(lidLeft, lidTop, lidLeft + r, lidTop);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = 'rgba(100, 100, 180, 0.2)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Ribbon on lid + bow
        if (this.ribbonLoose < 1) {
            const ribbonAlpha = 1 - this.ribbonLoose * 0.7;
            const rColor = `rgba(135, 206, 235, ${ribbonAlpha * 0.7})`;

            ctx.fillStyle = rColor;
            ctx.fillRect(-8, lidTop, 16, lidBottom - lidTop);

            const lidMidY = (lidTop + lidBottom) / 2;
            ctx.fillRect(lidLeft, lidMidY - 6, lidRight - lidLeft, 12);

            // Bow
            if (this.ribbonLoose < 0.5) {
                const bowAlpha = 1 - this.ribbonLoose * 2;
                const bowY = lidTop - 8;
                ctx.fillStyle = `rgba(135, 206, 235, ${bowAlpha * 0.8})`;

                // Left loop
                ctx.beginPath();
                ctx.ellipse(-14, bowY, 14, 9, -0.3, 0, Math.PI * 2);
                ctx.fill();

                // Right loop
                ctx.beginPath();
                ctx.ellipse(14, bowY, 14, 9, 0.3, 0, Math.PI * 2);
                ctx.fill();

                // Center knot
                ctx.beginPath();
                ctx.arc(0, bowY, 5, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(100, 180, 220, ${bowAlpha * 0.9})`;
                ctx.fill();

                // Ribbon tails
                ctx.strokeStyle = `rgba(135, 206, 235, ${bowAlpha * 0.6})`;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(-3, bowY + 4);
                ctx.quadraticCurveTo(-12, bowY + 18, -18, bowY + 25);
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(3, bowY + 4);
                ctx.quadraticCurveTo(10, bowY + 20, 16, bowY + 28);
                ctx.stroke();
            }
        }

        if (this.lidOpenAmount > 0) {
            ctx.restore();
        }

        // Inside glow when lid opens
        if (this.lidOpenAmount > 0.1) {
            const insideGlow = ctx.createRadialGradient(0, bodyTop, 0, 0, bodyTop, boxW * 0.6);
            const alpha = this.lidOpenAmount * 0.4;
            insideGlow.addColorStop(0, `rgba(135, 206, 250, ${alpha})`);
            insideGlow.addColorStop(0.5, `rgba(135, 206, 235, ${alpha * 0.3})`);
            insideGlow.addColorStop(1, 'rgba(135, 206, 235, 0)');
            ctx.fillStyle = insideGlow;
            ctx.beginPath();
            ctx.arc(0, bodyTop, boxW * 0.6, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    renderHeart(ctx, heart, offsetX = 0, offsetY = 0) {
        ctx.save();
        ctx.translate(heart.x + offsetX, heart.y + offsetY);
        ctx.rotate(heart.rotation);
        ctx.globalAlpha = heart.opacity;

        const s = heart.size;

        // Heart shape
        ctx.beginPath();
        ctx.moveTo(0, s * 0.3);
        ctx.bezierCurveTo(-s * 0.5, -s * 0.1, -s * 0.5, -s * 0.4, 0, -s * 0.2);
        ctx.bezierCurveTo(s * 0.5, -s * 0.4, s * 0.5, -s * 0.1, 0, s * 0.3);
        ctx.closePath();

        const hue = heart.hue;
        const sat = heart.saturation;
        const lit = Math.min(95, heart.lightness + (heart.glowBoost || 0));
        ctx.fillStyle = `hsla(${hue}, ${sat}%, ${lit}%, 0.85)`;
        ctx.fill();

        // Subtle edge
        ctx.strokeStyle = `hsla(${hue}, ${sat}%, ${Math.min(100, lit + 15)}%, 0.3)`;
        ctx.lineWidth = 0.8;
        ctx.stroke();

        // Highlight on top-left bump
        ctx.beginPath();
        ctx.arc(-s * 0.18, -s * 0.25, s * 0.08, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${hue}, ${Math.max(0, sat - 10)}%, ${Math.min(100, lit + 25)}%, 0.5)`;
        ctx.fill();

        ctx.restore();
    }

    renderMessage(ctx, w, h, isMobile, isSmall) {
        const fontSize = isSmall ? 16 : isMobile ? 19 : 22;
        const text = this.messageOrder[this.messageIndex];

        ctx.save();
        ctx.font = `${fontSize}px "Lora", "Georgia", serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.shadowColor = `rgba(135, 206, 235, ${this.messageOpacity * 0.4})`;
        ctx.shadowBlur = 25;
        ctx.fillStyle = `rgba(230, 240, 255, ${this.messageOpacity * 0.85})`;

        const textY = h * (isSmall ? 0.72 : isMobile ? 0.72 : 0.7);
        ctx.fillText(text, w / 2, textY);

        ctx.shadowBlur = 0;
        ctx.restore();
    }

    resize() {
        // Regenerate background elements for new screen size
        this.generateBgStars();
        this.generateBgParticles();
    }
}
