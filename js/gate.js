// Birthday gate — blocks access until the correct birthday is entered
// Self-contained: injects its own styles, SVG guardian character, and DOM elements

const STORAGE_KEY = 'ansam_access_granted';
const EXPECTED_HASH = 'a09ffe25f8cce241343d6ed255caf53d5b5c744ff04db182ad20e01e0ce4a47f';

async function verifyDate(input) {
    const cleaned = input.trim();
    const encoder = new TextEncoder();
    const data = encoder.encode(cleaned);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex === EXPECTED_HASH;
}

function isAlreadyGranted() {
    try {
        return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch (_) {
        return false;
    }
}

function grantAccess() {
    try {
        localStorage.setItem(STORAGE_KEY, 'true');
    } catch (_) { /* silent */ }
}

// ─── Simple SVG Guardian ──────────────────────────────────────────────
// A round face, two dot eyes, a small smile. Eyelids are simple rects
// that slide down from above to cover the eyes.

function createGuardianSVG() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 120 120');
    svg.setAttribute('class', 'gate-guardian');
    svg.setAttribute('aria-hidden', 'true');

    svg.innerHTML = `
        <defs>
            <clipPath id="gEyeClipL">
                <circle cx="42" cy="52" r="10" />
            </clipPath>
            <clipPath id="gEyeClipR">
                <circle cx="78" cy="52" r="10" />
            </clipPath>
        </defs>

        <!-- Face -->
        <circle cx="60" cy="60" r="50"
            fill="rgba(255,235,215,0.07)"
            stroke="rgba(255,230,200,0.15)" stroke-width="1.5" />

        <!-- Cheeks (happy only) -->
        <circle class="gate-cheek" cx="30" cy="68" r="9" fill="rgba(255,180,140,0.12)" opacity="0" />
        <circle class="gate-cheek" cx="90" cy="68" r="9" fill="rgba(255,180,140,0.12)" opacity="0" />

        <!-- Left eye area -->
        <g clip-path="url(#gEyeClipL)">
            <!-- Eyeball — no stroke to prevent bleed-through when lid is closed -->
            <circle cx="42" cy="52" r="10"
                fill="rgba(255,240,225,0.1)" />
            <!-- Pupil -->
            <circle cx="42" cy="53" r="4.5" fill="rgba(255,230,200,0.85)" />
            <!-- Highlight -->
            <circle cx="40" cy="50.5" r="1.5" fill="rgba(255,255,255,0.5)" />
            <!-- Eyelid — tall rect that fully covers the eye when closed -->
            <rect class="gate-lid-l" x="30" y="26" width="24" height="22"
                fill="#000008" />
        </g>
        <!-- Eye outline ring — drawn outside the clip so lid covers it cleanly -->
        <circle cx="42" cy="52" r="10"
            fill="none" stroke="rgba(255,230,200,0.35)" stroke-width="1" />

        <!-- Right eye area -->
        <g clip-path="url(#gEyeClipR)">
            <circle cx="78" cy="52" r="10"
                fill="rgba(255,240,225,0.1)" />
            <circle cx="78" cy="53" r="4.5" fill="rgba(255,230,200,0.85)" />
            <circle cx="76" cy="50.5" r="1.5" fill="rgba(255,255,255,0.5)" />
            <rect class="gate-lid-r" x="66" y="26" width="24" height="22"
                fill="#000008" />
        </g>
        <circle cx="78" cy="52" r="10"
            fill="none" stroke="rgba(255,230,200,0.35)" stroke-width="1" />

        <!-- Closed-eye lines (visible when shut) -->
        <line class="gate-shut-l" x1="33" y1="52" x2="51" y2="52"
            stroke="rgba(255,230,200,0.4)" stroke-width="1.5" stroke-linecap="round" opacity="0" />
        <line class="gate-shut-r" x1="69" y1="52" x2="87" y2="52"
            stroke="rgba(255,230,200,0.4)" stroke-width="1.5" stroke-linecap="round" opacity="0" />

        <!-- Mouth -->
        <path class="gate-mouth" d="M 48 74 Q 60 82, 72 74"
            fill="none" stroke="rgba(255,230,200,0.3)" stroke-width="1.5" stroke-linecap="round" />
    `;

    return svg;
}

// ─── Eye Control ──────────────────────────────────────────────────────
// Each eyelid is a rect clipped to the eye circle (r=10, center y=52).
// Slide its `y` attribute:
//   open:   y = 26  (rect sits above the eye, out of clip area)
//   closed: y = 42  (rect bottom edge at y=64, fully covers eye center at 52)

