# claude.md

## Project Overview

This project is an **interactive, animated birthday website** designed as a poetic gift.

The experience centers on **breath → life → bloom**.

The user’s interaction (blowing into the microphone) causes lilies to bloom one by one.  
The lilies appear to bloom **randomly and organically**, but their final arrangement forms the phrase:

**“Happy Birthday Ansam”**

This phrase must **not be obvious until near the end** of the interaction.

The experience should feel:
- Elegant
- Calm
- Magical
- Subtle
- Emotionally intentional

Avoid anything that feels like a game, demo, or technical showcase.

---

## Core Interaction Rules

### Breath Detection
- Use the Web Audio API.
- Detect **intentional breath bursts**, not continuous background noise.
- Use amplitude thresholds with smoothing.
- One breath = **one bloom**.
- Prevent multiple blooms from a single breath.

### Bloom Behavior
- Lilies begin as **closed buds**.
- Each breath triggers **exactly one lily** to bloom.
- Bloom order must be **randomized**.
- Final lily positions are **predefined** to form the phrase.
- Do not bloom lilies in a letter-by-letter or readable sequence.

---

## Visual Design Principles

### Lily Layout
- Lily buds are scattered naturally.
- No visible grid.
- No obvious typography early on.
- Depth matters (foreground / mid / background).

### Delayed Recognition
The phrase should only become readable when:
- ~80–90% of lilies have bloomed
- The camera subtly pulls back
- Contrast and clarity gently increase

Do **not**:
- Draw letters
- Animate outlines
- Fade text in early
- Highlight word shapes

The words should feel *discovered*, not revealed.

---

## Animation & Motion

- Blooms should feel organic and slightly varied.
- Early blooms:
  - Softer
  - Smaller
  - Lower contrast
  - Often in background layers
- Later blooms:
  - Sharper
  - Slightly larger
  - More foreground presence

Camera movement:
- Minimal
- Slow
- Almost unnoticeable
- Used only to support the final recognition moment

---

## Sound Design (If Implemented)

- Extremely subtle.
- Bloom sound should feel like:
  - Fabric unfolding
  - Air moving
- Silence between interactions is important.
- Avoid obvious UI or “success” sounds.

---

## Text & Copy Guidelines

- Minimal text only.
- Optional opening hint:
  - “Take a breath.”
- No instructions, tooltips, or explanations.
- Final text appears **only after completion**:
  - “Happy Birthday, Ansam 🌸”
  - Optional secondary line:
    - “You brought it to life.”

Avoid poetic overload. Less is more.

---

## Fallback Interaction

If microphone access is unavailable or denied:
- Allow click-and-hold or press-and-hold interaction.
- One hold = one bloom.
- Blooms occur more slowly to maintain calm pacing.

Never block the experience.

---

## Technical Constraints

- Web-based (HTML/CSS/JS or React).
- Use:
  - Web Audio API for mic input
  - SVG, Canvas, or WebGL for rendering lilies
  - GSAP or Framer Motion for animation sequencing
- Code should prioritize:
  - Clarity
  - Readability
  - Timing control

---

## What to Avoid

- Gamification
- Scores, progress bars, or counters
- Over-explaining the concept
- Loud or flashy visuals
- Obvious “look what I built” moments
- Turning the phrase into a puzzle or challenge

If something feels clever instead of emotional, remove it.

---

## Success Criteria

The project is successful if:
- The user does not immediately realize words are forming
- The final recognition moment feels quiet and emotional
- The interaction feels personal, not performative
- The site feels complete with very few elements

**Restraint is a feature.**
