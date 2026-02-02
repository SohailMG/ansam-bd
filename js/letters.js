// Letter point definitions for star positioning
// Each letter is defined on a normalized grid (0-1)
// Connections define which points to draw lines between

const LETTERS = {
    H: {
        points: [
            [0, 0], [0, 0.5], [0, 1],      // 0-2: left vertical
            [1, 0], [1, 0.5], [1, 1],      // 3-5: right vertical
            [0.5, 0.5]                      // 6: center
        ],
        connections: [
            [0, 1], [1, 2],    // left vertical
            [3, 4], [4, 5],    // right vertical
            [1, 6], [6, 4]     // crossbar
        ]
    },
    A: {
        points: [
            [0.5, 0],          // 0: apex
            [0.25, 0.5],       // 1: left mid
            [0.75, 0.5],       // 2: right mid
            [0, 1],            // 3: left foot
            [1, 1],            // 4: right foot
            [0.35, 0.65],      // 5: crossbar left
            [0.65, 0.65]       // 6: crossbar right
        ],
        connections: [
            [0, 1], [1, 3],    // left side
            [0, 2], [2, 4],    // right side
            [5, 6]             // crossbar
        ]
    },
    P: {
        points: [
            [0, 0], [0, 0.5], [0, 1],      // 0-2: vertical
            [0.5, 0], [1, 0.15],           // 3-4: top curve
            [1, 0.35], [0.5, 0.5]          // 5-6: bowl
        ],
        connections: [
            [0, 1], [1, 2],                // vertical
            [0, 3], [3, 4], [4, 5], [5, 6], [6, 1]  // bowl
        ]
    },
    Y: {
        points: [
            [0, 0],            // 0: left top
            [1, 0],            // 1: right top
            [0.5, 0.5],        // 2: center
            [0.5, 1]           // 3: bottom
        ],
        connections: [
            [0, 2], [1, 2],    // arms
            [2, 3]             // stem
        ]
    },
    B: {
        points: [
            [0, 0], [0, 0.5], [0, 1],      // 0-2: vertical
            [0.6, 0], [1, 0.25], [0.6, 0.5], // 3-5: top bump
            [1, 0.75], [0.6, 1]            // 6-7: bottom bump
        ],
        connections: [
            [0, 1], [1, 2],                       // vertical
            [0, 3], [3, 4], [4, 5], [5, 1],       // top bump
            [1, 5], [5, 6], [6, 7], [7, 2]        // bottom bump
        ]
    },
    I: {
        points: [
            [0.5, 0], [0.5, 0.5], [0.5, 1]
        ],
        connections: [
            [0, 1], [1, 2]
        ]
    },
    R: {
        points: [
            [0, 0], [0, 0.5], [0, 1],      // 0-2: vertical
            [0.6, 0], [1, 0.25], [0.6, 0.5], // 3-5: top bump
            [1, 1]                          // 6: leg end
        ],
        connections: [
            [0, 1], [1, 2],                // vertical
            [0, 3], [3, 4], [4, 5], [5, 1], // bump
            [5, 6]                          // diagonal leg
        ]
    },
    T: {
        points: [
            [0, 0], [0.5, 0], [1, 0],      // 0-2: top bar
            [0.5, 0.5], [0.5, 1]           // 3-4: stem
        ],
        connections: [
            [0, 1], [1, 2],    // top bar
            [1, 3], [3, 4]     // stem
        ]
    },
    D: {
        points: [
            [0, 0], [0, 0.5], [0, 1],      // 0-2: vertical
            [0.5, 0], [1, 0.5], [0.5, 1]   // 3-5: curve
        ],
        connections: [
            [0, 1], [1, 2],                // vertical
            [0, 3], [3, 4], [4, 5], [5, 2] // curve
        ]
    },
    N: {
        points: [
            [0, 0], [0, 1],    // 0-1: left vertical
            [1, 0], [1, 1]     // 2-3: right vertical
        ],
        connections: [
            [0, 1],            // left vertical
            [2, 3],            // right vertical
            [0, 3]             // diagonal
        ]
    },
    S: {
        points: [
            [1, 0.1], [0.5, 0], [0, 0.15],  // 0-2: top curve
            [0.2, 0.35], [0.5, 0.5], [0.8, 0.65], // 3-5: middle
            [1, 0.85], [0.5, 1], [0, 0.9]  // 6-8: bottom curve
        ],
        connections: [
            [0, 1], [1, 2], [2, 3],        // top
            [3, 4], [4, 5],                // middle
            [5, 6], [6, 7], [7, 8]         // bottom
        ]
    },
    M: {
        points: [
            [0, 1], [0, 0],    // 0-1: left vertical (bottom to top)
            [0.5, 0.6],        // 2: center dip
            [1, 0], [1, 1]     // 3-4: right vertical (top to bottom)
        ],
        connections: [
            [0, 1],            // left vertical
            [1, 2], [2, 3],    // M peaks
            [3, 4]             // right vertical
        ]
    }
};

