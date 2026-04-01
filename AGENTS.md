# AGENTS.md

Important working rules for this project:

- Keep changes and milestones separated into distinct commits.
- After each change or milestone, commit and push before starting the next one.
- Do not bundle unrelated work from different prompts into the same commit.
- If a prompt would require a major architectural deviation, stop and explain before proceeding.

## Project Intent

This project is intentionally a Pretext-driven experiment, not just a generic handwriting app.

The goal is to build a handwriting-to-scrapbook experience where:

- handwritten input can be captured from drawing, uploaded images, and camera photos
- recognized text can become visual scrapbook artifacts
- Pretext is used for programmable text layout where it is visibly necessary

Pretext should not be used for ordinary box text wrapping that CSS could handle just as well.
Its role in this project is to power behavior like:

- background text reflowing around movable obstacles
- line-by-line layout that adapts to changing geometry
- layout behavior that is visibly more expressive than normal DOM flow
