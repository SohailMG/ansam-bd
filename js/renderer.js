// Canvas renderer for night sky and stars

export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.dpr = 1;

        // Hearts animation
        this.hearts = [];
        this.lastHeartTime = 0;
        this.heartInterval = 400;

        // Phase transition state
        this.initiatorFadeOut = 1; // 1 = visible, 0 = hidden
        this.dimProgress = 0; // 0 = not dimmed, 1 = fully dimmed
        this.lastPhase = 'waiting';
        this.phaseTransitionStart = 0;

        // Floating poem stars
        this.poemStars = [];
        this.lastPoemTime = 0;
        this.poemDelay = 3000; // Delay between each poem appearing
        this.poemIndex = 0;
        this.allPoemsSpawned = false;

        // Drag state for poem stars
        this.draggedStar = null;
        this.dragOffsetX = 0;
        this.dragOffsetY = 0;

        // Drag hint state
        this.showDragHint = false;
        this.dragHintStartTime = 0;
        this.dragHintDuration = 4000; // Show hint for 4 seconds
        this.dragHintShown = false; // Only show once
        this.poems = [
            'رحماك يا عين المها أنني\nأخشى عليك العين من عيني',
            'يَهيمُ فُؤادي ما حَييتُ بِذِكرِها\nوَلَو أَنَّني قَد مُتُّ هامَ بِها الصَدى',
            'جَرَى مِنْهَا السِّوَاكُ عَلَى نَقِيٍّ\nكَأَنَّ البَرْقَ إذْ ضَحِكَتْ تَلَالَا',
            'كَأَنَّ كَلَامَهَا دُرٌّ نَثِيرٌ\nوَرَوْنَقَ ثَغْرِهَا دُرٌّ نَظِيمُ',
            'تَرى هَدَبَ الطَّرْفاءِ بَيْنَ مُتونِهاِ\nوَوُرْقَ الْحَمامِ فَوْقَها تَتَرَنَّمُ',
            'لَمْ أَرَ شَمْساً بِلَيْلٍ قَبْلَها طَلَعَتْ\nحَتَّى تَجَلَّتْ لَنا فِي لَيْلَةِ الظُّلَمِ',
            'عجباً لخدكَ إنه\nوردٌ يشوكُ ولا يُشاك',
            'فللورد شهر واحد ثم ينقضي\nووردك باقٍ لا يزول عن الخد',
            'يا سارِقِ الأَنوارِ مِن شَمسِ الضُحى\nيا مُثكِلي طيبَ الكَرى وَمُنَغِّصي',
            'وطَرٌ ما فيهِ منْ عيْبٍ سَوَى\nأنّهُ مرّ كلَمْحِ البصَرِ',
            'عذراء في أوج الشباب مليحة\nأسرت بطرف المقلتين فؤادي'
        ];

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

        // Handle phase transitions
        if (phase !== this.lastPhase) {
            this.phaseTransitionStart = currentTime;
            this.lastPhase = phase;
        }

        // Smooth initiator fade out when forming starts
        if (phase === 'forming' || phase === 'complete') {
            this.initiatorFadeOut = Math.max(0, this.initiatorFadeOut - 0.02);
        } else {
            this.initiatorFadeOut = Math.min(1, this.initiatorFadeOut + 0.02);
        }

        // Smooth dimming transition when complete
        if (phase === 'complete') {
            // Gradually increase dim over 2 seconds
            const timeSinceComplete = currentTime - this.phaseTransitionStart;
            this.dimProgress = Math.min(1, timeSinceComplete / 2000);
        } else {
            this.dimProgress = 0;
        }

        // Draw background stars first
        for (const star of backgroundStars) {
            this.drawStar(star, currentTime, false);
        }

        // Draw constellation lines (behind main stars) with smooth fade
        if (connectionLines && connectionLines.length > 0 && linesFadeIn > 0) {
            // Dim lines slightly when complete, matching the dimmed stars
            const lineDimFactor = phase === 'complete' ? (1 - this.dimProgress * 0.5) : 1;
            this.drawConnectionLines(connectionLines, linesFadeIn * lineDimFactor);
        }

        // Draw main stars with smooth dimming transition
        for (const star of stars) {
            const shouldDim = star.word && star.word !== 'ANSAM';
            const dimAmount = shouldDim ? this.dimProgress : 0;
            this.drawStar(star, currentTime, star.isActivated, dimAmount);
        }

        // Draw initiator star with name (with fade out)
        if (initiatorStar && this.initiatorFadeOut > 0) {
            this.drawInitiatorStar(initiatorStar, currentTime, this.initiatorFadeOut);
        }

        // Draw hearts around ANSAM when complete (fade in gradually)
        if (phase === 'complete' && ansamBounds) {
            const heartsDelay = 1500; // Start hearts after 1.5s
            const timeSinceComplete = currentTime - this.phaseTransitionStart;
            if (timeSinceComplete > heartsDelay) {
                const heartsFade = Math.min(1, (timeSinceComplete - heartsDelay) / 1000);
                this.updateAndDrawHearts(currentTime, ansamBounds, heartsFade);
            }
        }

        // Draw floating poem star when complete (fade in after hearts)
        if (phase === 'complete' && ansamBounds) {
            const poemsDelay = 3000; // Start poems after 3s
            const timeSinceComplete = currentTime - this.phaseTransitionStart;
            if (timeSinceComplete > poemsDelay) {
                this.updateAndDrawPoemStar(currentTime, ansamBounds);
            }
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

    drawStar(star, currentTime, isActivated, dimAmount = 0) {
        const ctx = this.ctx;
        const { x, y, size, brightness, twinklePhase, glowIntensity } = star;

        // Calculate twinkle
        const twinkle = 0.7 + Math.sin(twinklePhase) * 0.3;
        let finalBrightness = (glowIntensity || brightness) * twinkle;

        // Apply smooth dimming for non-ANSAM stars when complete
        if (dimAmount > 0) {
            const dimFactor = 1 - (dimAmount * 0.65); // Dim to 35% at full
            finalBrightness *= dimFactor;
        }

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

    drawInitiatorStar(star, currentTime, fade = 1) {
        const ctx = this.ctx;
        const { x, y, size, pulsePhase } = star;

        const pulse = 0.85 + Math.sin(pulsePhase) * 0.15;
        const slowPulse = 0.9 + Math.sin(pulsePhase * 0.3) * 0.1;

        // Apply fade to all opacity values
        const f = fade;

        // Outer glow - larger and warmer
        const glowSize = size * 12 * slowPulse;
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, glowSize);
        gradient.addColorStop(0, `rgba(255, 252, 245, ${0.5 * pulse * f})`);
        gradient.addColorStop(0.3, `rgba(255, 248, 235, ${0.2 * pulse * f})`);
        gradient.addColorStop(0.6, `rgba(255, 245, 225, ${0.08 * pulse * f})`);
        gradient.addColorStop(1, 'rgba(255, 250, 240, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, glowSize, 0, Math.PI * 2);
        ctx.fill();

        // Secondary subtle glow ring
        const ringSize = size * 6 * pulse;
        ctx.beginPath();
        ctx.arc(x, y, ringSize, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 250, 240, ${0.1 * pulse * f})`;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Core star
        ctx.beginPath();
        ctx.arc(x, y, size * 1.2 * pulse, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 253, 248, ${0.95 * f})`;
        ctx.fill();

        // Bright center
        ctx.beginPath();
        ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${f})`;
        ctx.fill();

        // Subtle cross flare
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.15 * pulse * f})`;
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
        ctx.fillStyle = `rgba(255, 250, 240, ${(0.6 + pulse * 0.2) * f})`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('سهيل', x, y + size * 3 + floatOffset);
    }

    updateAndDrawHearts(currentTime, bounds, globalFade = 1) {
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

            // Apply global fade for smooth transition
            this.drawHeart(ctx, heart.x, floatY, heart.size, heart.opacity * globalFade);
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

        // Sky blue gradient
        const gradient = ctx.createRadialGradient(0, size * 0.4, 0, 0, size * 0.4, size);
        gradient.addColorStop(0, `rgba(135, 206, 250, ${opacity * 0.9})`);
        gradient.addColorStop(1, `rgba(100, 180, 255, ${opacity * 0.7})`);

        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.restore();
    }

    updateAndDrawPoemStar(currentTime, ansamBounds) {
        const ctx = this.ctx;
        const w = window.innerWidth;
        const h = window.innerHeight;
        const isMobile = w < 768;

        // Predefined positions that avoid the words (corners and edges)
        const positions = isMobile ? [
            // Mobile: positions around the edges
            { x: w * 0.5, y: h * 0.04 },   // Top center
            { x: w * 0.12, y: h * 0.18 },  // Top left
            { x: w * 0.88, y: h * 0.18 },  // Top right
            { x: w * 0.08, y: h * 0.38 },  // Left upper
            { x: w * 0.92, y: h * 0.38 },  // Right upper
            { x: w * 0.08, y: h * 0.62 },  // Left lower
            { x: w * 0.92, y: h * 0.62 },  // Right lower
            { x: w * 0.12, y: h * 0.92 },  // Bottom left
            { x: w * 0.5, y: h * 0.95 },   // Bottom center
            { x: w * 0.88, y: h * 0.92 },  // Bottom right
            { x: w * 0.5, y: h * 0.15 },   // Top center alt
        ] : [
            // Desktop: more spread out positions
            { x: w * 0.06, y: h * 0.08 },  // Top left corner
            { x: w * 0.5, y: h * 0.05 },   // Top center
            { x: w * 0.94, y: h * 0.08 },  // Top right corner
            { x: w * 0.04, y: h * 0.35 },  // Left upper
            { x: w * 0.96, y: h * 0.35 },  // Right upper
            { x: w * 0.04, y: h * 0.65 },  // Left lower
            { x: w * 0.96, y: h * 0.65 },  // Right lower
            { x: w * 0.06, y: h * 0.92 },  // Bottom left corner
            { x: w * 0.5, y: h * 0.95 },   // Bottom center
            { x: w * 0.94, y: h * 0.92 },  // Bottom right corner
            { x: w * 0.15, y: h * 0.15 },  // Inner top left
        ];

        // Spawn poems one at a time with delay
        if (!this.allPoemsSpawned && this.poemIndex < this.poems.length && this.poemIndex < positions.length) {
            if (this.poemStars.length === 0 || currentTime - this.lastPoemTime > this.poemDelay) {
                const poem = this.poems[this.poemIndex];
                const pos = positions[this.poemIndex];

                const isFirstPoem = this.poemStars.length === 0;

                this.poemStars.push({
                    baseX: pos.x,
                    baseY: pos.y,
                    x: pos.x,
                    y: pos.y,
                    text: poem,
                    size: 2,
                    opacity: 0,
                    createdAt: currentTime,
                    twinkle: Math.random() * Math.PI * 2,
                    floatPhase: Math.random() * Math.PI * 2,
                    pulsePhase: 0, // For attention pulse on spawn
                    isPulsing: true // Enable pulse effect
                });

                this.lastPoemTime = currentTime;
                this.poemIndex++;

                // Show drag hint on first poem
                if (isFirstPoem && !this.dragHintShown) {
                    this.showDragHint = true;
                    this.dragHintStartTime = currentTime;
                    this.dragHintShown = true;
                }

                if (this.poemIndex >= this.poems.length || this.poemIndex >= positions.length) {
                    this.allPoemsSpawned = true;
                }
            }
        }

        // Update and draw all poem stars
        for (const star of this.poemStars) {
            const age = currentTime - star.createdAt;

            // Fade in over 2 seconds, then stay visible
            if (age < 2000) {
                star.opacity = age / 2000;
            } else {
                star.opacity = 1;
            }

            // Update pulse phase (attention pulse on spawn)
            if (star.isPulsing) {
                star.pulsePhase += 0.08;
                // Stop pulsing after ~3 seconds
                if (star.pulsePhase > Math.PI * 3) {
                    star.isPulsing = false;
                }
            }

            // Gentle floating in place
            star.floatPhase += 0.015;
            star.twinkle += 0.03;

            const floatX = Math.sin(star.floatPhase) * 3;
            const floatY = Math.cos(star.floatPhase * 0.7) * 2;

            star.x = star.baseX + floatX;
            star.y = star.baseY + floatY;

            // Draw star
            const twinkle = 0.8 + Math.sin(star.twinkle) * 0.2;
            const finalOpacity = star.opacity * twinkle;

            // Attention pulse effect (expanding ring) - amber color
            if (star.isPulsing && star.opacity > 0.3) {
                const pulseProgress = (star.pulsePhase % Math.PI) / Math.PI;
                const pulseSize = star.size * (15 + pulseProgress * 25);
                const pulseOpacity = (1 - pulseProgress) * 0.3 * star.opacity;

                ctx.beginPath();
                ctx.arc(star.x, star.y, pulseSize, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(255, 191, 105, ${pulseOpacity})`;
                ctx.lineWidth = 2;
                ctx.stroke();
            }

            // Glow (larger when pulsing) - amber color
            const glowMultiplier = star.isPulsing ? 1.5 : 1;
            const glowSize = star.size * 8 * glowMultiplier;
            const gradient = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, glowSize);
            gradient.addColorStop(0, `rgba(255, 200, 120, ${finalOpacity * 0.6})`);
            gradient.addColorStop(0.5, `rgba(255, 180, 100, ${finalOpacity * 0.25})`);
            gradient.addColorStop(1, 'rgba(255, 170, 80, 0)');

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(star.x, star.y, glowSize, 0, Math.PI * 2);
            ctx.fill();

            // Core - amber color
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 210, 140, ${finalOpacity})`;
            ctx.fill();

            // Draw multi-line poem text
            const fontSize = isMobile ? 12 : 16;
            const lineHeight = fontSize * 1.5;

            ctx.font = `${fontSize}px "Amiri", "Geeza Pro", serif`;
            ctx.fillStyle = `rgba(255, 250, 240, ${finalOpacity * 0.95})`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';

            // Split text by newlines and draw each line
            const lines = star.text.split('\n');
            const startY = star.y + star.size * 4 + 8;

            lines.forEach((line, index) => {
                ctx.fillText(line, star.x, startY + index * lineHeight);
            });
        }

        // Draw drag hint near first poem
        if (this.showDragHint && this.poemStars.length > 0) {
            const hintAge = currentTime - this.dragHintStartTime;

            if (hintAge > this.dragHintDuration) {
                this.showDragHint = false;
            } else {
                const firstStar = this.poemStars[0];

                // Fade in for first 500ms, stay visible, fade out last 1000ms
                let hintOpacity;
                if (hintAge < 500) {
                    hintOpacity = hintAge / 500;
                } else if (hintAge < this.dragHintDuration - 1000) {
                    hintOpacity = 1;
                } else {
                    hintOpacity = (this.dragHintDuration - hintAge) / 1000;
                }

                // Position hint below the poem text
                const hintX = firstStar.x;
                const hintY = firstStar.y + 80;

                // Draw hand icon with drag arrows
                this.drawDragHint(ctx, hintX, hintY, hintOpacity, currentTime);
            }
        }
    }

    drawDragHint(ctx, x, y, opacity, currentTime) {
        ctx.save();
        ctx.translate(x, y);

        // Gentle side-to-side animation
        const sway = Math.sin(currentTime * 0.003) * 8;
        ctx.translate(sway, 0);

        // Draw arrows (left and right)
        const arrowOpacity = opacity * 0.7;
        ctx.strokeStyle = `rgba(255, 250, 240, ${arrowOpacity})`;
        ctx.fillStyle = `rgba(255, 250, 240, ${arrowOpacity})`;
        ctx.lineWidth = 1.5;

        // Left arrow
        ctx.beginPath();
        ctx.moveTo(-25, 0);
        ctx.lineTo(-15, 0);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-25, 0);
        ctx.lineTo(-20, -4);
        ctx.lineTo(-20, 4);
        ctx.closePath();
        ctx.fill();

        // Right arrow
        ctx.beginPath();
        ctx.moveTo(25, 0);
        ctx.lineTo(15, 0);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(25, 0);
        ctx.lineTo(20, -4);
        ctx.lineTo(20, 4);
        ctx.closePath();
        ctx.fill();

        // Draw simple hand icon in center
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 250, 240, ${opacity * 0.5})`;
        ctx.fill();
        ctx.strokeStyle = `rgba(255, 250, 240, ${opacity * 0.8})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Small dot in center
        ctx.beginPath();
        ctx.arc(0, 0, 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 250, 240, ${opacity})`;
        ctx.fill();

        // "move" text in Arabic
        const isMobile = window.innerWidth < 768;
        ctx.font = `${isMobile ? 12 : 14}px "Amiri", "Geeza Pro", serif`;
        ctx.fillStyle = `rgba(255, 250, 240, ${opacity * 0.6})`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('حرّك', 0, 15);

        ctx.restore();
    }

    // Check if a point is near a poem star (for dragging)
    findPoemStarAt(x, y) {
        const isMobile = window.innerWidth < 768;
        const hitRadius = isMobile ? 80 : 60; // Larger hit area for easier grabbing

        for (const star of this.poemStars) {
            const dx = x - star.x;
            const dy = y - star.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < hitRadius) {
                return star;
            }
        }
        return null;
    }

    // Start dragging a poem star
    startDrag(x, y) {
        const star = this.findPoemStarAt(x, y);
        if (star) {
            this.draggedStar = star;
            this.dragOffsetX = star.baseX - x;
            this.dragOffsetY = star.baseY - y;
            return true;
        }
        return false;
    }

    // Update dragged star position
    updateDrag(x, y) {
        if (this.draggedStar) {
            this.draggedStar.baseX = x + this.dragOffsetX;
            this.draggedStar.baseY = y + this.dragOffsetY;
        }
    }

    // End dragging
    endDrag() {
        this.draggedStar = null;
    }

    // Check if currently dragging
    isDragging() {
        return this.draggedStar !== null;
    }
}
