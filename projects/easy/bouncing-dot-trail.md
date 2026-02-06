# Bouncing Dot Trail

## Goal
Create a single bouncing dot that leaves a fading trail across the matrix.

## Difficulty
Easy

## Estimated Time
45-60 minutes

## What you will build
- A dot with x/y position and x/y velocity.
- Wall collision and bounce behavior.
- A trail buffer with fade-out effect.

## Concepts to practice
- Position updates and velocity.
- Boundary checks.
- Data structures for recent points.
- Frame-by-frame rendering.

## Suggested steps
1. Move one dot and bounce on all edges.
2. Store recent positions in a list.
3. Render older trail points with lower brightness.
4. Refine speed and trail length.

## Stretch goals
- Add color cycling over time.
- Add two dots with different speeds.
- Add collision spark effect on edge hits.

## Success criteria
- Dot movement feels smooth.
- Trail fades naturally.
- No flicker or out-of-bounds errors.
