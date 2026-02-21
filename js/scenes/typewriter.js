// Typewriter Letter Scene
// Cycles through letters, typing them out one by one with pauses.

export default class TypewriterScene {
    constructor(canvas, container) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.container = container;

// Add these properties in your constructor:
this.typingSpeed = 50;          // base speed for English letters (ms)
this.pauseAfterNewline = 700;   // pause for \n
this.pauseAfterParagraph = 1200; // pause for \n\n
this.arabicTypingSpeed = 120;   // per Arabic chunk (ms)

        // Letters pool
        this.letters = [
 // --- Arabic (poetry) ---
            {
                text: `أنسامي،\n\nما يَرجِعُ الطَرفُ عَنها حينَ أُبصِرُها\nحَتّى يَعودَ إِلَيها الطَرفُ مُشتاقا`,
                lang: 'ar'
            },
            {
                text: `أنسامي،\n\nأُديمُ الطَرْفَ ما غَفَلَتْ إِليها\nوَإِنْ نَظرَتْ نَظرتُ إلى سِواها\n\nأَغارُ مِنَ النساءِ يَرَيْنَ مِنها\nمَحاسِنَ لا يُرَيْنَ ولا أَراها\n\nوَإِن غَضِبَتْ عَلَيَّ غَضِبتُ مَعها\nعلى نَفسي، وَيُرضيني رَضاها\n\nوَما غَضَبي على نَفسي بِجُرْمٍ\nوَلكِنّي أَمِيلُ إِلى هَواها`,
                lang: 'ar'
            },
            {
                text: `أنسامي،\n\nقَمَرٌ تَفَرَّدَ بِالمَحاسِنِ كُلِّها\nفَإِلَيهِ يُنسَبُ كُلُّ حُسنٍ يُوصَفُ\n\nفَجَبينُهُ صُبْحٌ وَطُرَّتُهُ دُجًى\nوَقَوامُهُ غُصنٌ رَطيبٌ أَهيَفُ\n\nلِلَّهِ ذاكَ الوَجهُ كَيفَ تَأَلَّفَتْ\nفيهِ بَدائِعُ لَم تَكُنْ تَتَأَلَّفُ\n\nوَرْدٌ يُعَصْفِرُهُ الحَياءُ، وَنَرجِسٌ\nيُغْضي إِذا طالَ العِتابُ وَيُطْرِفُ`,
                lang: 'ar'
            },
            {
                text: `أنسامي،\n\nكَواكِبُ اللَّيلِ قَد لاحَتْ لِناظِرِها\nوَبَدرُ وَجهَكِ عَنّي اليَومَ مَفقُودُ\n\nفَهَل تُراني أَرى مِن بَرقِهِ خَبَرًا\nأَم أَنَّ قَلبي بِالأَوهامِ مَوعُودُ`,
                lang: 'ar'
            },
            {
                text: `أنسامي،\n\nما مَرَّ ذِكرُكِ إِلّا وَابتَسَمتُ لَهُ\nكَأَنَّكِ العيدُ وَالباقونَ أَيّامُ\n\nأَو حامَ طَيفُكِ إِلّا طِرتُ أَتبَعُهُ\nأَنتِ الحَقيقَةُ وَالجُلّاسُ أَوهامُ`,
                lang: 'ar'
            },
            {
                text: `أنسامي،\n\nتَنازَلَ الجَمالُ عَنِ الجَمالِ لِجَمالِكِ\nفَزادَ جَمالُكِ عَلى الجَمالِ جَمالا`,
                lang: 'ar'
            },
            {
                text: `أنسامي،\n\nالبُنُّ في عَينَيكِ يَغلِبُ قَهوَتي\nلا تَحرِميني لَذَّةَ الفِنجانِ\n\nعَرَبِيَّةٌ تِلكَ العُيونُ أَليمَةٌ\nجَمَعَتْ مَذاقَ البُنِّ وَالهَذَيانِ`,
                lang: 'ar'
            },
            {
                text: `أنسامي،\n\nوَأَراكِ في كُلِّ البِقاعِ كَأَنَّما\nلا جُرمَ في فَلَكي يَدورُ سِواكِ\n\nما عُدتُ أُبصِرُ في العَوالِمِ كُلِّها\nقَمَرًا سِواكِ فَجَلَّ مَن سَوّاكِ`,
                lang: 'ar'
            },
            // --- English (phrases + words with meanings) ---
            {
                text: `Ansami,\n\nSonder.\n\nThe realization that every person around you has a life as vivid and complex as your own. But somehow, yours is the only one I want to know every detail of.`,
                lang: 'en'
            },
            {
                text: `Ansami,\n\nEunoia.\n\nA word that means beautiful thinking — a well-mind, a gentle spirit. It's the shortest English word that contains all five vowels.\n\nIt also happens to describe you perfectly.`,
                lang: 'en'
            },
            {
                text: `Ansami,\n\n"You are my golden hour".\n\nThat brief window of light right before the sun sets, when everything looks softer and warmer than it really is. Except with you, that's just how things are.`,
                lang: 'en'
            },

            {
                text: `Ansami,\n\nKomorebi.\n\nA Japanese word for sunlight filtering through leaves. There's no translation — it only exists as a feeling.\n\nThat's what your presence is like. Something there's no word for. Just light, reaching through.`,
                lang: 'en'
            },
           

        ];
        // Message cycling state
        this.currentMessageIndex = 0;
        this.message = this.letters[this.currentMessageIndex];

