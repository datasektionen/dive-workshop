# Color Pulse Badge

## Goal
Create an animated 8x8 badge that pulses between two colors and shows a simple icon in the center.

## Difficulty
Easy

## Estimated Time
30-45 minutes

## What you will build
- A repeating pulse effect that fades in and out.
- A central icon (heart, star, or custom shape).
- A small settings section in code for easy color changes.

## Concepts to practice
- Nested loops (`for y in range(8)`, `for x in range(8)`).
- RGB color tuples.
- Reusable helper functions.
- Basic animation timing and frame updates with `render()`.

## Suggested steps
1. Start with a function that fills the full matrix with one color.
2. Add a pulse value that changes brightness over time.
3. Draw a static icon over the background pulse.
4. Tune timing so the animation is smooth and readable.

## Stretch goals
- Add 3 pulse modes (slow, normal, party).
- Switch icon color when pulse reaches max brightness.
- Add a short startup animation.

## Success criteria
- The badge loops smoothly.
- Colors are easy to tweak from one config section.
- Icon stays visible during the pulse.
