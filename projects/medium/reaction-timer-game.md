# Reaction Timer Game

## Goal
Build a mini reaction game: wait for a signal, then measure response time and display a score animation.

## Difficulty
Medium

## Estimated Time
60-90 minutes

## What you will build
- A pre-signal waiting phase.
- A "GO" visual signal pattern.
- A score visualization (fast = green, slow = red).

## Concepts to practice
- State machine design (`idle`, `waiting`, `go`, `result`).
- Timing with timestamps/counters.
- Structured game loop.
- Simple UX feedback on LED matrix.

## Suggested steps
1. Define game states and transitions.
2. Add random delay before `go` state.
3. Capture reaction timing input source available in your setup.
4. Show result with color/animation and reset.

## Stretch goals
- Add best-score tracking for current session.
- Add anti-cheat rule (too early = fail animation).
- Add 3 difficulty tiers with shorter windows.

## Success criteria
- State transitions are reliable.
- Result feedback is clear.
- Game can be replayed without restarting code.
