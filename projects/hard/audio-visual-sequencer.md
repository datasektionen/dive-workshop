# Audio-Visual Sequencer (Visual Grid)

## Goal
Build an 8-step visual sequencer that cycles columns and triggers custom light patterns per step.

## Difficulty
Hard

## Estimated Time
2-4 hours

## What you will build
- Step grid model (8 columns, optional multi-row intensity).
- Playhead animation.
- Pattern triggering for active steps.
- Multiple sequence presets.

## Concepts to practice
- Timeline/state progression.
- Bitmask or array representation of patterns.
- Layered rendering (background, steps, playhead).
- Configurable tempo and loop length.

## Suggested steps
1. Model sequence data and draw inactive/active steps.
2. Animate playhead across columns.
3. Trigger per-step visual effect when playhead hits active step.
4. Add preset switching and tempo control.

## Stretch goals
- Add per-step color selection.
- Add randomize and mutate pattern functions.
- Add chained scenes for mini performances.

## Success criteria
- Playhead timing is consistent.
- Active steps are visually distinct.
- Presets switch cleanly while running.
