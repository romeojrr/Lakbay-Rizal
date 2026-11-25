# Lakbay Rizal — working rules for Claude Code

Read `SRS.md` fully before writing code. It is the single source of truth.

## Order of work
Follow the milestones in SRS §11 (M0 → M8). Finish a milestone's "Done when" check before starting the next. After each milestone run:
`npm run lint && npm run typecheck && npm test && npm run build`. Fix every failure first.

## Hard rules
- **No invented history.** All historical text, dates, quiz questions and coordinates come from `public/content/*.json` (seeded from `content/stops.seed.json`). Missing content → show `[TO WRITE]` and add a line to `docs/CONTENT_TODO.md`.
- **One art style.** Use only `assets/` and art made with `art-tools/` following SRS §7. No AI-generated images, stock photos, map tiles or other games' assets. Pixel images always use `image-rendering: pixelated`.
- **Static only.** No backend, database, login, analytics or third-party requests at runtime. Progress lives in `localStorage` (`lakbay-rizal:v1`).
- **Accessible by default.** Real `<button>`/`<a>` elements, visible focus, 4.5:1 text contrast, alt text from content, reduced-motion support.
- **Respectful ending.** No violence shown; no game-over states; the final stop follows SRS GD-6.
- UI copy is short plain English for students; long text uses Nunito, never the pixel font.
- Record any judgment call in `docs/DECISIONS.md` (one line: date, decision, reason).

## Useful facts
- Scene native size 384 × 216; Europe map 384 × 288; Philippines map 320 × 320; inset 176 × 176; Asia map 384 × 240; America map 384 × 192.
- All 25 stops are `draft`. Build and test with `INCLUDE_DRAFTS=true` (SRS FR-62); production shows only `verified` stops.
- Projection bounds and check coordinates: SRS §8.6.
- Mockup layouts to match: `reference/mockup/*.dc.html` (HTML with inline styles; image paths point into `assets/`).
- Making new art: `art-tools/README.md`.