        // Typing state
        this.charIndex = 0;
        this.lastCharTime = 0;
        this.typingSpeed = 50;            // English letters ms
        this.pauseAfterNewline = 700;
        this.pauseAfterParagraph = 1200;
        this.arabicTypingSpeed = 400;     // per word ms
        this.delayBetweenMessages = 5000; // pause between messages
        this.started = false;
        this.startTime = 0;
        this.startDelay = 3500;

        this.textEl = null;
        this.cursorEl = null;

        // Arabic tokens (words + newlines)
        this.arabicTokens = [];
    }

    init() {
        this.drawBackground();

        const scene = document.createElement('div');
        scene.className = 'typewriter-scene scene-fade-in';

        const paper = document.createElement('div');
        paper.className = 'typewriter-paper';

        this.textEl = document.createElement('div');
        this.textEl.className = 'typewriter-text';

        this.cursorEl = document.createElement('span');
        this.cursorEl.className = 'typewriter-cursor';
        this.textEl.appendChild(this.cursorEl);

        const dateEl = document.createElement('div');
        dateEl.className = 'typewriter-date';

        paper.appendChild(this.textEl);
        paper.appendChild(dateEl);
        scene.appendChild(paper);
        this.container.appendChild(scene);

        this.prepareMessage(this.message);
        this.updateDate();
    }

    prepareMessage(message) {
        // Clear previous text
        this.textEl.innerHTML = '';
        this.textEl.appendChild(this.cursorEl);

        if (message.lang === 'en') {
            this.textEl.classList.add('ltr');
            this.textEl.classList.remove('rtl');
            this.textEl.removeAttribute('dir');
        } else {
            this.textEl.classList.remove('ltr');
            this.textEl.classList.add('rtl');
            this.textEl.setAttribute('dir', 'rtl');
            this.textEl.style.unicodeBidi = 'plaintext';
            // prepend RTL mark
            message.text = '\u200F' + message.text;
            // split Arabic into words and preserve newlines
            this.arabicTokens = message.text.match(/[^\s\n]+|\n/g) || [];
        }

        this.charIndex = 0;
        this.lastCharTime = performance.now();
    }

    update(time) {
        if (!this.started) {
            if (!this.startTime) this.startTime = time;
            if (time - this.startTime > this.startDelay) {
                this.started = true;
                this.lastCharTime = time;
            }
            return;
        }

        if (this.message.lang === 'ar') {
            // Arabic: word-by-word + newline support
            if (this.charIndex < this.arabicTokens.length) {
                if (time - this.lastCharTime > this.arabicTypingSpeed) {
                    const token = this.arabicTokens[this.charIndex];
                    const textNode = document.createTextNode(token === '\n' ? '\n' : token + ' ');
                    this.textEl.insertBefore(textNode, this.cursorEl);
                    this.charIndex++;
                    this.lastCharTime = time;
                }
            } else if (time - this.lastCharTime > this.delayBetweenMessages) {
                this.nextMessage();
            }
        } else {
            // English: letter-by-letter
            if (this.charIndex >= this.message.text.length) {
                if (time - this.lastCharTime > this.delayBetweenMessages) {
                    this.nextMessage();
                }
                return;
            }

            const nextChar = this.message.text[this.charIndex];
            const isParagraphBreak = nextChar === '\n' &&
                this.charIndex + 1 < this.message.text.length &&
                this.message.text[this.charIndex + 1] === '\n';

            let delay = this.typingSpeed;
            if (isParagraphBreak) delay = this.pauseAfterParagraph;
            else if (nextChar === '\n') delay = this.pauseAfterNewline;
            else if ('.?!—'.includes(nextChar) || nextChar === '।' || nextChar === '۔') {
                delay = this.typingSpeed * 3;
            } else if (',،'.includes(nextChar)) {
                delay = this.typingSpeed * 1.5;
            }

            delay += Math.random() * 30;

            if (time - this.lastCharTime > delay) {
                const textNode = document.createTextNode(nextChar);
                this.textEl.insertBefore(textNode, this.cursorEl);
                this.charIndex++;
                this.lastCharTime = time;
            }
        }
    }

    nextMessage() {
        this.currentMessageIndex = (this.currentMessageIndex + 1) % this.letters.length;
        this.message = this.letters[this.currentMessageIndex];
        this.prepareMessage(this.message);
        this.updateDate();
    }

    updateDate() {
        const dateEl = this.container.querySelector('.typewriter-date');
        const now = new Date();
        if (this.message.lang === 'ar') {
            const arMonths = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
                'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
            dateEl.textContent = `${now.getDate()} ${arMonths[now.getMonth()]} ${now.getFullYear()}`;
            dateEl.style.textAlign = 'left';
        } else {
            const months = ['January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'];
            dateEl.textContent = `${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;
            dateEl.style.textAlign = 'left';
        }
    }

    drawBackground() {
        const ctx = this.ctx;
        const w = window.innerWidth;
        const h = window.innerHeight;

        const gradient = ctx.createRadialGradient(
            w * 0.5, h * 0.4, 0,
            w * 0.5, h * 0.5, Math.max(w, h) * 0.9
        );
        gradient.addColorStop(0, '#0d0a08');
        gradient.addColorStop(0.5, '#080604');
        gradient.addColorStop(1, '#030201');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);
    }

    render() {
        // Background is static
    }

    resize() {
        this.drawBackground();
    }
}