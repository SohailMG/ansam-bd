// Star state management
import { generateFinalComposition, getWordStarCount, getLetterConnections } from './letters.js';

// Phases of the experience
export const Phase = {
    WAITING: 'waiting',
    FORMING: 'forming',
    COMPLETE: 'complete'
};

export class StarManager {
    constructor(canvasWidth, canvasHeight) {
        this.width = canvasWidth;
        this.height = canvasHeight;
        this.stars = [];
        this.initiatorStar = null;
        this.phase = Phase.WAITING;
        this.phaseStartTime = 0;

        // Word formation tracking
        this.activationQueue = [];
        this.activatedCount = 0;
        this.totalStarCount = 0;
        this.lastActivationTime = 0;
        this.activationInterval = 80; // Faster activation

        // Background stars
        this.backgroundStars = [];

        // Connection lines data
        this.connectionLines = [];
        this.linesFadeIn = 0;

        // ANSAM bounds for hearts
        this.ansamBounds = null;

        this.init();
    }

    init() {
        // Calculate total stars needed for final composition
        const totalNeeded = getWordStarCount('HAPPY') + getWordStarCount('BIRTHDAY') + getWordStarCount('ANSAM');
        this.totalStarCount = totalNeeded;

        // Create letter-forming stars scattered randomly
        this.stars = [];
        for (let i = 0; i < totalNeeded; i++) {
            this.stars.push(this.createStar(i, false));
        }

        // Create background stars (fewer on mobile for performance)
        this.backgroundStars = [];
        const isMobile = this.width < 768;
        const bgDensity = isMobile ? 25000 : 15000;
        const bgCount = Math.floor((this.width * this.height) / bgDensity);
        for (let i = 0; i < bgCount; i++) {
            this.backgroundStars.push(this.createStar(i + totalNeeded, true));
        }

        this.createInitiatorStar();
    }

    createStar(id, isBackground) {
        const margin = 30;
        const x = margin + Math.random() * (this.width - margin * 2);
        const y = margin + Math.random() * (this.height - margin * 2);

        // Adjust star sizes for mobile
        const isMobile = this.width < 768;
        const sizeMultiplier = isMobile ? 1.3 : 1;

        return {
            id,
            x,
            y,
            startX: x,
            startY: y,
            targetX: x,
            targetY: y,
            size: isBackground
                ? (0.5 + Math.random() * 0.8) * sizeMultiplier
                : (1.2 + Math.random() * 1) * sizeMultiplier,
            brightness: isBackground ? 0.15 + Math.random() * 0.25 : 0.35 + Math.random() * 0.35,
            twinklePhase: Math.random() * Math.PI * 2,
            twinkleSpeed: 0.3 + Math.random() * 1,
            isActivated: false,
            isBackground,
            animationProgress: 1,
            animationDuration: 1500 + Math.random() * 1000,
            animationStartTime: 0,
            glowIntensity: 0,
            // Letter position metadata
            char: null,
            charIndex: -1,
            pointIndex: -1,
            letterStartIndex: -1
        };
    }

    createInitiatorStar() {
        const x = this.width * (0.35 + Math.random() * 0.3);
        const y = this.height * (0.25 + Math.random() * 0.2);

        // Larger initiator on mobile for easier tapping
        const isMobile = this.width < 768;
        const starSize = isMobile ? 3.5 : 2.5;

        this.initiatorStar = {
            id: -1,
            x,
            y,
            startX: x,
            startY: y,
            targetX: x,
            targetY: y,
            size: starSize,
            brightness: 0.7,
            twinklePhase: 0,
            twinkleSpeed: 0.8,
            isActivated: false,
            isBackground: false,
            isInitiator: true,
            animationProgress: 1,
            glowIntensity: 0,
            pulsePhase: 0
        };
    }

    checkInitiatorClick(clickX, clickY) {
        if (this.phase !== Phase.WAITING || !this.initiatorStar) return false;

        const dx = clickX - this.initiatorStar.x;
        const dy = clickY - this.initiatorStar.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Larger touch area on mobile
        const isMobile = this.width < 768;
        const hitRadius = isMobile ? 45 : 30;

        return dist < hitRadius;
    }

