# Lakbay Rizal — working rules for Claude Code

Read `SRS.md` fully before writing code. It is the single source of truth.

## Order of work
New build: follow SRS §11 (M0 → M8). **App already built from v2.2: follow the upgrade milestones U1 → U8 in SRS §11b** (prompts in `prompts/`). Finish a milestone's "Done when" check before starting the next. After each milestone run:
`npm run lint && npm run typecheck && npm test && npm run build`. Fix every failure first.

## Hard rules
- **No invented history.** All historical text, dates, quiz questions and coordinates come from `public/content/*.json` (v2.3: seeded from `content/stops.v3.json` and `content/i18n/`). Never edit story or quiz text in code, and never 'improve' it: content changes go through the content files. Missing content → show `[TO WRITE]` and add a line to `docs/CONTENT_TODO.md`.
- **One art style.** Use only `assets/` and art made with `art-tools/` following SRS §7. No AI-generated images, stock photos, map tiles or other games' assets. Pixel images always use `image-rendering: pixelated`.
- **Static only.** No backend, database, login, analytics or third-party requests at runtime. Progress lives in `localStorage` (`lakbay-rizal:v1`; store version 2 from v2.3, with a migration).
- **Accessible by default.** Real `<button>`/`<a>` elements, visible focus, 4.5:1 text contrast, alt text from content, reduced-motion support.
- **Respectful ending.** No violence shown; no game-over states; the final stop follows SRS GD-6.
- UI copy is short plain English for students (and Filipino from `i18n`). **Reading text (stories, dialogue, questions, longer passages) uses Nunito; the interface (headings, buttons, tabs, labels) uses VT323** — never set long reading text in the pixel font (owner decision, 2026-11-26). SRS §5.3 type scale for both; never fake bold; VT323 never below 18 px.
- Every UI string goes through `t()`; Filipino falls back to English per string. Show the "Draft translation" badge while `fil` files have `status: "draft"`.
- Portraits: `assets/portraits/<id>.png`, 4 × 6 frames of 64 px (SRS §7.10). Integer scale only.
- Motion: `transform`/`opacity` only; every animation has a reduced-motion fallback (SRS §5.6). The final stop has no celebration, guide or sound.
- Saving: never show a refresh warning except while a quiz is in progress (SRS §3.9).
- Record any judgment call in `docs/DECISIONS.md` (one line: date, decision, reason).

## Useful facts
- Scene native size 384 × 216; Europe map 384 × 288; Philippines map 320 × 320; inset 176 × 176; Asia map 384 × 240; America map 384 × 192.
- v2.3 content: 25 stops × 4 chapters (600+ words each), 120 quiz questions of 5 types, 24 portrait sheets, Rizal guide (`guide.json`), gamification (`gamification.json`).
- All 25 stops are `draft`. Build and test with `INCLUDE_DRAFTS=true` (SRS FR-62); production shows only `verified` stops.
- Projection bounds and check coordinates: SRS §8.6.
- Mockup layouts to match: `reference/mockup/*.dc.html` (HTML with inline styles; image paths point into `assets/`).
- Making new art: `art-tools/README.md`.