function setEye(svg, openness, which = 'both') {
    openness = Math.max(0, Math.min(1, openness));

    // y: 42 (closed) to 26 (open) — 16px travel range
    const lidY = 42 - openness * 16;
    const shutOpacity = openness < 0.1 ? 1 : 0;

    const sides = which === 'left' ? ['l'] : which === 'right' ? ['r'] : ['l', 'r'];

    sides.forEach(s => {
        const lid = svg.querySelector(`.gate-lid-${s}`);
        const shut = svg.querySelector(`.gate-shut-${s}`);
        if (lid) lid.setAttribute('y', lidY);
        if (shut) shut.setAttribute('opacity', shutOpacity);
    });
}

function setMouth(svg, mood) {
    const mouth = svg.querySelector('.gate-mouth');
    const cheeks = svg.querySelectorAll('.gate-cheek');
    if (!mouth) return;

    if (mood === 'happy') {
        mouth.setAttribute('d', 'M 46 73 Q 60 86, 74 73');
        mouth.setAttribute('stroke', 'rgba(255,230,200,0.55)');
        mouth.setAttribute('stroke-width', '2');
        cheeks.forEach(c => c.setAttribute('opacity', '1'));
    } else if (mood === 'suspicious') {
        mouth.setAttribute('d', 'M 52 76 Q 60 72, 68 76');
        mouth.setAttribute('stroke', 'rgba(255,180,160,0.4)');
        mouth.setAttribute('stroke-width', '1.5');
        cheeks.forEach(c => c.setAttribute('opacity', '0'));
    } else {
        mouth.setAttribute('d', 'M 48 74 Q 60 82, 72 74');
        mouth.setAttribute('stroke', 'rgba(255,230,200,0.3)');
        mouth.setAttribute('stroke-width', '1.5');
        cheeks.forEach(c => c.setAttribute('opacity', '0'));
    }
}

// ─── Smooth rAF eye animation ─────────────────────────────────────────

const eyeState = { l: 1, r: 1 };
const eyeTarget = { l: 1, r: 1 };
let animFrame = null;

function animateEyes(svg) {
    let changed = false;

    ['l', 'r'].forEach(s => {
        if (Math.abs(eyeState[s] - eyeTarget[s]) > 0.005) {
            changed = true;
            const diff = eyeTarget[s] - eyeState[s];
            // Opening is very slow (0.02), closing is faster (0.09)
            eyeState[s] += diff * (diff > 0 ? 0.02 : 0.09);
            if (Math.abs(eyeState[s] - eyeTarget[s]) < 0.005) {
                eyeState[s] = eyeTarget[s];
            }
        }
    });

    if (changed) {
        if (Math.abs(eyeState.l - eyeState.r) < 0.005) {
            setEye(svg, eyeState.l, 'both');
        } else {
            setEye(svg, eyeState.l, 'left');
            setEye(svg, eyeState.r, 'right');
        }
    }

    animFrame = requestAnimationFrame(() => animateEyes(svg));
}

function setEyeTarget(which, value) {
    value = Math.max(0, Math.min(1, value));
    if (which === 'both') { eyeTarget.l = value; eyeTarget.r = value; }
    else if (which === 'left') { eyeTarget.l = value; }
    else { eyeTarget.r = value; }
}

function setEyeImmediate(svg, which, value) {
    value = Math.max(0, Math.min(1, value));
    if (which === 'both' || which === 'left') { eyeState.l = value; eyeTarget.l = value; }
    if (which === 'both' || which === 'right') { eyeState.r = value; eyeTarget.r = value; }
    setEye(svg, value, which);
}

// ─── Styles ───────────────────────────────────────────────────────────

function injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .gate-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: #000008;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            font-family: 'Amiri', 'Georgia', serif;
            opacity: 1;
            transition: opacity 0.8s ease, transform 0.8s ease;
        }

        .gate-overlay.gate-exit {
            opacity: 0;
            transform: scale(1.02);
            pointer-events: none;
        }

        .gate-guardian {
            width: 130px;
            height: 130px;
            margin-bottom: 22px;
            animation: guardianFloat 5s ease-in-out infinite;
            overflow: visible;
        }

        .gate-guardian .gate-mouth {
            transition: all 0.3s ease;
        }

        .gate-guardian .gate-cheek {
            transition: opacity 0.5s ease;
        }

        @keyframes guardianFloat {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-5px); }
        }

        .gate-title {
            font-size: 1.5rem;
            color: rgba(255, 230, 200, 0.85);
            text-align: center;
            direction: ltr;
            font-family: 'Lora', 'Georgia', serif;
            line-height: 2;
            margin-bottom: 8px;
            padding: 0 30px;
        }

        .gate-subtitle {
            font-size: 0.95rem;
            color: rgba(255, 230, 200, 0.4);
            text-align: center;
            direction: ltr;
            font-family: 'Lora', 'Georgia', serif;
            margin-bottom: 35px;
            padding: 0 30px;
        }

        .gate-input-wrap {
            position: relative;
            width: 220px;
        }

        .gate-input {
            width: 100%;
            background: transparent;
            border: none;
            border-bottom: 1px solid rgba(255, 230, 200, 0.2);
            color: rgba(255, 230, 200, 0.9);
            font-family: 'Lora', 'Georgia', serif;
            font-size: 1.4rem;
            text-align: center;
            padding: 10px 0;
            outline: none;
            letter-spacing: 0.15em;
            caret-color: rgba(255, 230, 200, 0.5);
            transition: border-color 0.3s ease;
        }

        .gate-input::placeholder {
            color: rgba(255, 230, 200, 0.2);
            font-size: 1rem;
            letter-spacing: 0.1em;
        }

        .gate-input:focus {
            border-bottom-color: rgba(255, 230, 200, 0.4);
        }

        .gate-input.gate-shake {
            animation: gateShake 0.5s ease;
            border-bottom-color: rgba(255, 120, 100, 0.4);
        }

        .gate-error {
            position: absolute;
            top: calc(100% + 14px);
            left: 50%;
            transform: translateX(-50%);
            font-size: 0.85rem;
            color: rgba(255, 180, 160, 0.7);
            text-align: center;
            direction: ltr;
            font-family: 'Lora', 'Georgia', serif;
            white-space: nowrap;
            opacity: 0;
            transition: opacity 0.4s ease;
        }

        .gate-error.visible {
            opacity: 1;
        }

        @keyframes gateShake {
            0%, 100% { transform: translateX(0); }
            15% { transform: translateX(-8px); }
            30% { transform: translateX(7px); }
            45% { transform: translateX(-6px); }
            60% { transform: translateX(5px); }
            75% { transform: translateX(-3px); }
            90% { transform: translateX(2px); }
        }

        @media (max-width: 480px) {
            .gate-guardian {
                width: 100px;
                height: 100px;
                margin-bottom: 16px;
            }

            .gate-title {
                font-size: 1.2rem;
            }

            .gate-subtitle {
                font-size: 0.85rem;
            }

            .gate-input {
                font-size: 1.2rem;
            }

            .gate-input-wrap {
                width: 190px;
            }
        }
    `;
    document.head.appendChild(style);
}

// ─── DOM Construction ─────────────────────────────────────────────────

function createGateDOM() {
    const overlay = document.createElement('div');
    overlay.className = 'gate-overlay';

    const guardian = createGuardianSVG();

    const title = document.createElement('div');
    title.className = 'gate-title';
    title.textContent = "This was made for someone special. Prove it's you.";

    const subtitle = document.createElement('div');
    subtitle.className = 'gate-subtitle';
    subtitle.textContent = 'When did the world first meet you?';

    const inputWrap = document.createElement('div');
    inputWrap.className = 'gate-input-wrap';
    inputWrap.innerHTML = `
        <input
            class="gate-input"
            type="text"
            inputmode="numeric"
            placeholder="سنة/شهر/يوم"
            maxlength="10"
            autocomplete="off"
            autocorrect="off"
            autocapitalize="off"
            spellcheck="false"
        >
        <div class="gate-error">Hmm... that's not who I'm looking for.</div>
    `;

    overlay.appendChild(guardian);
    overlay.appendChild(title);
    overlay.appendChild(subtitle);
    overlay.appendChild(inputWrap);

    document.body.appendChild(overlay);
    return { overlay, guardian };
}

// ─── Auto-format ──────────────────────────────────────────────────────

function autoFormatDate(input) {
    let digits = input.replace(/\D/g, '');
    digits = digits.slice(0, 8);

    let formatted = '';
    for (let i = 0; i < digits.length; i++) {
        if (i === 2 || i === 4) formatted += '/';
        formatted += digits[i];
    }
    return formatted;
}

// ─── Peek System ──────────────────────────────────────────────────────

function createPeekSystem() {
    let peekTimer = null;
    let isTyping = false;
    let isPeeking = false;
    let peekCount = 0;

    function schedulePeek() {
        const delay = 2200 + Math.random() * 2200;
        peekTimer = setTimeout(() => {
            if (isTyping && !isPeeking) doPeek();
            if (isTyping) schedulePeek();
        }, delay);
    }

    function doPeek() {
        isPeeking = true;
        peekCount++;
        const peekEye = peekCount % 2 === 0 ? 'left' : 'right';

        // Open to about 60% — a proper noticeable peek
        setEyeTarget(peekEye, 0.6);

        // Hold the peek for longer so it feels deliberate
        const holdTime = 900 + Math.random() * 700;
        setTimeout(() => {
            if (!isTyping) { isPeeking = false; return; }
            setEyeTarget(peekEye, 0);
            isPeeking = false;
        }, holdTime);
    }

    function startTyping() {
        if (isTyping) return;
        isTyping = true;
        isPeeking = false;
        setEyeTarget('both', 0);
        schedulePeek();
    }

    function stopTyping() {
        isTyping = false;
        isPeeking = false;
        if (peekTimer) { clearTimeout(peekTimer); peekTimer = null; }
        setEyeTarget('both', 1);
    }

    function destroy() {
        isTyping = false;
        isPeeking = false;
        if (peekTimer) { clearTimeout(peekTimer); peekTimer = null; }
    }

    return { startTyping, stopTyping, destroy };
}

// ─── Idle blink ───────────────────────────────────────────────────────

function startIdleBlink(svg) {
    let blinkTimer = null;
    let active = true;

    function scheduleBlink() {
        if (!active) return;
        const delay = 2500 + Math.random() * 3000;
        blinkTimer = setTimeout(() => { doBlink(); scheduleBlink(); }, delay);
    }

    function doBlink() {
        if (!active) return;
        // Snap shut
        setEyeImmediate(svg, 'both', 0);
        // Snap open — both use immediate so blinks are crisp
        setTimeout(() => {
            if (!active) return;
            setEyeImmediate(svg, 'both', 1);
        }, 120);
    }

    scheduleBlink();
    return () => { active = false; if (blinkTimer) clearTimeout(blinkTimer); };
}

// ─── Main Export ──────────────────────────────────────────────────────

export function initGate(onGranted) {
    if (isAlreadyGranted()) {
        onGranted();
        return;
    }

    injectStyles();
    const { overlay, guardian } = createGateDOM();
    const inputEl = overlay.querySelector('.gate-input');
    const errorEl = overlay.querySelector('.gate-error');

    let isUnlocked = false;
    let hasContent = false;

    setEyeImmediate(guardian, 'both', 1);
    setMouth(guardian, 'neutral');
    animateEyes(guardian);

    let stopBlink = startIdleBlink(guardian);
    const peekSystem = createPeekSystem();

    setTimeout(() => inputEl.focus(), 400);

    // ─── Input handling ───────────────────────────────────────────

    inputEl.addEventListener('input', () => {
        if (isUnlocked) return;

        const cursorPos = inputEl.selectionStart;
        const oldVal = inputEl.value;
        const formatted = autoFormatDate(oldVal);
        inputEl.value = formatted;

        if (formatted.length > oldVal.length) {
            inputEl.setSelectionRange(cursorPos + 1, cursorPos + 1);
        }

        errorEl.classList.remove('visible');
        inputEl.classList.remove('gate-shake');

        const digits = formatted.replace(/\D/g, '').length;

        if (digits > 0 && !hasContent) {
            hasContent = true;
            if (stopBlink) { stopBlink(); stopBlink = null; }
            peekSystem.startTyping();
        } else if (digits === 0 && hasContent) {
            hasContent = false;
            peekSystem.stopTyping();
            stopBlink = startIdleBlink(guardian);
        }
    });

    inputEl.addEventListener('input', () => {
        if (inputEl.value.length === 10) {
            setTimeout(() => attemptUnlock(), 350);
        }
    });

    inputEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') attemptUnlock();
    });

    // ─── Unlock logic ─────────────────────────────────────────────

    async function attemptUnlock() {
        if (isUnlocked) return;
        const value = inputEl.value;

        peekSystem.destroy();
        if (stopBlink) { stopBlink(); stopBlink = null; }

        if (await verifyDate(value)) {
            isUnlocked = true;
            grantAccess();

            setEyeTarget('both', 1);
            setMouth(guardian, 'happy');

            setTimeout(() => {
                if (animFrame) cancelAnimationFrame(animFrame);
                overlay.classList.add('gate-exit');
                setTimeout(() => { overlay.remove(); onGranted(); }, 800);
            }, 700);

        } else {
            setEyeTarget('both', 0.18);
            setMouth(guardian, 'suspicious');

            inputEl.classList.add('gate-shake');
            errorEl.classList.add('visible');

            setTimeout(() => {
                inputEl.value = '';
                inputEl.classList.remove('gate-shake');
                hasContent = false;

                setEyeTarget('both', 1);
                setMouth(guardian, 'neutral');
                stopBlink = startIdleBlink(guardian);
            }, 800);

            setTimeout(() => { errorEl.classList.remove('visible'); }, 3000);
        }
    }
}
