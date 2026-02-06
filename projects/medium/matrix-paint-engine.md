# Matrix Paint Engine

## Goal
Create a tiny paint system that supports drawing, erasing, and replaying strokes as animation.

## Difficulty
Medium

## Estimated Time
75-120 minutes

## What you will build
- A canvas data model for 8x8 pixels.
- Draw and erase operations.
- Stroke recording and replay mode.

## Concepts to practice
- 2D array management.
- Command history (`draw`, `erase`, `clear`).
- Replaying actions in sequence.
- Separation of model and renderer.

## Suggested steps
1. Build helper functions: `set_pixel`, `clear_canvas`, `draw_canvas`.
2. Store user actions in a list with timestamps/steps.
3. Implement replay loop that rebuilds frame by frame.
4. Add one-click reset to blank canvas.

## Stretch goals
- Add multiple brush sizes.
- Add palette presets.
- Export/import canvas as compact text format.

## Success criteria
- Canvas updates correctly every frame.
- Replay reproduces original drawing path.
- Commands are easy to extend.