// Letter width ratios (relative to height)
const LETTER_WIDTHS = {
    H: 0.7,
    A: 0.75,
    P: 0.6,
    Y: 0.7,
    B: 0.6,
    I: 0.15,
    R: 0.65,
    T: 0.65,
    D: 0.65,
    N: 0.7,
    S: 0.55,
    M: 0.85
};

// Generate positions for a single word, centered at given Y position
// indexOffset ensures letterStartIndex is globally unique across multiple words
export function generateWordPositions(word, canvasWidth, canvasHeight, centerY, scale = 1, indexOffset = 0) {
    const positions = [];

    // Base letter height - make it substantial
    const letterHeight = Math.min(canvasWidth * 0.15, canvasHeight * 0.3) * scale;
    const letterSpacing = letterHeight * 0.4;

    // Calculate total word width
    let totalWidth = 0;
    for (let i = 0; i < word.length; i++) {
        const char = word[i];
        const widthRatio = LETTER_WIDTHS[char] || 0.6;
        totalWidth += letterHeight * widthRatio;
        if (i < word.length - 1) {
            totalWidth += letterSpacing;
        }
    }

    // Start position (centered)
    let currentX = (canvasWidth - totalWidth) / 2;
    let localIndex = 0;

    for (let charIndex = 0; charIndex < word.length; charIndex++) {
        const char = word[charIndex];
        const letterData = LETTERS[char];
        const widthRatio = LETTER_WIDTHS[char] || 0.6;
        const letterWidth = letterHeight * widthRatio;

        if (letterData) {
            const letterStartIndex = indexOffset + localIndex;

            for (let pointIndex = 0; pointIndex < letterData.points.length; pointIndex++) {
                const [lx, ly] = letterData.points[pointIndex];
                positions.push({
                    x: currentX + lx * letterWidth,
                    y: centerY + (ly - 0.5) * letterHeight,
                    char: char,
                    charIndex: charIndex,
                    pointIndex: pointIndex,
                    letterStartIndex: letterStartIndex
                });
                localIndex++;
            }
        }

        currentX += letterWidth + letterSpacing;
    }

    return positions;
}

// Get connection data for drawing lines
export function getLetterConnections(char) {
    const letterData = LETTERS[char];
    return letterData ? letterData.connections : [];
}

// Generate final composition with all three words
export function generateFinalComposition(canvasWidth, canvasHeight) {
    const positions = [];
    const scale = 0.55;

    // Each word gets a unique offset so letterStartIndex is globally unique
    const happyCount = getWordStarCount('HAPPY');
    const birthdayCount = getWordStarCount('BIRTHDAY');

    const happy = generateWordPositions('HAPPY', canvasWidth, canvasHeight, canvasHeight * 0.28, scale, 0);
    positions.push(...happy);

    const birthday = generateWordPositions('BIRTHDAY', canvasWidth, canvasHeight, canvasHeight * 0.5, scale, happyCount);
    positions.push(...birthday);

    const ansam = generateWordPositions('ANSAM', canvasWidth, canvasHeight, canvasHeight * 0.72, scale, happyCount + birthdayCount);
    positions.push(...ansam);

    return positions;
}

// Count total stars needed for each word
export function getWordStarCount(word) {
    let count = 0;
    for (const char of word) {
        const letterData = LETTERS[char];
        if (letterData) count += letterData.points.length;
    }
    return count;
}