    startExperience(currentTime) {
        this.phase = Phase.FORMING;
        this.phaseStartTime = currentTime;
        this.setupFormation(currentTime);
    }

    setupFormation(currentTime) {
        const positions = generateFinalComposition(this.width, this.height);

        this.activatedCount = 0;
        this.lastActivationTime = currentTime;
        this.connectionLines = [];
        this.linesFadeIn = 0;

        // Calculate word boundaries
        const happyCount = getWordStarCount('HAPPY');
        const birthdayCount = getWordStarCount('BIRTHDAY');
        const ansamStartIndex = happyCount + birthdayCount;

        // Assign each star to a specific position (1:1 mapping)
        // Stars[i] will go to positions[i]
        for (let i = 0; i < positions.length && i < this.stars.length; i++) {
            const star = this.stars[i];
            const target = positions[i];

            star.targetX = target.x + (Math.random() - 0.5) * 3;
            star.targetY = target.y + (Math.random() - 0.5) * 3;
            star.char = target.char;
            star.charIndex = target.charIndex;
            star.pointIndex = target.pointIndex;
            star.letterStartIndex = target.letterStartIndex;

            // Mark which word this star belongs to
            if (i < happyCount) {
                star.word = 'HAPPY';
            } else if (i < happyCount + birthdayCount) {
                star.word = 'BIRTHDAY';
            } else {
                star.word = 'ANSAM';
            }
        }

        // Create activation queue in random order (controls WHEN stars activate, not WHERE they go)
        const indices = this.stars.map((_, i) => i);
        this.activationQueue = indices.sort(() => Math.random() - 0.5);

        // Build connection lines
        this.buildConnectionLines(positions);

        // Calculate ANSAM bounds for hearts animation
        this.calculateAnsamBounds(positions);
    }

    calculateAnsamBounds(positions) {
        // ANSAM starts after HAPPY and BIRTHDAY
        const happyCount = getWordStarCount('HAPPY');
        const birthdayCount = getWordStarCount('BIRTHDAY');
        const ansamStartIndex = happyCount + birthdayCount;

        const ansamPositions = positions.filter(p => p.letterStartIndex >= ansamStartIndex);

        if (ansamPositions.length === 0) {
            this.ansamBounds = null;
            return;
        }

        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;

        for (const pos of ansamPositions) {
            minX = Math.min(minX, pos.x);
            maxX = Math.max(maxX, pos.x);
            minY = Math.min(minY, pos.y);
            maxY = Math.max(maxY, pos.y);
        }

        // Add padding around the word
        const padding = 40;
        this.ansamBounds = {
            x: minX - padding,
            y: minY - padding,
            width: (maxX - minX) + padding * 2,
            height: (maxY - minY) + padding * 2
        };
    }

    buildConnectionLines(positions) {
        this.connectionLines = [];

        // Group positions by letterStartIndex (unique per letter instance)
        const letterGroups = {};
        positions.forEach((pos) => {
            const key = pos.letterStartIndex;
            if (!letterGroups[key]) {
                letterGroups[key] = { char: pos.char, positions: [] };
            }
            letterGroups[key].positions.push(pos);
        });

        // Build lines for each letter
        Object.entries(letterGroups).forEach(([startIndex, group]) => {
            const connections = getLetterConnections(group.char);
            connections.forEach(([fromIdx, toIdx]) => {
                const fromPos = group.positions.find(p => p.pointIndex === fromIdx);
                const toPos = group.positions.find(p => p.pointIndex === toIdx);
                if (fromPos && toPos) {
                    this.connectionLines.push({
                        letterStartIndex: parseInt(startIndex),
                        fromPointIndex: fromIdx,
                        toPointIndex: toIdx,
                        fromX: fromPos.x,
                        fromY: fromPos.y,
                        toX: toPos.x,
                        toY: toPos.y,
                        visible: false
                    });
                }
            });
        });
    }

    update(currentTime) {
        if (this.initiatorStar && this.phase === Phase.WAITING) {
            this.initiatorStar.pulsePhase += 0.02;
        }

        if (this.phase === Phase.FORMING) {
            this.processActivationQueue(currentTime);

            // Check if all stars activated and mostly settled
            if (this.activationQueue.length === 0 && this.activatedCount >= this.totalStarCount) {
                const settledCount = this.stars.filter(s => s.isActivated && s.animationProgress > 0.7).length;
                const settledRatio = settledCount / this.totalStarCount;

                // Start fading in lines as stars settle
                if (settledRatio > 0.5) {
                    this.linesFadeIn = Math.min(1, this.linesFadeIn + 0.015);
                }

                // Complete when all settled and lines visible
                if (settledRatio > 0.95 && this.linesFadeIn >= 1) {
                    this.phase = Phase.COMPLETE;
                    this.phaseStartTime = currentTime;
                }
            }
        }

        this.updateStarAnimations(currentTime);
        this.updateConnectionLines();
    }

    processActivationQueue(currentTime) {
        if (this.activationQueue.length === 0) return;

        if (currentTime - this.lastActivationTime > this.activationInterval) {
            const starIndex = this.activationQueue.shift();
            const star = this.stars[starIndex];
            if (star) {
                star.startX = star.x;
                star.startY = star.y;
                star.isActivated = true;
                star.animationProgress = 0;
                star.animationStartTime = currentTime;
                star.glowIntensity = 0.95;
                this.activatedCount++;
                this.lastActivationTime = currentTime;
            }
        }
    }

    updateStarAnimations(currentTime) {
        for (const star of this.stars) {
            if (star.animationProgress < 1) {
                const elapsed = currentTime - star.animationStartTime;
                star.animationProgress = Math.min(elapsed / star.animationDuration, 1);

                // Ease-out cubic
                const t = star.animationProgress;
                const eased = 1 - Math.pow(1 - t, 3);

                star.x = star.startX + (star.targetX - star.startX) * eased;
                star.y = star.startY + (star.targetY - star.startY) * eased;
            }

            star.twinklePhase += star.twinkleSpeed * 0.015;

            const targetGlow = star.isActivated ? 0.9 : star.brightness;
            star.glowIntensity += (targetGlow - star.glowIntensity) * 0.05;
        }

        for (const star of this.backgroundStars) {
            star.twinklePhase += star.twinkleSpeed * 0.015;
        }
    }

    updateConnectionLines() {
        // Update line positions from actual star positions
        for (const line of this.connectionLines) {
            // Find stars by their assigned letterStartIndex and pointIndex
            const fromStar = this.stars.find(s =>
                s.letterStartIndex === line.letterStartIndex &&
                s.pointIndex === line.fromPointIndex
            );
            const toStar = this.stars.find(s =>
                s.letterStartIndex === line.letterStartIndex &&
                s.pointIndex === line.toPointIndex
            );

            if (fromStar && toStar && fromStar.isActivated && toStar.isActivated) {
                line.fromX = fromStar.x;
                line.fromY = fromStar.y;
                line.toX = toStar.x;
                line.toY = toStar.y;
                line.visible = true;
            } else {
                line.visible = false;
            }
        }
    }

    resize(newWidth, newHeight) {
        const scaleX = newWidth / this.width;
        const scaleY = newHeight / this.height;

        this.width = newWidth;
        this.height = newHeight;

        for (const star of this.stars) {
            star.x *= scaleX;
            star.y *= scaleY;
            star.startX *= scaleX;
            star.startY *= scaleY;
            star.targetX *= scaleX;
            star.targetY *= scaleY;
        }

        for (const star of this.backgroundStars) {
            star.x *= scaleX;
            star.y *= scaleY;
        }

        if (this.initiatorStar) {
            this.initiatorStar.x *= scaleX;
            this.initiatorStar.y *= scaleY;
        }
    }

    getStars() {
        return this.stars;
    }

    getBackgroundStars() {
        return this.backgroundStars;
    }

    getInitiatorStar() {
        return this.initiatorStar;
    }

    getPhase() {
        return this.phase;
    }

    getConnectionLines() {
        return this.connectionLines;
    }

    getLinesFadeIn() {
        return this.linesFadeIn;
    }

    getAnsamBounds() {
        return this.ansamBounds;
    }

    isComplete() {
        return this.phase === Phase.COMPLETE;
    }
}
