# Lakbay Rizal — Software Requirements Specification

*Lakbay* is Filipino for "journey" or "travel". Working title before 25 Nov 2026: Rizal Atlas.

**Version:** 2.3 · **Date:** 25 November 2026 (v2.3 adds: 600+ word stories in chapters, close-up portraits, college-level quiz types, gamification, Rizal as guide, save safety, Filipino language, VT323 font, layout and motion upgrades; see §11b for the upgrade path) · **Project:** RIZLIFE – Lakbay Rizal
**Prepared for:** Claude Code (build agent) and the RIZLIFE developer
**Status:** Approved for build. Historical content is a **draft that must be fact-checked** (see §13).

---

## 0. Read this first (instructions for Claude Code)

You are building **Lakbay Rizal** (show it as **LAKBAY RIZAL** in the logo), a web game that turns José Rizal's life (1861–1896) into a journey across a pixel-art map. This file is the single source of truth. The folder it sits in is the **starter pack**:

```
lakbay-rizal-starter/
  SRS.md                 ← this document
  CLAUDE.md              ← short working rules (read it too)
  assets/                ← finished pixel art to ship (scenes, sprites, maps, builder, icons)
  art-tools/             ← Python scripts that generated the art; use them to make new scenes
  content/stops.seed.json← v2 content (kept for reference; replaced by stops.v3.json)
  content/stops.v3.json  ← v2.3 content: all 25 stops in 4 chapters, 5 mixed quiz questions each (status: draft)
  content/i18n/          ← en.ui.json, fil.ui.json, fil.stops.json, fil.guide.json, fil.gamification.json (Filipino = draft)
  content/guide.json     ← Rizal's walkthrough, tips and quiz reactions
  content/gamification.json ← XP, ranks, achievements
  assets/portraits/      ← 24 close-up portrait sheets (§7.10)
  prompts/               ← ready prompts for the v2.3 upgrade milestones U1–U8 (§11b)
  UPGRADE.md             ← how to apply v2.3 to an app already built from v2.2
  content/sources.json   ← the bibliography in machine-readable form (60 entries)
  reference/mockup/      ← the approved UI mockup pages (layout reference, not runnable code)
```

**How to work**

1. Build in the milestone order in §11. Finish each milestone's acceptance checks before starting the next. If the app was already built from v2.2, follow the upgrade milestones U1–U8 in §11b instead.
2. After each milestone, run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`. Fix every failure before moving on.
3. **Never invent historical facts.** Use only the text in `content/`. If a screen needs content that does not exist yet, show a clearly marked placeholder (`[TO WRITE]`) and list it in `docs/CONTENT_TODO.md`.
4. **Never mix art styles.** Every new image must follow the art bible in §7. Generate new scenes with `art-tools/` (§7.9). Do not use AI image generators, stock photos, or other games' assets.
5. Keep the UI copy short and in plain English. Write for students aged 15 and up.
6. If a requirement here is unclear, pick the simplest option that satisfies it, and record the decision in `docs/DECISIONS.md`.

**Definition of done (whole project):** every requirement marked **MUST** passes its acceptance check, the end-to-end test in §12 passes, Lighthouse scores on the deployed site are **≥ 90** for Performance and Accessibility (desktop and mobile), and `npm run build` produces a static site with no server code.

---

## 1. Introduction

### 1.1 Purpose
This document describes everything Lakbay Rizal must do and how it must look, so it can be built without further meetings.

### 1.2 The product in one paragraph
Lakbay Rizal is a single-player, browser-based story game. The player follows Rizal stop by stop across the Philippines, Asia, Europe and America. Each stop opens a hand-crafted pixel-art scene of that place in that year, an illustrated story in four chapters with close-up conversations (600–800 words), and a five-question quiz that asks the player to think like a historian. Correct answers earn a passport stamp and a keepsake item. A timeline slider shows his whole life at a glance. Rizal himself guides new players through the game, and the player earns XP, ranks and achievements along the way. One stop, Dapitan, includes a small builder mini-game where the player helps Rizal build the school, clinic and water system he made in exile. No accounts and no database: progress is saved in the browser.

### 1.3 Goals (from the approved proposal)
- See **where** each event happened.
- Read each event as an **illustrated story** (600–800 words in four chapters; a 100–150-word summary stays available).
- Explore **freely** or follow the **guided journey**.
- Use **accurate sources**, cited on every stop.
- Work well on **phones** in class, and on desktop.

### 1.4 Audience
| User | Need |
|---|---|
| Student (Rizal's Life and Works course) | Understand the order of events and why places mattered; review before exams |
| Teacher | A visual aid to project in class, and a way to assign specific stops |
| Curious visitor | An enjoyable way to explore Philippine history |

### 1.5 Definitions
| Term | Meaning |
|---|---|
| **Stop** | One event at one place and time (e.g., *Berlin, 1887 — the Noli is printed*). One place can have several stops. |
| **Region** | A map area: Philippines, Asia, Europe, America. |
| **Scene** | The full-width pixel-art picture shown when a stop opens. |
| **Stamp** | Reward for finishing a stop's quiz; shown in the Passport. |
| **Item** | Keepsake reward (e.g., *Noli Me Tangere*), shown in the Journal. |
| **Theme** | One of five categories: Study, Travel, Writing, Cause (advocacy), Exile. |
| Bahay na bato | Spanish-era Filipino house: stone ground floor, wooden upper floor. |
| Capiz | Translucent shell used as window panes. |
| Nipa | Palm leaves used for thatched roofs. |
| Baro't saya / tapis / pañuelo | 19th-century Filipina dress: blouse, long skirt, wrap-around overskirt, shoulder scarf. |
| Banca | Outrigger canoe. |

---

## 2. Overall description

### 2.1 Product type and constraints
- **MUST** be a static web app (HTML/CSS/JS only after build). No backend, no database, no login.
- **MUST** save progress in `localStorage`, with a "Reset progress" option.
- **SHOULD** work offline after the first visit (simple service worker; see NFR-7). Not required before M8.
- **MUST** run on free static hosting (Netlify, Vercel or GitHub Pages).
- All art **MUST** be original (from `assets/` or made with `art-tools/`) or verified public domain, credited in the Credits screen.

### 2.2 Operating environment
- Desktop: latest Chrome, Edge, Firefox, Safari. Main layout is designed at 1440 px wide.
- Mobile: iOS Safari 16+ and Android Chrome. Must work at 360 px wide.
- Input: mouse, touch and keyboard.

### 2.3 Assumptions
- Content is written and fact-checked by the RIZLIFE team. The build uses whatever is in `content/`.
- One developer maintains the code after launch, so prefer simple, well-named code over clever code.

---

## 3. Game design

### 3.1 Core loop
```
World / Region map → pick a stop (pin) → Story in 4 chapters (scene, camera, close-ups) → Quiz (5 questions, mixed types)
   → Rewards (gold/silver stamp, item, builder materials, XP) → travel animation → next stop unlocks → back to map
```

### 3.2 Progression rules
- **GD-1** Stops have an `order` (1–25, chronological). In **Guided journey** mode only the next unfinished stop is open; later stops show as locked "?" pins.
- **GD-2** In **Free explore** mode every stop is open. A toggle on the map switches modes. Default: Guided.
- **GD-3** A stop counts as **visited** when its last chapter is reached, and **completed** when every quiz question has been answered correctly (unlimited retries; gold stamp for ≥ 4 of 5 right on the first try, silver otherwise, §3.8).
- **GD-4** Completing a stop gives its stamp, its item (if any) and its materials (if any). Rewards are given once.
- **GD-5** Wrong answers show a hint. Never show a "fail" or "game over" screen anywhere.
- **GD-6** The final stop (Bagumbayan, 30 Dec 1896) is handled with respect: **no quiz**, no celebration effects, a quiet closing scene. Finishing its dialogue completes the stop and adds a plain final page to the passport (no "New!" tag, no reward animation), then an "Epilogue" card links to the full timeline and the credits.

### 3.3 Regions and the map
| Region | Stops (by `order`) | Map art |
|---|---|---|
| Philippines | 1–4, 13, 22–25 | `assets/maps/philippines.png` + inset `manila_laguna_inset.png` |
| Asia | 14, 21 | `assets/maps/asia.png` (384 × 240; lat 18–40, lon 110–145): Tokyo, Hong Kong |
| Europe | 5–12, 16–20 | `assets/maps/europe.png` |
| America | 15 | `assets/maps/america.png` (384 × 192; lat 30–46, lon −126 to −70): San Francisco → New York; draw `regions.america.route` as the dotted rail line |

Pins whose positions would overlap at the region's zoom are grouped into a **cluster pin** showing a count. Clicking it opens a close-up **inset map** (the Philippines map does this for Calamba / Biñan / Manila).

### 3.4 Timeline
A slider from 1861 to 1896 sits under the map. Moving it:
- moves the "current year" marker,
- dims pins for years after the selected year,
- draws Rizal's travel path up to that year,
- switches the region automatically if the year's stops are in another region (with a short slide animation; off when reduced motion is on).

Era labels on the track: 1861 Childhood · 1872 School · 1882 Europe · 1892 Exile · 1896.

### 3.5 Dapitan builder (mini-game)
Stop 23 (Dapitan) includes a top-down builder after the dialogue:
- Three projects: **School** (pre-built when the stop opens), **Clinic**, **Water system**.
- Resources: Bamboo, Stone, Tools. The player earns them from completing earlier stops (see `materials` in content). Starting amounts and costs are in `content/builder.json`. Costs in the mockup: Clinic = 6 Bamboo + 4 Stone, Water system = 6 Stone + 3 Tools, start = 8 / 10 / 3.
- Building a project places its sprite on the scene and shows a one-sentence fact from content.
- Finishing all three gives the Dapitan stamp. A "Restart builder" button resets only the builder.
- The clinic sprite (`assets/builder/clinic.png`, 60 × 52) is the octagonal *Casa Redonda* on stilts (bamboo, wood and nipa), matching the Dapitan scene. It has a small painted board with an eye on it, not a modern medical cross. It is 4 px taller than the old placeholder: anchor it by its bottom edge.

### 3.6 Story player (chapters, close-ups and dialogue) — v2.3
Each stop is a short illustrated story in **4 chapters** (600–800 words of narration in total). The player reads it one step at a time:

```
Chapter title card → narration paragraphs (one per step) → dialogue lines (one per step, with close-up)
→ "Did you know?" fact (if any) → next chapter … → "Take the quiz"
```
- **Camera.** Each chapter has `camera: {x, y, zoom}` (percent of the scene, zoom 1–1.6). When a chapter starts, the scene pans and zooms smoothly to that point over 1.2 s (CSS `transform`, ease-in-out). `zoom: 1` = the full scene. With reduced motion: no pan, just a 200 ms cross-fade.
- **Narration box.** A parchment panel over the lower part of the scene (desktop) or below it (≤ 640 px). Text appears with a typewriter effect (about 40 characters per second); pressing Next, Space, Enter or tapping once shows the whole paragraph, a second press goes on.
- **Close-up dialogue.** For a line, the speaker's **portrait** (§7.10) slides in from the side (180 ms): 128 × 128 (2×) on desktop and tablets, 64 × 64 or 128 × 128 on phones depending on the space (integer scale only). The portrait plays its **talk frames** (columns 2 and 3, alternating at 8 fps) while the text types, then rests on the idle frame and **blinks** (column 1 for 120 ms) every 3–6 s at random. The portrait row is the line's `mood`.
- **Speaker indicator.** If `onScene` is true, a small "…" bubble bobs above the speaker's anchor in the scene. Off-scene speakers (letters, memories, Paciano) show only the portrait.
- **Line tags.** A line with `recorded` shows a small green **Recorded** tag (tooltip: "Real words, from a published source." + the source's short title). Every other line shows a grey **Dramatized** tag (tooltip: "Based on real events. The exact words are imagined."). The narrator never has a tag.
- **Did you know?** A small card with a lightbulb icon, the fact text and the source's short title.
- **Controls.** Next / Back, a chapter progress bar ("Chapter 2 of 4"), **Auto-play** (advances 1.5 s after each step finishes), **Skip to the end** (jumps to the last step; the stop still counts as visited), keyboard: → / Space / Enter = next, ← = back, A = auto-play.
- **Read more** now opens the stop's 100–150-word summary (`story`), the place then/today, the date, and the full source list.
- The final stop (GD-6) uses the same player but: no portraits slide in (the narrator speaks), slower typewriter (25 cps), no auto-play, no "Take the quiz" button; the last step shows the Epilogue card.

### 3.7 Rizal as guide (walkthrough) — v2.3
Replaces the 3-card intro (FR-4). The guide is **Rizal himself**, speaking in first person from a close-up portrait. It is a framing device: the guide's words are written by the team and never shown as "Recorded".
- **Tour** (`content/guide.json → tour`, 14 steps): runs on first visit and from Settings → "Replay the tour". Each step dims the page, cuts a rounded "spotlight" around the element whose `data-guide` attribute equals the step's `target` (null = a centred card), and shows Rizal's portrait (mood from the step) with a speech panel and **Next / Skip tour** buttons. `next: "click-target"` waits for the player to click the highlighted element. The tour moves between routes as the steps say (`route`).
- Required `data-guide` ids: `map`, `region-tabs`, `timeline`, `mode-toggle`, `pin-current`, `scene`, `line-tag`, `sources-card`, `quiz-button`, `xp-bar`, `passport-button`, `save-indicator`.
- **Tips** (`tips`): one-time hints the first time a screen opens (quiz, passport, journal, builder, gallery, settings), on rank-up, and when private mode is detected (§3.9). Shown as a small portrait + bubble in a corner; auto-hide after 8 s or on click.
- **Reactions** (`reactions`): after each quiz answer Rizal's portrait (small, by the question card) shows a random line from `correct` / `wrong`, `streak` at 5 and 10, `perfect` after a perfect stop. Never more than one bubble at a time.
- The guide never appears on the final stop.
- Everything the guide says comes from `guide.json` (and `i18n/fil.guide.json`), not from code.

### 3.8 Gamification — v2.3
All numbers live in `content/gamification.json`.
- **XP.** Correct on first try 20, second try 10, later 5; −5 if a hint was opened (never below 0 for a question); +5 per chapter read; +5 for opening Read more; +25 every 5-answer streak; +30 for a perfect stop; +40 per builder project.
- **Streak.** Consecutive first-try correct answers across stops. Shown as a flame meter by the XP bar; a wrong answer resets it (no other penalty).
- **Stamps.** Gold if at least 4 of 5 questions were right on the first try, silver otherwise. A stop can be retried from its page to upgrade silver to gold. Still no fail screen (GD-5).
- **Ranks** (by total XP): Estudyante 0 → Bachiller 400 → Manlalakbay 1000 → Manunulat 1800 → Ilustrado 2800. The rank shows beside the XP bar and on the passport; rank-up triggers a banner and Rizal's `rank-up` tip.
- **Achievements**: 14 badges in `gamification.json` (rules are listed there). Shown in a new **Achievements** tab of the Passport, each with the item icon named in the file. Unlocking shows a toast. The `journey-end` badge is quiet: no toast, no sound (GD-6).
- **Certificate**: when all 24 quiz stops are completed, the Passport shows **Print certificate**: a print-ready page (A4 / Letter, print CSS) with the player's typed name (stored locally only), rank, stamp count (gold/silver), date and the game logo. Uses the browser's print dialog (Save as PDF works).

### 3.9 Saving and refresh safety — v2.3
Answer to "Can we warn players before they lose progress on refresh?": a normal refresh does **not** lose progress, because the game saves to `localStorage` after every change. Progress is lost only when browser data is cleared, in a private window, or on another device. So:
1. **Save indicator.** After every save, a small disk icon + "Saved" fades in at the top bar for 1.2 s (`data-guide="save-indicator"`). If a save fails (quota or blocked storage), it turns into a red "Not saved" button that opens a dialog explaining why and offering the save code.
2. **Warn only when something is really unsaved.** Register `beforeunload` **only** while a quiz is in progress (an answer is checked but the stop is not finished) or the player is typing their certificate name. The browser shows its own "Leave site?" box; browsers do not allow custom text. Never warn on ordinary pages.
3. **Persist.** Call `navigator.storage.persist()` once after the first completed stop (if supported) so the browser does not clear the save automatically.
4. **Private mode.** At start-up, test-write a key; if it fails, or `navigator.storage.estimate()` reports a tiny quota, show a banner: "You're in a private window, so your progress will be erased when you close it. Download a save code to keep it." plus Rizal's `private-mode` tip.
5. **Save code.** Settings → **Download save code** gives (a) a short text code (base64url of the progress JSON + a 4-character checksum + version, copyable) and (b) a `.lakbay` file download. **Load save code** accepts either. Invalid or newer-version codes show a friendly error and change nothing. Achievement `safe-traveller` unlocks on first download.
6. **Reminder.** After every 5 completed stops, or 7 days after the last download, a gentle toast suggests downloading a save code. Can be turned off in Settings.

### 3.10 Language (English / Filipino) — v2.3
- A language switch (EN | FIL) sits in the top bar and Settings. Default: the browser language if it starts with `fil` or `tl`, otherwise English. Saved in progress settings.
- UI strings: `src/i18n/en.json` and `fil.json` (seeded from `content/i18n/en.ui.json` and `fil.ui.json`; keep any keys the app already has).
- Content: `content/i18n/fil.stops.json` mirrors `stops.v3.json` (same order and counts), `fil.guide.json`, `fil.gamification.json`. If a Filipino string is missing, fall back to English for that string only.
- Every Filipino content file has `"status": "draft"`. While it is draft, show a small "Draft translation" badge next to the language switch, with a tooltip: "Written by AI, being checked by the RIZLIFE team." Remove the badge when the team sets `"status": "reviewed"`.
- Reading any stop in both languages unlocks the `bilingual` achievement.

### 3.11 Sound — v2.3
- **Sound effects** are generated in code with the Web Audio API (short square/triangle-wave blips: page turn, typewriter tick every 3rd character, correct chime, wrong buzz, stamp thud, achievement jingle, build thump). No audio files needed, so no licensing risk.
- **Music** is optional: if the team adds CC0 chiptune loops to `public/audio/music/<region>.ogg` (for example from Kenney or OpenGameArt, CC0 only, credited), each region plays its loop at low volume. If the files are missing, there is no music and no error.
- Settings: Sound on/off (default on), Music on/off (default off), volume. Nothing plays before the player's first click (browser autoplay rules). The final stop plays no sound effects or music.

---

## 4. Functional requirements

Priority: **MUST** = required for launch · **SHOULD** = expected, may slip one milestone · **COULD** = nice to have.
Each requirement has an acceptance check (AC) that must be testable.

### 4.1 App shell and navigation
| ID | Requirement | Priority | Acceptance check |
|---|---|---|---|
| FR-1 | A top bar shows: logo (Rizal sprite + "LAKBAY RIZAL"), region tabs (Philippines, Asia, Europe, America), **Scenes** link, **Passport · n/25** button. | MUST | All items visible at 1440 px; at 360 px the tabs wrap or scroll horizontally, no overflow. |
| FR-2 | Routes: `/` (map, last region), `/region/:id`, `/stop/:id`, `/stop/:id/quiz`, `/passport`, `/journal`, `/scenes`, `/dapitan/build`, `/credits`, `/settings`. | MUST | Each URL loads directly and survives a page refresh on the hosting provider (configure SPA fallback). |
| FR-3 | Back links on every inner page return to the place the player came from. | MUST | Navigate map → stop → quiz → back → back lands on the map with the same region. |
| FR-4 | First visit runs Rizal's guided tour (§3.7), replacing the old 3-card intro. Skippable; replayable from Settings. | MUST | Tour appears once on a fresh profile. |

### 4.2 Maps and pins
| ID | Requirement | Priority | Acceptance check |
|---|---|---|---|
| FR-10 | Each region shows its pixel map image, scaled with `image-rendering: pixelated`, inside a wooden frame (see mockup `Main.dc.html`). | MUST | Map pixels stay sharp (no blur) at every window size. |
| FR-11 | Pins are positioned from latitude/longitude using the region's projection bounds (§8.6), as percentages, so they stay correct at any size. | MUST | Unit test: Berlin (52.52, 13.40) maps to ≈ (63.8 %, 20.8 %) on Europe within ±0.5 %. |
| FR-12 | Pin states: **done** (theme color), **current** (bigger, dark label, Rizal sprite beside it), **locked** ("?" label, grey). | MUST | Visual test with a seeded progress state. |
| FR-13 | Pins are real links/buttons with an accessible name ("Berlin, current stop"). | MUST | Keyboard Tab reaches every pin; Enter opens it. |
| FR-14 | Travel path: solid orange line through completed stops, faint dashed line to future stops in the region. | MUST | Path updates when a stop is completed. |
| FR-15 | Cluster pins + inset map (§3.3). | MUST | Philippines map shows one "3" pin for Calamba/Biñan/Manila; the inset lists them. |
| FR-16 | Map overlay: region name + year range (top-left), theme legend (bottom-left), zoom +/– (bottom-right). Zoom: 1×, 1.5×, 2× with drag-to-pan when zoomed. | SHOULD | Zoom keeps pins aligned with towns. |
| FR-17 | Side panel (desktop) / panel below map (mobile): **Next stop** card with scene thumbnail, theme chip, one-line teaser, **Enter ▶** button; and a **Journey** list of the region's stops with status. | MUST | Card matches mockup; list highlights the current stop. |
| FR-18 | Guided / Free toggle (§3.2). | MUST | In Guided mode, locked pins cannot be opened (show "Finish the previous stop first"). |

### 4.3 Timeline
| ID | Requirement | Priority | Acceptance check |
|---|---|---|---|
| FR-20 | Slider 1861–1896 with era labels; keyboard: arrows ±1 year, PageUp/PageDown ±5. | MUST | `role="slider"` with correct `aria-valuenow`. |
| FR-21 | Behaviour per §3.4. | MUST | Set 1892 → Philippines region shows, Dapitan pin highlighted, later pins dimmed. |

### 4.4 Stop page (scene + dialogue)
| ID | Requirement | Priority | Acceptance check |
|---|---|---|---|
| FR-30 | Large scene image (16:9, pixelated) in a wooden frame, with place · year badge top-left. | MUST | Matches `Story.dc.html` layout. |
| FR-31 | Dialogue box overlaps the bottom of the scene (desktop) / sits below it (mobile), per §3.6. | MUST | Next steps through lines; last line shows **Replay** and unlocks Quiz. |
| FR-32 | Side panel: **This stop** (Then / Today place names, theme chip), **Item reward** card, **Source** card (full citation, page numbers), **Read more** button. | MUST | Source text comes from content; if missing, shows `[Source needed]` in red-brown and the stop is excluded from the production build (see FR-62). |
| FR-33 | **Read more** opens a panel with the 100–150-word summary (`story`), place then/today, date and the full source list (§3.6). | MUST | Panel is a dialog with focus trap and Esc to close. |
| FR-34 | The scene shows the speaking character indicator ("…") at the coordinates given in content. | SHOULD | Indicator moves when the speaker changes. |
| FR-35 | "Dramatized" tag per §3.6. | MUST | Shown on stops whose dialogue has `dramatized: true`. |

### 4.5 Quiz
| ID | Requirement | Priority | Acceptance check |
|---|---|---|---|
| FR-40 | Five questions per stop of mixed types (§6.2b, FR-81), shown one at a time with a progress bar. | MUST | Content drives the count; works with 1–6 questions. |
| FR-41 | Picking an answer marks it right (green + ✓) or wrong (light red + ✗) and reveals the right one; colors differ in lightness, not only hue. | MUST | Contrast check passes; icons present. |
| FR-42 | Wrong answer shows the question's hint and lets the player try again. | MUST | No penalty, no lives. |
| FR-43 | After all questions are right: reward card (stamp + item + materials) with **Open passport** and **Back to map** buttons. | MUST | Progress store updated exactly once. |
| FR-44 | Question order and option order are shuffled per attempt; the correct option is tracked by id, not position. | SHOULD | Unit test. |

### 4.6 Passport and journal
| ID | Requirement | Priority | Acceptance check |
|---|---|---|---|
| FR-50 | Passport looks like an open leather passport: left page = traveller (Rizal portrait sprite, name, born 1861 · Calamba, stamps n of 25, progress bar, theme badges); right page = stamp grid. | MUST | Matches `Passport.dc.html`. |
| FR-51 | Earned stamps show the stop's landmark icon, place name, year, tilted slightly; locked ones show "?" and the year. Newest stamp has a **New!** tag until the passport is opened. | MUST | — |
| FR-52 | Theme badges show progress per theme (e.g., Study 6/8); a badge lights up when complete. | MUST | Counts come from content, not hard-coded. |
| FR-53 | Journal lists collected items with their pixel icon (`items[].icon`) and a one-line description. If an icon file is missing, show the stop's stamp icon instead. | SHOULD | — |

### 4.7 Scene gallery
| ID | Requirement | Priority | Acceptance check |
|---|---|---|---|
| FR-55 | `/scenes` shows every scene the player has unlocked (all scenes in Free mode), with place, year, time of day, three "what you see" notes and a "To verify" note (team-only; hide in production unless `showVerifyNotes` is on in settings). | SHOULD | Matches `Scenes.dc.html`. |

### 4.8 Content loading and validation
| ID | Requirement | Priority | Acceptance check |
|---|---|---|---|
| FR-60 | All game text, quiz data, coordinates and asset paths load from JSON in `public/content/`. No historical text in components. | MUST | `grep` for sample sentences finds them only in content files. |
| FR-61 | Content is validated at build time and in tests with Zod schemas (§6). Invalid content fails the build with a readable message. | MUST | Break a field → `npm run build` fails naming the stop and field. |
| FR-62 | A stop with `status` other than `"verified"` is shown in development and in a `?preview=1` mode only. Production shows only verified stops. A build flag `INCLUDE_DRAFTS=true` overrides this for classroom testing. | MUST | Production build with all-draft content shows a friendly "Content coming soon" map state. |

### 4.9 Settings, saving, credits
| ID | Requirement | Priority | Acceptance check |
|---|---|---|---|
| FR-70 | Progress saved automatically to `localStorage` key `lakbay-rizal:v1` (schema §8.5), with versioned migrations. | MUST | Refresh keeps progress; corrupt data resets safely with a notice. |
| FR-71 | Settings: text size (Normal / Large), reduce motion (follows OS by default), Guided/Free, show verify notes (team), **Reset progress** (with confirm dialog). | MUST | — |
| FR-72 | Credits page: team members, sources list (all citations from content), art credits ("Original pixel art by the RIZLIFE team"), fonts (VT323 by Peter Hull — SIL OFL), map data note (land mask from the `global-land-mask` package, which is derived from GLOBE 1-km data). | MUST | — |
| FR-73 | Language: all UI strings in `src/i18n/en.json` so a Filipino version can be added later. | SHOULD | No hard-coded UI strings in components (lint rule or test). |

---

### 4.10 New requirements in v2.3
| ID | Requirement | Priority | Acceptance check |
|---|---|---|---|
| FR-80 | Story player per §3.6: chapters, camera pan/zoom, narration typewriter, close-up portraits with talk and blink frames, Recorded/Dramatized tags, facts, auto-play, skip, keyboard. | MUST | Calamba plays 4 chapters; the camera moves to Teodora in chapter 3; her portrait talks while text types; the moth line shows "Recorded". |
| FR-81 | Quiz types per §6.2b: `mcq`, `multi`, `order` (drag or tap-to-swap, keyboard: select + arrow keys), `match` (tap left then right; keyboard: Enter on each), `error` (tap the wrong segment, then the correction is shown). Each shows `explain` and the source's short title after a correct answer. | MUST | All 5 types appear and work by mouse, touch and keyboard (Playwright). |
| FR-82 | Shuffle options, items and right-hand match column per attempt; answers are checked by id. `order` never starts already in the right order. | MUST | Unit tests. |
| FR-83 | XP, streak, gold/silver stamps, ranks, achievements, toasts per §3.8; all numbers from `gamification.json`. | MUST | Seeded progress test reaches Bachiller at 400 XP. |
| FR-84 | Rizal guide tour, tips and reactions per §3.7. | MUST | Fresh profile runs the tour; Skip ends it; Settings can replay it. |
| FR-85 | Save safety per §3.9 (indicator, warn-only-when-dirty, persist, private-mode banner, save code export/import, reminders). | MUST | Refresh on map: no warning. Refresh mid-quiz: browser warning. Export → reset → import restores progress exactly. |
| FR-86 | Language switch and Filipino content per §3.10, with per-string fallback and the draft badge. | MUST | Switching language changes UI and story text without a reload; missing strings fall back to English. |
| FR-87 | Certificate per §3.8. | SHOULD | Print preview fits one page. |
| FR-88 | `/timeline` page: all 25 stops in date order as a vertical list (thumbnail, date, place then/today, status, stamp), filterable by theme and region. | SHOULD | Keyboard and screen-reader friendly. |
| FR-89 | Motion catalogue per §5.6, all respecting reduced motion. | MUST | With reduced motion on, no element moves more than a fade. |
| FR-90 | Sound per §3.11. | SHOULD | Muted until first click; toggles persist. |
| FR-91 | Layout v2.3 per §5.5 (slim header, bottom navigation on phones, full-bleed scenes, collapsible side panels). | MUST | No horizontal scroll from 360 to 1920 px; scene uses ≥ 70 % of the viewport width at 1440 px. |

---

## 5. User interface specification

The approved look is the mockup in `reference/mockup/` (open the `.dc.html` files in a text editor; they are layout references written in HTML with inline styles). Reproduce their layout, sizes and colors in React components.

### 5.1 Screens
| Screen | Mockup file | Notes |
|---|---|---|
| Region map (Europe) | `Main.dc.html` | Map left (flex 999 1 560px), side panel right (flex 1 1 340px), timeline full width below. |
| Region map (Philippines) | `Philippines.dc.html` | Square map (max 780 px), inset card + current-stop card on the right. |
| Stop (scene + dialogue) | `Story.dc.html` | Scene + dialogue left, info cards right. |
| Quiz | `Quiz.dc.html` | Centered column, max 1000 px; scene as dimmed background behind the question. |
| Passport | `Passport.dc.html` | Book spread; pages stack on mobile. |
| Dapitan builder | `Dapitan.dc.html` | Scene left with building overlays; materials + projects right. |
| Scene gallery | `Scenes.dc.html` | Big scene left, scene list right. |

### 5.2 Responsive rules
- One layout that reflows. No separate mobile app. Breakpoints are content-driven via `flex-wrap` and `flex-basis` exactly as in the mockup.
- At ≤ 640 px: side panels go below the main area; dialogue box sits under the scene (not overlapping); header tabs scroll horizontally.
- Touch targets ≥ 44 × 44 px.
- Pixel images use integer scaling where possible (`max-width` multiples of the native width: e.g., scene native 384 px → 768, 1152). When the container is not an integer multiple, still use `image-rendering: pixelated`.

### 5.3 Design tokens
| Token | Value | Use |
|---|---|---|
| `--ink` | `#1F1A24` | Text, borders, hard shadows |
| `--paper` | `#F4EEDF` | Page background |
| `--card` | `#FFFFFF` / `--card-warm` `#F6F0E1` | Panels |
| `--wood` | `#6B4A2B` (light edge `#8A6440`) | Map / scene frames, header underline |
| `--accent` | `#E8892B` | Primary buttons, path, progress |
| `--gold` | `#D9A441` | Passport button, dialogue inner border |
| `--muted` | `#4E4658` | Secondary text (passes 4.5:1 on white) |
| Theme · Study | `#3D7BE0` | |
| Theme · Travel | `#E8892B` | |
| Theme · Writing | `#8B5CD6` | |
| Theme · Cause | `#D9513F` | |
| Theme · Exile | `#2A9D8F` (chip bg `#1F7A6F` with white text) | |
| Success | `#23703A` · Wrong `#F6C3BD` | Quiz feedback |
| Border | `3px solid var(--ink)` | All panels and buttons |
| Shadow | `6px 6px 0 var(--ink)` (panels), `4px 4px 0` (buttons) | Hard pixel shadow, never blurred |
| Radius | `0` | Everything is square |
| Font · all text | **VT323** (one weight; self-host `@fontsource/vt323`) | Everything: titles, buttons, story, dialogue. VT323 has no bold: show hierarchy with size and colour, never fake bold |
| Type scale (Normal / Large) | Body 22 / 26 px (phones 20 / 24), line-height 1.3; small 18 / 22; h3 28; h2 36; h1 48 (phones 36); letter-spacing 0.01em | Large = Settings → Text size. Never below 18 px |

v2.3: the team chose **VT323 for all text** for readability with a pixel look. Keep paragraphs ≤ 68 characters wide and line-height ≥ 1.3 so long stories stay comfortable to read.

### 5.4 Components
`PixelButton` (primary / secondary / disabled), `Panel`, `WoodFrame`, `Chip` (theme), `RegionTabs`, `MapView` (image + pins + path + overlays), `Pin`, `ClusterPin`, `InsetMap`, `TimelineSlider`, `StopCard`, `JourneyList`, `SceneView`, `DialogueBox`, `Portrait`, `SourceCard`, `ReadMoreDialog`, `QuizQuestion`, `RewardCard`, `PassportBook`, `StampCard`, `ThemeBadge`, `BuilderScene`, `ResourceTile`, `ProjectCard`, `Toast`, `ConfirmDialog`.

Portrait crop: show the sprite at 3× inside a 72 × 72 box, offset so the head and shoulders fill it (mockup uses `left:-12px; top:-18px; width:102px; height:234px` for a 34 × 78 sprite).

---

### 5.5 Layout v2.3 — use the space
The v2.2 mockups stay the visual reference for colours, borders and components; v2.3 changes how space is used:
- **App shell:** a slim top bar (56 px desktop, 48 px phone): logo, region tabs (desktop), XP bar + rank, save indicator, language switch, Passport button. On phones (≤ 640 px) the region tabs move into the map screen and a **bottom navigation bar** (Map · Timeline · Passport · Journal · More) replaces top links; it respects `env(safe-area-inset-bottom)`.
- **Map screen:** CSS grid `map | panel`. The map takes all remaining width; the side panel (Next stop + Journey list) is 340 px and **collapsible** to a 48 px rail (remember the choice). The timeline is a slim strip under the map (64 px), expandable. On phones the panel becomes a bottom sheet (drag handle, three heights).
- **Stop screen:** the scene is **full-bleed** within the content area (max 1600 px wide), scaled to the largest integer multiple that fits (fallback: `pixelated` non-integer). The narration/dialogue box overlays the bottom 30 % of the scene on desktop. This stop / Item / Sources cards move into a right drawer (desktop, toggle "Info") or a tab under the scene (phone). Landscape phones show the scene full-screen with the text box overlaid.
- **Quiz screen:** centred card (max 760 px) over the dimmed scene; Rizal's small portrait for reactions sits at the card's top-left corner; XP gain floats up from the card.
- **Passport:** two-page spread on desktop with tabs: Stamps · Achievements · Rank; single page with tabs on phones.
- Use CSS grid and container queries (not fixed breakpoints only). Keep touch targets ≥ 44 px. Use skeleton placeholders (pixel-pattern shimmer, static with reduced motion) while JSON and images load.

### 5.6 Motion catalogue — v2.3
All motion uses `transform` / `opacity` only, ≤ 400 ms unless stated, and switches to a 150–200 ms fade when reduced motion is on.
| Where | Motion |
|---|---|
| Route change | Pixel "iris" wipe (a stepped circle mask, 8 steps, 320 ms) |
| Map | Pins drop in on first view (staggered 30 ms); current pin pulses (scale 1→1.08, 1.6 s loop); hover lifts 2 px; region change pans the map; **travel animation** after a stop is completed: a small ship (sea legs) or train (land legs) sprite moves along the path to the next pin (1.5 s), then the pin unlocks with a "pop" |
| Timeline | Year label rolls like an odometer while scrubbing |
| Story player | Camera pan/zoom (§3.6), portrait slide-in, talk/blink frames via CSS `steps()` on the sprite sheet, "…" bubble bob, typewriter text, chapter title card fades in with a 1 px underline draw |
| Ambient scene effects (CSS/canvas overlay, ≤ 40 particles) | Rain: binan-1869 · Petals: japan-1888 · Snow: brussels-1890 · Falling leaves: madrid-1882 · Dust motes in light: london-1888, ghent-1891 · Candle flicker (brightness 0.95–1.0): fortsantiago-1896 · Water glints: dapitan-1892 · none: bagumbayan-1896 |
| Quiz | Card flips in; correct: green flash + 12 pixel sparkles; wrong: 2-px shake + red outline; streak flame grows; XP number counts up |
| Rewards | Stamp "slam" onto the passport page (scale 1.4 → 1, ink splat, 1 small shake); achievement toast slides in from the top-right; rank-up banner unrolls |
| Builder | Building rises from the ground with a dust puff; materials count down |
| Final stop | No sparkles, no confetti, no slam; only slow fades |

---

## 6. Content specification

### 6.1 Files
```
public/content/
  stops.json        ← all stops (v2.3: from content/stops.v3.json)
  guide.json, gamification.json
  i18n/fil.stops.json, i18n/fil.guide.json, i18n/fil.gamification.json
  regions.json      ← map bounds, image paths, inset definitions
  characters.json   ← speakers: name, sprite, portrait crop
  items.json        ← keepsake items
  builder.json      ← Dapitan builder costs, start materials, facts
  sources.json      ← bibliography entries referenced by id
```

### 6.2 Stop schema (TypeScript; mirror it in Zod)
```ts
type Theme = 'study' | 'travel' | 'writing' | 'cause' | 'exile';
type Status = 'outline' | 'draft' | 'verified';

interface Stop {
  id: string;                 // 'berlin-1887'
  order: number;              // 1..25, chronological
  region: 'philippines' | 'asia' | 'europe' | 'america';
  dateLabel: string;          // 'Nov 1886 – May 1887'
  year: number;               // year used by the timeline (start year)
  place: { then: string; today: string; lat: number; lon: number };
  theme: Theme;
  title: string;              // 'The Noli is printed' (≤ 32 chars)
  teaser: string;             // one line for the map card (≤ 60 chars)
  story: string;              // 100–150 words, plain English
  readMore?: string;          // optional longer text
  scene: { image: string; time: string; alt: string; speakerAnchors?: Record<string, { x: number; y: number }> }; // anchors in % of the scene
  dialogue: { dramatized: boolean; lines: { speaker: string; text: string }[] };
  builder?: boolean;          // true only for Dapitan: open the builder after the dialogue
  quiz: { id: string; prompt: string; options: { id: string; text: string }[]; answer: string; hint: string }[];
  rewards: { stamp: { icon: string }; item?: string; materials?: Partial<Record<'bamboo' | 'stone' | 'tools', number>> };
  sources: { sourceId: string; pages?: string; chapter?: string }[];   // at least 2 for 'verified'; chapter is filled for the online books
  status: Status;
  verifyNotes?: string[];     // what the team still has to check
}
```
Rules enforced by validation:
- Stops with `status: 'outline'` may have `story: '[TO WRITE]'`, empty `dialogue.lines` and `quiz`, and `null` for `scene.image`, `scene.time` and `rewards.stamp.icon` (use a discriminated union in Zod). Outline stops appear on the map as "coming soon" pins in dev/preview only. (The seed has no outline stops any more, but keep the rule for stops the team adds later.)
- Every `dialogue.lines[].speaker` except `narrator` must exist in `characters.json` **and** have an entry in `scene.speakerAnchors`.
- Every `rewards.item` must exist in `items.json`, and every item has a 26 × 26 `icon` in `assets/icons/items/`.
- The final stop (`bagumbayan-1896`) must have an empty `quiz` (GD-6); every other `draft`/`verified` stop needs 1–5 questions.
- `story` word count 100–150 (warning outside 90–170 in draft, error in verified).
- `verified` stops need ≥ 2 `sources` and no `verifyNotes`.
- Every `scene.image`, `rewards.stamp.icon` and sprite path must exist in `public/assets/`.
- `quiz[].answer` must match one option id.
- `order` values are unique and continuous.

### 6.2b Stop schema v3 (content v3, SRS v2.3) — replaces the `dialogue` and `quiz` parts of §6.2
`content/stops.v3.json` keeps every v2 field (`id`, `order`, `region`, `dateLabel`, `year`, `place`, `theme`, `title`, `teaser`, `story` = the 100–150-word summary for Read more, `scene`, `rewards`, `sources`, `status`, `verifyNotes`) and adds:
```ts
type Mood = 'neutral' | 'happy' | 'sad' | 'serious' | 'surprised' | 'thinking';
type Skill = 'recall' | 'chronology' | 'cause' | 'analysis' | 'source';

interface Line {
  speaker: string;                 // character id or 'narrator'
  text: string;                    // ≤ 25 words
  mood: Mood;                      // portrait row
  onScene: boolean;                // true → show the "…" bubble at scene.speakerAnchors[speaker]
  recorded?: { sourceId: string }; // present only when the words are quoted from a published source
}
interface Chapter {
  id: string;                      // 'c1'..'c4'
  title: string;                   // ≤ 40 chars
  camera: { x: number; y: number; zoom: number };   // % of scene; zoom 1–1.6
  narration: string[];             // paragraphs
  lines: Line[];                   // 0–4
  fact?: { text: string; sourceId: string };
}
type Question =
  | { id: string; type: 'mcq';   skill: Skill; prompt: string; options: {id: string; text: string}[]; answer: string;   explain: string; sourceId: string; hint: string }
  | { id: string; type: 'multi'; skill: Skill; prompt: string; options: {id: string; text: string}[]; answers: string[]; explain: string; sourceId: string; hint: string }
  | { id: string; type: 'order'; skill: Skill; prompt: string; items: {id: string; text: string}[];   answer: string[];  explain: string; sourceId: string; hint: string }   // items listed in the correct order; shuffle for display
  | { id: string; type: 'match'; skill: Skill; prompt: string; left: {id: string; text: string}[]; right: {id: string; text: string}[]; pairs: Record<string, string>; explain: string; sourceId: string; hint: string }
  | { id: string; type: 'error'; skill: Skill; prompt: string; segments: {id: string; text: string}[]; answer: string; correction: string; explain: string; sourceId: string; hint: string };

interface StopV3 extends Omit<Stop, 'dialogue' | 'quiz'> {
  contentVersion: 3;
  wordCount: number;               // narration words, computed by the content script
  chapters: Chapter[];             // 4
  dialogue: { dramatized: true };  // kept for the v2 "Dramatized" rule
  quiz: Question[];                // 5 (0 for bagumbayan-1896)
}
```
Characters gain `portrait: '/assets/portraits/<id>.png'` and, for speakers without a scene sprite, `offscreenOnly: true` (`paciano`, `taviel`, `luis-taviel`).

Validation (add to `validate-content`):
- 4 chapters; narration ≥ 600 words (error for `verified`, warning for `draft`); each line ≤ 25 words; moods valid.
- Every `speaker` exists in `characters` (or is `narrator`) and has a portrait file; `onScene: true` only if the speaker has an anchor.
- Every `sourceId` (lines, facts, questions) exists in `sources.json`.
- Quiz: 5 questions (0 for the final stop); `mcq` has 4 options and a valid answer; `multi` has 2+ answers but not all options; `order` 3–5 items; `match` 3–4 pairs; `error` answer is one segment id and `correction` is not empty.
- `fil.stops.json` has the same stops, chapter counts, paragraph arrays, line counts (in order), fact presence, question counts and option/item/pair/segment counts as `stops.v3.json`.

### 6.3 The 25 stops
All 25 stops are written in `content/stops.v3.json` (v2.3): a 100–150-word summary, four chapters (15,400 words of narration in total), 144 dialogue lines (16 of them quoted from public-domain sources), 120 quiz questions (none for the final stop), rewards, sources and verify notes. A Filipino draft of everything is in `content/i18n/`. **Every stop is `draft`:** the team must check each one against two sources (§14) before it becomes `verified`.

| # | id | Year(s) | Then → Today | Region | Theme | What happens (outline) |
|---|---|---|---|---|---|---|
| 1 | calamba-1861 | 1861 | Calamba, Laguna | PH | Study | Born 19 June 1861; his mother is his first teacher |
| 2 | binan-1869 | 1869 | Biñan, Laguna | PH | Study | First formal schooling in Biñan |
| 3 | ateneo-1872 | 1872–1877 | Ateneo Municipal, Intramuros, Manila | PH | Study | Enters the Ateneo; Bachelor of Arts 1877 |
| 4 | ust-1877 | 1877–1882 | University of Santo Tomas, Intramuros | PH | Study | Philosophy and letters, then medicine |
| 5 | barcelona-1882 | 1882 | Barcelona, Spain | Europe | Travel | Arrives in Spain |
| 6 | madrid-1882 | 1882–1885 | Universidad Central, Madrid | Europe | Study | Medicine and philosophy and letters |
| 7 | paris-1885 | 1885–1886 | Paris, France | Europe | Study | Eye-surgery training |
| 8 | heidelberg-1886 | 1886 | Heidelberg, Germany | Europe | Study | Eye clinic; writes a poem to Heidelberg's flowers |
| 9 | wilhelmsfeld-1886 | 1886 | Wilhelmsfeld, Germany | Europe | Travel | Stays with a pastor's family in the hills |
| 10 | leipzig-1886 | 1886 | Leipzig, Germany | Europe | Writing | Translation work |
| 11 | berlin-1887 | 1886–1887 | Berlin, Prussia → Germany | Europe | Writing | *Noli Me Tangere* printed, with Maximo Viola's help |
| 12 | leitmeritz-1887 | 1887 | Leitmeritz, Bohemia → Litoměřice, Czech Republic | Europe | Travel | Meets Ferdinand Blumentritt |
| 13 | calamba-1887 | 1887 | Calamba, Laguna | PH | Cause | Returns home; trouble over the town's lands |
| 14 | japan-1888 | 1888 | Tokyo, Japan | Asia | Travel | Weeks in Japan |
| 15 | usa-1888 | 1888 | San Francisco → New York, USA | America | Travel | Crosses the United States |
| 16 | london-1888 | 1888–1889 | London, England | Europe | Writing | Annotates Morga's history at the British Museum |
| 17 | paris-1889 | 1889–1890 | Paris, France | Europe | Writing | The annotated Morga is published |
| 18 | brussels-1890 | 1890 | Brussels, Belgium | Europe | Writing | Writes his second novel |
| 19 | biarritz-1891 | 1891 | Biarritz, France | Europe | Writing | Finishes the second novel |
| 20 | ghent-1891 | 1891 | Ghent, Belgium | Europe | Writing | *El Filibusterismo* printed |
| 21 | hongkong-1891 | 1891–1892 | Hong Kong (British colony) | Asia | Cause | Eye clinic; plans for Filipinos' future |
| 22 | manila-1892 | 1892 | Tondo, Manila | PH | Cause | Founds La Liga Filipina (3 July 1892); arrested days later |
| 23 | dapitan-1892 | 1892–1896 | Dapitan → Dapitan City, Zamboanga del Norte | PH | Exile | School, clinic, water system (builder mini-game) |
| 24 | fortsantiago-1896 | 1896 | Fort Santiago, Intramuros | PH | Writing | Imprisoned; writes his farewell poem |
| 25 | bagumbayan-1896 | 30 Dec 1896 | Bagumbayan → Rizal Park (Luneta), Manila | PH | Cause | His final day (handled per GD-6) |

### 6.4 Writing rules
- 100–150 words per story. Short sentences. Explain any Spanish or Tagalog word the first time (e.g., "capiz — shell used as window glass").
- Old place name first, today's name second.
- When sources disagree on a date, use the date both sources agree on, or write "about 1886", and add a `verifyNotes` entry.
- Dialogue: at most 5 lines per stop, ≤ 25 words per line, marked `dramatized: true` whenever a real person speaks.
- Quiz questions test the story text only, never outside knowledge.

---

### 6.4b Writing rules for content v3
- **600–800 words of narration per stop, in 4 chapters.** Plain English, short sentences, every Spanish or Tagalog word explained the first time.
- Each chapter: a title (≤ 40 chars), 1–3 paragraphs, 0–4 dialogue lines (≤ 25 words each), optional "Did you know?" fact with a source.
- A line may be `recorded` only if its words are quoted (in a published English translation, ideally public domain) from the cited source. Everything else is dramatized and must be fair to the record; a teacher approves dramatized lines before `verified`.
- **College-level quiz:** 5 questions per stop, mixing types (at least one `order` or `match`, at least one `error`, at least one `cause`/`analysis`/`source` question). Every answer must be findable in that stop's chapter text. Every question has an `explain` (why the answer is right) and a `hint` that points back to the text without giving the answer.
- Where sources disagree, say so in the text and name them (several stops do this on purpose: they teach source criticism). Record the disagreement in §14.4 and in `verifyNotes`.
- Respect GD-6: the final stop is quiet, factual and non-graphic.

---

## 7. Art bible

**Goal:** every stop looks like *that* place in *that* year: its buildings, its light, its weather, its clothes. Quality bar: consistent, hand-crafted 16-bit-era pixel art. No smooth gradients, no blur, no mixed pixel sizes, no generic stock look.

### 7.1 Formats
| Asset | Native size | Display |
|---|---|---|
| Scene | **384 × 216** (16:9) | Integer scale 2×–4×, `image-rendering: pixelated` |
| Region map | Europe 384 × 288 (4:3); Philippines 320 × 320 (1:1); inset 176 × 176; Asia 384 × 240; America 384 × 192 | Same |
| Adult sprite | 34 × 78 canvas (figure ≈ 66 px tall, head ≈ 13 px) | Placed in scenes at 1× |
| Boy sprite (10–12 yrs) | 30 × 64 | 1× |
| Small child (3–4 yrs) | 24 × 48 | 1× |
| Stamp icon / item icon | 26 × 26 | 2×–3× |
| Builder (top-down) scene | 320 × 180 | Same as scenes |

Characters stand on the scene's ground line (feet at **y ≈ 206–207**). A character's sprite is pasted at `y = 207 − 75` for adults, `207 − 60` for boys, `206 − 45` for small children.

### 7.2 Palette and shading
- Every material uses a **7-tone hue-shifted ramp** (dark → light). Shadows drift toward blue/violet, highlights toward warm yellow. Mid tones carry the most saturation.
- Shading and lighting change the **tone index**, never blend colors. This keeps palettes small and crisp.
- Skin uses hand-picked ramps (`art-tools/chars.py → SKIN_RAMPS`). Never generate skin ramps automatically (they go red).
- **Light comes from the upper left in every scene.** Edges facing the light are one tone brighter; edges facing away are one or two tones darker.
- Dithering (Bayer 4×4) is only allowed at the edges of color bands (sky, glows, haze, light beams). Never fill large areas with dither noise.
- Sprites use **selective outlines**: the outline is a darkened version of the neighboring color, not flat black.
- Each scene has a **color grade** (a slight tint applied to its whole palette) that sets the mood: morning, midday, dusk, winter daylight, golden hour.

### 7.3 Characters
| Character | Look (approved) | File |
|---|---|---|
| Rizal, adult (Europe) | Slim; black side-parted hair; thin mustache; dark sack coat, waistcoat, white high collar, black bow tie, dark trousers | `rizal_adult_suit.png`, `_sheet`, `_overcoat` (Madrid, with book) |
| Rizal, Dapitan | White long-sleeved shirt, light trousers, straw hat, book | `rizal_dapitan.png` |
| Rizal, Ateneo (age 11) | White jacket, dark trousers, shoes, books | `rizal_boy_student.png` |
| Rizal, small child | White camisa, short pants, barefoot | `rizal_child.png` |
| Teodora Alonso | Baro't saya: sheer white camisa, folded pañuelo, striped saya, dark tapis, hair in a bun | `teodora_alonso.png` |
| Maximo Viola | Brown suit, mustard waistcoat, red tie, bowler hat | `maximo_viola.png` |
| Supporting | Jesuit teacher (black cassock, wide clerical hat), Berlin pressman (cap, apron), Madrid gentleman (top hat, frock coat), Madrid lady (1880s bustle dress), Dapitan pupils | `assets/sprites/` |

Sprites face the viewer's left in 3/4 view. Flip horizontally when a character must face right. Keep faces simple: brows, 2-px eyes, nose shadow, mouth; no anime eyes, no chibi heads.

Added in v2.1 (same template, `art-tools/export_sprites.py`): Rizal at 18 without mustache (`rizal_young`), in shirtsleeves, in black suit (1896); Maestro Justiniano (sinamay camisa, ferule); Dominican professor (white habit, black cape); Barcelona gentleman; Dr. Louis de Wecker (grey hair, beard, spectacles, frock coat); Pastor Karl Ullmer (black frock coat, book); Ferdinand Blumentritt (beard, spectacles); Usui Seiko (kimono with obi, hair pinned up); Juan Luna (beard, bowler, cane); Nellie Boustead (1890s dress and hat); Ghent printer (apron); La Liga member; Teodora Alonso, older (grey hair).

Not yet drawn, because no stop needs them now: Valentín Ventura, Josephine Bracken, Paciano Rizal, Leonor Rivera.

### 7.4 Regional identity (what changes from place to place)
| Region / era | Sky & light | Architecture & materials | Nature & props | Clothing |
|---|---|---|---|---|
| Laguna towns, 1860s | Warm morning, soft clouds, Mt. Makiling in haze | Bahay na bato: lime-washed stone/adobe below, hardwood + capiz above, clay tiles; nipa huts on bamboo stilts | Mango trees, banana plants, bamboo fences, chickens, dirt road | Baro't saya, camisa, barefoot children |
| Intramuros, 1870s | Hard tropical midday, deep blue sky, short shadows | Stone colonial buildings, capiz upper floors, baroque bell towers, city walls | Cobbles, iron oil lamps, potted plants | Jesuit cassocks, student whites |
| Madrid, 1880s | Autumn dusk, violet→orange sky, gas-lamp pools | Classical stone portals, plaster blocks in ochre/red, green shutters, iron balconies | Plane trees, fallen leaves, granite cobbles | Overcoats, top hats, bustle dresses |
| Germany & Bohemia, 1880s | Cold winter light (Berlin), spring greens (Heidelberg) | Brick industrial halls, half-timbered houses, castle ruins, river bridges | Snow on roofs, line shafts, presses, river boats | Suits, aprons, caps |
| Paris / London / Belgium | Overcast or rainy daylight; Paris in spring | Haussmann façades, museum reading rooms, Flemish gables (Ghent) | Cabs, gas lamps, bookshops | Same as above |
| Japan, 1888 | Spring, cherry blossom | Wooden houses, tiled roofs, lanterns | Sakura, rickshaws | Kimono for locals |
| USA, 1888 | Dry plains / city haze | Train station, steamship, New York brick | Steam locomotive | Western clothing |
| Hong Kong, 1891 | Humid haze over the harbour | Colonial arcades, hillside houses | Junks, sampans, Victoria Peak | Mixed Chinese/European |
| Dapitan, 1892–96 | Golden hour, sea glints | Square house + octagonal Casa Redonda + hexagonal house, all bamboo, wood and nipa on stilts | Coconut palms, bamboo aqueduct, banca, hill behind | White shirt, straw hat; pupils in camisas |
| Manila, 1896 | Grey dawn; muted palette | Fort Santiago stone walls, cell window | Few props; no blood, no weapons shown firing | Dark suit |

### 7.5 Anachronism checklist (reject any scene that fails)
- [ ] No Eiffel Tower before 1889 (built 1887–1889; show it under construction in 1888, finished in 1889+).
- [ ] No electric lights in streets before the 1880s; in Manila, use oil lamps; in Berlin and Madrid, gas.
- [ ] No cars, bicycles with equal wheels before 1885, zippers, plastic, modern signage, Rizal Monument (1913) in 1896 scenes.
- [ ] Rizal Shrine in Calamba is a 1950 reconstruction; the National Historical Institute repainted it green in 2009 to recall the meaning of the surname (see `ocampo-conversation`, `philstar-chartreuse` in §14). Do not copy today's paint for 1860s scenes.
- [ ] The Dapitan houses were bamboo, wood and nipa, not concrete.
- [ ] Clothing matches the decade and place (§7.3–7.4).

### 7.6 Scene composition
- Three depth layers: background (sky, distant hills, haze), midground (main building), foreground (street, fence, plants, characters).
- Main characters stand in the front third, between x ≈ 80 and x ≈ 280, with a 1-tone shadow ellipse under their feet. Long shadows at golden hour point to the right.
- Leave the bottom 40 px calm enough for the dialogue box to overlap on desktop.
- Text inside scenes (signs) uses the 3 × 5 pixel font in `artkit.py` and only real period names (e.g., "ATENEO MUNICIPAL", "UNIVERSIDAD CENTRAL").

### 7.7 UI art rules
- 3 px ink borders, square corners, hard offset shadows.
- Icons are drawn as pixel SVG (`shape-rendering="crispEdges"`) on an 8 × 8 or 10 × 10 grid, or as PNG at integer scale. No emoji.

### 7.8 Finished assets in this pack
| File | Content |
|---|---|
| `assets/scenes/calamba_1864.png` | Morning; the family bahay na bato with Doña Teodora's shop, nipa hideaway hut, mango tree, Mt. Makiling; Teodora reads to little José |
| `assets/scenes/intramuros_1872.png` | Midday on Calle Arzobispo; "ATENEO MUNICIPAL" portal; bell tower; José (11) with a Jesuit teacher |
| `assets/scenes/madrid_1882.png` | Autumn dusk on Calle San Bernardo; "UNIVERSIDAD CENTRAL" portal; gas lamps; Rizal in overcoat; passers-by |
| `assets/scenes/berlin_1887.png` | Winter daylight in a print works; belt-driven cylinder press, type cases, drying sheets; Rizal, Viola, pressman |
| `assets/scenes/dapitan_1893.png` | Golden hour at Talisay; square house, octagonal Casa Redonda, bamboo aqueduct, palms, banca; Rizal teaching pupils |
| `assets/maps/*.png` | Europe, Philippines, Manila–Laguna inset (real coastlines; Laguna de Bay hand-drawn) |
| `assets/scenes/` (20 more, v2.1) | `binan_1869` rainy nipa schoolroom, Maestro Justiniano and pupils · `ust_1879` stone cloister, Dominican friar, Rizal with his prize poem · `barcelona_1882` the Rambla in summer · `paris_1885` de Wecker's clinic with eye chart and patient chair · `heidelberg_1886` Neckar, Old Bridge, castle ruin, forget-me-nots · `wilhelmsfeld_1886` half-timbered vicarage, Pastor Ullmer · `leipzig_1886` rented room, Old Town Hall through the window · `leitmeritz_1887` market square, Blumentritt meets Rizal and Viola · `calamba_1887` home clinic, Doña Teodora, farmer at the door · `tokyo_1888` canal with cherry blossoms, O-Sei-san · `usa_1888` Nevada depot, 4-4-0 locomotive, Sierra · `london_1888` British Museum Reading Room · `paris_1889` Eiffel Tower (original red-brown), Exposition, Juan Luna · `brussels_1890` lamp-lit boarding-house room, snow · `biarritz_1891` Villa Eliada terrace, Nellie Boustead · `ghent_1891` hand press and type cases, printer · `hongkong_1891` D'Aguilar Street, Rizal and his mother · `tondo_1892` La Liga meeting under an oil lamp · `fortsantiago_1896` candle-lit cell with the alcohol stove · `bagumbayan_1896` empty field and bay at dawn (no people, GD-6) |
| `assets/maps/asia.png`, `america.png` | Asia (Japan, Taiwan, south China coast, Hong Kong) and the United States (Sierra, Rockies, Great Lakes hand-drawn, San Francisco, New York) |
| `assets/builder/*.png` | Dapitan top-down background + school / clinic (octagonal Casa Redonda) / water system / sign |
| `assets/icons/stamp_*.png` | 25 stamps, one per stop (the final stop's is a plain sampaguita flower) |
| `assets/icons/items/*.png` | 24 item icons, one per item in `items` |
| `assets/sprites/*.png` | 29 character sprites (§7.3) |

### 7.9 Making new art with `art-tools/`
Requirements: Python 3.10+, `pip install pillow numpy global-land-mask`.

```
cd art-tools && mkdir -p out
python3 scene_berlin.py        # writes out/scene_berlin.png and a 3x preview
python3 chars.py               # writes out/sheet.png (all character variants)
cd legacy-v1 && mkdir -p out && python3 gen_ph.py   # region maps (uses terrain.py)
```
- `artkit.py`: canvas with ramp/tone pixels, hue-shifted ramps, shape masks, `solid()` auto-shading, textures (bricks, dressed stone, planks, tiles, nipa thatch, cobbles), banded dithering, the 3 × 5 font, selective outline.
- `common.py`: sky, clouds, hills, tree canopies, palms, lamps + glow, capiz windows, shadows.
- `chars.py`: the four body templates and all clothing options.
- `scene_*.py`: one file per scene; copy the closest one to start a new scene.
- `legacy-v1/terrain.py`: region map renderer (real coastlines from `global-land-mask`; `lakes=` to paint lakes the dataset misses). `gen_map.py` = Europe, `gen_ph.py` = Philippines + inset, `gen_dapitan.py` = builder art, `gen_icons.py` = stamps.

**To add a scene:** (1) collect two reference descriptions/photos of the place in that decade; (2) write `scene_<place>.py` following §7.2–7.6; (3) render, view the 3× preview, fix issues against the §7.5 checklist; (4) copy the PNG to `public/assets/scenes/`; (5) set `scene.image` in the stop's content.

**All 25 scenes, both new maps, all stamps and item icons are done** (v2.1). The scripts that made them are in `art-tools/`: `scene_<place>.py` for each scene, `kit2.py` (furniture, water, rain, snow, windows and a `place()` helper that returns each speaker's anchor), `export_sprites.py` (dialogue sprites), and in `legacy-v1/`: `gen_asia_america.py`, `gen_icons2.py` (stamps + items), `gen_clinic.py` (Casa Redonda). Use the same scripts if the team changes a scene after fact-checking.

A team member may hand-polish any PNG in Aseprite or LibreSprite, as long as it stays at native size and keeps the palette rules.

---

### 7.10 Close-up portraits — v2.3
Every speaking character has a portrait sheet in `assets/portraits/<characterId>.png`, made by `art-tools/portraits.py` (same skin ramps and clothing colours as the scene sprites, light from the upper left, selective outlines).
- **Sheet:** 256 × 384 px = 4 columns × 6 rows of 64 × 64 frames. Columns: 0 idle, 1 blink, 2 talk (mouth half open), 3 talk (mouth open). Rows: 0 neutral, 1 happy, 2 sad, 3 serious, 4 surprised, 5 thinking.
- **Display:** integer scale only (2× = 128 px on desktop; 1× or 2× on phones), `image-rendering: pixelated`, shown inside a 3 px ink frame on the parchment colour. Use `background-position` with `steps()` for frame changes. Portraits face viewer-left; mirror with `scaleX(-1)` when the portrait sits on the right of the text box.
- 24 sheets: rizal, rizal-dapitan, rizal-young, jose-boy, jose-child, teodora, teodora-older, paciano, viola, jesuit, pupil, justiniano, dominican, gentleman, de-wecker, ullmer, blumentritt, seiko, luna, nellie, printer, member, taviel, luis-taviel. The narrator has no portrait (book icon).
- Likeness: the portraits follow the approved sprites (§7.3) and written descriptions (e.g. Rizal's own description of Maestro Justiniano: tall, thin, long neck, sharp nose). **Paciano, both Taviel de Andrade brothers, the Jesuit, the Dominican, the printer, the pupil and the Liga member are artist's impressions**; the team should compare Rizal, Teodora, Blumentritt, Luna, Viola and Seiko with period photographs and adjust colours or hair in `SPECS` if needed (§13).
- To change one: edit its entry in `SPECS` in `portraits.py`, run `python3 portraits.py`, check `out/portraits_contact.png`, copy the PNG to `public/assets/portraits/`.

---

## 8. Technical architecture

### 8.1 Stack
| Concern | Choice | Why |
|---|---|---|
| Language | TypeScript (strict) | Safer content handling |
| UI | React 18 + Vite | Simple, fast static builds |
| Routing | React Router 6 (`createBrowserRouter`) + SPA fallback on host | Clean URLs |
| State | Zustand + `persist` middleware (localStorage) | Small, readable |
| Validation | Zod | Content checks at build and runtime |
| Styling | CSS Modules + a global `tokens.css` (§5.3) | Matches mockup's inline styles closely |
| Map | Plain DOM: `<img>` + absolutely positioned pins + inline SVG path. **No Leaflet / map tiles.** | Pixel art maps, no external requests |
| Tests | Vitest + React Testing Library; Playwright for e2e | — |
| Lint/format | ESLint (typescript, react, jsx-a11y) + Prettier | Accessibility linting |
| Offline | `vite-plugin-pwa` (precache assets) | SHOULD (NFR-7) |

No analytics, no cookies, no external fonts at runtime: self-host the two fonts (`@fontsource/pixelify-sans`, `@fontsource/nunito`).

### 8.2 Folder structure
```
lakbay-rizal/
  public/
    assets/ (copied from starter pack: scenes, sprites, maps, builder, icons)
    content/ (stops.json, regions.json, characters.json, items.json, builder.json, sources.json)
  src/
    app/ (router, layout, providers)
    components/ (§5.4, one folder each with .tsx + .module.css + .test.tsx)
    features/
      map/  stop/  quiz/  passport/  journal/  builder/  gallery/  settings/
    content/ (schemas.ts, loader.ts, selectors.ts)
    store/ (progress.ts, migrations.ts)
    lib/ (projection.ts, shuffle.ts, a11y.ts)
    i18n/ (en.json, t.ts)
    styles/ (tokens.css, global.css, fonts.css)
  scripts/ (validate-content.ts, copy-assets.ts)
  e2e/ (journey.spec.ts)
  docs/ (DECISIONS.md, CONTENT_TODO.md)
```

### 8.3 Content loading
- At build: `scripts/validate-content.ts` validates all JSON with the Zod schemas and checks every asset path exists. Wire it to `prebuild` and `pretest`.
- At runtime: `loader.ts` fetches the JSON once, validates again (dev only), and caches it in memory.
- Selectors: `getStopsByRegion`, `getNextStop(progress)`, `getThemeTotals`, `isUnlocked(stop, progress, mode)`.

### 8.4 State
```ts
interface Progress {
  version: 1;
  mode: 'guided' | 'free';
  visited: string[];         // stop ids
  completed: string[];       // stop ids
  stamps: string[];          // stop ids, in earned order
  items: string[];
  materials: { bamboo: number; stone: number; tools: number };
  builder: { school: boolean; clinic: boolean; water: boolean };
  seenIntro: boolean;
  newStamp?: string;         // cleared when passport is opened
  settings: { textSize: 'normal' | 'large'; reduceMotion: 'system' | 'on' | 'off'; showVerifyNotes: boolean };
}
// v2.3 (store version 2, with a migration from 1):
interface ProgressV2 extends Omit<Progress, 'version' | 'settings'> {
  version: 2;
  xp: number; streak: number; bestStreak: number;
  stampGrade: Record<string, 'gold' | 'silver'>;
  quizStats: { typeCorrect: Record<string, number>; skillCorrect: Record<string, number> };
  chaptersRead: Record<string, number>; readMoreOpened: string[];
  achievements: string[]; seenTips: string[]; tourDone: boolean;
  readIn: Record<string, ('en' | 'fil')[]>;
  save: { lastExportAt?: string; remindersOn: boolean; persisted?: boolean };
  certificateName?: string;
  settings: Progress['settings'] & { lang: 'en' | 'fil'; sound: boolean; music: boolean; volume: number; autoplay: boolean };
}
```
Actions: `visit(id)`, `complete(id)` (idempotent; grants rewards once), `build(project)`, `resetBuilder()`, `setMode()`, `reset()`.

### 8.5 Persistence
- Key `lakbay-rizal:v1`. Wrap all reads/writes in try/catch (private mode, quota). If parsing fails: keep a copy under `lakbay-rizal:v1:corrupt`, start fresh, show a toast.

### 8.6 Map projection
Equirectangular within each region's bounds (the same formula the art scripts used):
```
xPct = (lon − lon0) / (lon1 − lon0) × 100
yPct = (lat1 − lat) / (lat1 − lat0) × 100
```
| Region image | lat0 | lat1 | lon0 | lon1 |
|---|---|---|---|---|
| europe.png (384×288) | 35.5 | 57.0 | −13.0 | 28.25 |
| philippines.png (320×320) | 4.8 | 20.2 | 114.6 | 130.2 |
| manila_laguna_inset.png (176×176) | 13.95 | 14.75 | 120.75 | 121.55 |
| asia.png (384×240) | 18.0 | 40.0 | 110.0 | 145.0 |
| america.png (384×192) | 30.0 | 46.0 | −126.0 | −70.0 |

Check values (from the art): Europe: Madrid (22.4, 77.1), Barcelona (36.7, 72.6), Biarritz (27.6, 62.9), Paris (37.0, 37.9), London (31.0, 25.4), Ghent (40.4, 27.4), Heidelberg (52.3, 35.1), Leipzig (61.5, 26.0), Berlin (63.8, 20.8), Leitmeritz (65.6, 29.9). Philippines: Manila (40.6, 36.3), Dapitan (56.3, 74.7). Inset: Manila (28.4, 19.9), Biñan (40.9, 51.1), Calamba (52.3, 67.1). Asia: Tokyo (84.8, 19.6), Hong Kong (11.9, 80.5). America: San Francisco (6.4, 51.4), New York (92.8, 33.1). Tolerance ±1 %.

Pin anchor: the pin's bottom tip sits on the coordinate (`left: calc(x% − 40px)`, `top: calc(y% − pinHeight)` for an 80-px-wide pin wrapper).

---

## 9. Non-functional requirements

| ID | Requirement | Check |
|---|---|---|
| NFR-1 Performance | First load ≤ 300 KB JS (gzip), each scene PNG ≤ 60 KB (they are ~15–35 KB). LCP ≤ 2.5 s on a mid-range phone over 4G. | Lighthouse mobile ≥ 90 |
| NFR-2 Accessibility | WCAG 2.1 AA: all controls are real buttons/links; visible focus ring (3 px `--accent` outline); text contrast ≥ 4.5:1; every scene has `alt` text from content; dialogs trap focus; `prefers-reduced-motion` respected. | axe in Playwright: 0 serious/critical issues |
| NFR-3 Responsive | Usable from 360 px to 1920 px; no horizontal scrolling of the page. | Playwright screenshots at 360, 768, 1440 |
| NFR-4 Browser support | §2.2 | Manual smoke test |
| NFR-5 Privacy | No accounts, no tracking, no third-party requests at runtime. | Network tab shows only same-origin requests |
| NFR-6 Maintainability | Components ≤ 200 lines; no `any`; content changes need no code changes. | Lint + review |
| NFR-7 Offline | After one visit, the game loads and plays offline. | SHOULD; Playwright offline test |
| NFR-8 Licensing | Fonts under SIL OFL credited; art original; sources listed. | Credits page review |
| NFR-9 Respectful content | No depiction of violence or execution; the final stop is quiet and factual. | Content review before release |

---

## 10. Out of scope (ideas for later)
Audio narration (voice) · teacher dashboard / class codes · on-site AR "visit Rizal sites" mode · multiplayer · accounts or cloud saves.

---

## 11. Build plan (milestones for Claude Code)

| Milestone | Deliverables | Done when |
|---|---|---|
| **M0 Setup** | Vite + React + TS strict; ESLint (jsx-a11y), Prettier, Vitest, Playwright; fonts self-hosted; `tokens.css`; copy `assets/` to `public/assets/`; `docs/DECISIONS.md`, `docs/CONTENT_TODO.md` | `npm run dev` shows a blank shell with the header; all scripts run green |
| **M1 Content** | Zod schemas; convert `content/stops.seed.json` into the `public/content/*.json` files; `validate-content` script; selectors with unit tests; projection with unit tests (§8.6 check values) | Validation passes for seed; fails clearly on a broken field |
| **M2 Map** | `MapView` for Europe and Philippines (pins, states, path, cluster + inset, overlays, side panel, journey list); region tabs; timeline slider; Guided/Free | Matches `Main.dc.html` and `Philippines.dc.html` at 1440 and 360 px |
| **M3 Stop** | Scene view, dialogue system with portraits and speaker indicator, "Dramatized" tag, This stop / Item / Source cards, Read more dialog | Berlin stop plays end to end like `Story.dc.html` |
| **M4 Quiz & rewards** | Quiz flow, hints, reward card, progress store with persistence, Passport, Journal | Completing Berlin adds stamp + item; survives refresh |
| **M5 Dapitan builder** | Builder screen, materials economy, overlays, facts, completion stamp; use the Casa Redonda clinic sprite (60 × 52, §3.5) | Matches `Dapitan.dc.html`; building all three gives the stamp |
| **M6 Gallery, settings, credits** | `/scenes`, settings (text size, motion, mode, verify notes, reset), credits, intro cards, 404 page | All FR-55, FR-70–73 checks pass |
| **M7 All stops** | Wire in Asia + America maps, all 25 scenes, stamps and item icons (already in `assets/`); run `validate-content` on all 25 stops | Every stop plays end to end in preview mode; validation passes |
| **M8 Polish & release** | PWA offline, a11y audit fixes, Lighthouse ≥ 90, deploy config (SPA fallback), README for the team | §12 e2e passes on a preview deploy built with `INCLUDE_DRAFTS=true`; the production deploy shows only verified stops |

---

### 11b Upgrade milestones for v2.3 (the app is already built to v2.2)
Run these **after** M0–M8. Each has a ready prompt in `prompts/U<n>.md`; paste it into Claude Code in **plan mode**, approve the plan, then let it build. After each: `npm run lint && npm run typecheck && npm test && npm run build`, play-test with `INCLUDE_DRAFTS=true`, commit, `/clear`.
| Milestone | Deliverables | Done when |
|---|---|---|
| **U1 Look & layout** | VT323 everywhere (self-hosted `@fontsource/vt323`), new type scale (§5.3), slim header, bottom nav on phones, collapsible panels, full-bleed scene, container queries (§5.5) | 360/768/1440/1920 screenshots show no overflow; text readable at "Normal" and "Large" |
| **U2 Content v3 + language** | Zod schema v3 (§6.2b), import `content/stops.v3.json` and the `content/i18n/*` files into `public/content/`, validation (incl. the EN/FIL mirror check), language switch with fallback and draft badge (§3.10) | `validate-content` passes; switching EN/FIL changes all text |
| **U3 Story player** | §3.6 in full: chapters, camera, typewriter, portraits with talk/blink, tags, facts, auto-play, skip, keyboard, final-stop variant | FR-80 checks pass |
| **U4 Quiz engine v3** | Five question types (§6.2b, FR-81/82), explanations, hints, per-question source line | FR-81 Playwright test for every type |
| **U5 Gamification** | XP, streak, gold/silver stamps, ranks, achievements, toasts, passport tabs, Rizal reactions (§3.7–3.8) | FR-83 seeded tests |
| **U6 Rizal guide** | Tour with spotlight, tips, `data-guide` ids, replay from Settings (§3.7) | FR-84 |
| **U7 Save safety + extras** | §3.9 in full, certificate (§3.8), `/timeline` page (FR-88) | FR-85/87/88 |
| **U8 Motion, sound, release** | §5.6 motion catalogue, ambient effects, §3.11 sound, reduced-motion audit, axe, Lighthouse ≥ 90, update e2e (§12b), deploy preview | All checks green on the preview deploy |

---

## 12. End-to-end acceptance test (Playwright, `e2e/journey.spec.ts`)
Run against a build made with `INCLUDE_DRAFTS=true`, because the seed stops are still drafts (FR-62). Add a second, short test that a normal production build with no verified stops shows the "Content coming soon" state.

1. Fresh profile → intro shows → skip.
2. Map opens on the first region with stop 1 as current; later stops locked.
3. Switch to **Free explore** → open **Berlin**.
4. Step through all dialogue lines → **Quiz** button enables.
5. Answer a question wrong → hint shows, no penalty → answer right → next question → right.
6. Reward card shows Berlin stamp + *Noli Me Tangere* → **Open passport** shows Berlin with **New!**.
7. Refresh → stamp still there; **New!** gone after the passport was opened.
8. Timeline to 1892 → Philippines region, Dapitan highlighted.
9. Open Dapitan → finish dialogue → builder → build clinic and water system → Dapitan stamp.
10. Settings → Reset progress → confirm → map back to the start state.
11. Repeat steps 2–6 at 360 × 740 (mobile) and check no horizontal scroll.
12. Run axe on map, stop, quiz, passport, builder: no serious/critical issues.

---

### 12b End-to-end additions for v2.3 (`e2e/journey-v3.spec.ts`)
1. Fresh profile → Rizal tour starts → step through 3 steps → Skip → tour ends; Settings → Replay the tour works.
2. Open Calamba (Free mode) → 4 chapters play; chapter 3 camera targets Teodora; a "Recorded" tag is visible on her line.
3. Quiz: answer one question of each type present (order by keyboard, match by taps, error by tapping a segment, multi, mcq); wrong answer shows hint, right answer shows explanation; XP increases.
4. Finish with ≥ 4 first-try answers → gold stamp; passport shows it; achievement toast for `first-steps`.
5. Mid-quiz refresh triggers `beforeunload`; refresh on the map does not.
6. Settings → Download save code → Reset progress → Load save code → progress identical (deep-equal of the store).
7. Switch to FIL → story and UI in Filipino; "Draft translation" badge visible; switch back.
8. Repeat 2–4 at 360 × 740 and in landscape 740 × 360.
9. Reduced motion on: no transform animations run (check computed `animation-name: none` on animated classes).
10. Final stop: no quiz, no guide, no sound, no sparkles; Epilogue card shown.

---

## 13. Open items for the RIZLIFE team (content)
These must be resolved before a stop can be marked `verified`. Claude Code should list any new ones it finds in `docs/CONTENT_TODO.md`.
- Check every date and fact in `content/stops.seed.json` against two sources from §14 (at least one Tier 1 or Tier 2), and fill in page numbers.
- The exact day the *Noli* came off the press in March 1887 (sources give 21, 27 or 29 March; see §14.4). The printer (Berliner Buchdruckerei-Actien-Gesellschaft), 2,000 copies and Viola's ₱300 loan are confirmed in at least one credible source each.
- Original exterior colors of the Calamba house (the reconstruction dates from 1950; repainted green in 2009).
- Appearance of the Ateneo Municipal building on Calle Arzobispo in 1872.
- Rizal's own description of his three Dapitan houses (letter to Blumentritt, 19 Dec 1893): square, hexagonal, octagonal — confirm which house served as clinic, school and dormitory for the builder labels.
- The water system: dam and aqueduct details for the builder fact text.
- Look at each scene next to a period photo or drawing of the place and list any detail to fix (record the reference in `sources.json` as `kind: "art-reference"`). The scenes follow written descriptions; none was traced from a photo.
- Work through every stop's `verifyNotes` (v2.3: each stop has 3–7).
- **v2.3:** read all 25 four-chapter stories and 120 questions against the sources; check that every quiz answer is in the chapter text.
- **v2.3:** have a fluent Filipino teacher review `content/i18n/fil.*.json`, then set `status: "reviewed"`. The 16 `recorded` lines are translated from English translations: replace them with a published Filipino translation where one exists (e.g. of *Mi Último Adiós*), and cite it.
- **v2.3:** compare the portraits of Rizal, Teodora, Blumentritt, Luna, Viola and Seiko with period photographs (§7.10).
- **v2.3:** a teacher approves the neutral wording on the retraction and marriage questions in fortsantiago-1896.

---

## 14. Sources and references

Every entry below was checked against a library catalog record, the publisher, or the live web page on 24–25 November 2026. The same list is in machine-readable form in `content/sources.json`, and each stop in `content/stops.seed.json` already points to the sources it should be checked against (`sources[].sourceId`). **Page numbers are still empty:** most books are print-only, so the team must add pages while reading them. For the two biographies that are online (Craig 1913 and Russell & Rodriguez 1923, both on Project Gutenberg) each stop already gives the **chapter** in `sources[].chapter` (table §14.3b).

### 14.1 How to use sources (rules for content writers and Claude Code)
- **Tier 1, primary sources:** Rizal's own letters, memoirs, diaries and books, in period or official editions. These are the strongest evidence for what he did, said and wrote.
- **Tier 2, scholarly biographies and official bodies:** Published biographies, and pages by the NHCP, NCCA, universities and the Official Gazette.
- **Tier 3, reputable journalism and essays:** Signed articles in national newspapers, mainly columns by historian Ambeth Ocampo. Use these to find facts and context, then confirm the fact in Tier 1 or 2.
- A stop can be `verified` only with **two sources, at least one from Tier 1 or Tier 2**, with page numbers for books.
- **Do not cite** Scribd, SlideShare, Prezi, Course Hero, Brainly, unsigned blogs, or AI-written summaries. Use Wikipedia only to find the real source behind a claim, never as the source itself.
- When sources disagree, follow §6.4 and record the disagreement in §14.4 and in the stop's `verifyNotes`.

### 14.2 Bibliography

**Tier 1 — Primary sources (Rizal's own writings)**

| sourceId | Citation | Use it for | Where to read |
|---|---|---|---|
| `epistolario` | Rizal, José. *Epistolario Rizalino.* Compiled and edited by Teodoro M. Kalaw. 5 vols. in 6 books. Manila: Bureau of Printing, 1930–1938. (Documentos de la Biblioteca Nacional de Filipinas.) | All dated events, from Rizal's letters (in Spanish) | National Library of the Philippines; Filipinas Heritage Library (rare books) |
| `rizal-blumentritt` | *The Rizal–Blumentritt Correspondence.* Manila: José Rizal National Centennial Commission, 1961. (Writings of José Rizal, vol. 2.) Reprinted Manila: National Historical Institute, 1992. | Berlin 1887, Leitmeritz 1887, Dapitan (letter of 19 Dec 1893 on his three houses) | University and public libraries in the Philippines |
| `reminiscences` | *Reminiscences and Travels of José Rizal.* Translated by Encarnación Alzona. Manila: José Rizal National Centennial Commission, 1961. Later editions: National Historical Institute, 1977; National Historical Commission of the Philippines, 2011. | Childhood, school years, travels (Rizal's diaries and memoirs in English) | Philippine libraries |
| `memorias` | Rizal, José. *Memorias de un estudiante de Manila* (his school memoir covering 1861–1881). Manila, 1949 edition; the original manuscript is kept in the Filipiniana Division of the National Library. | Calamba, Biñan, Ateneo, UST; his mother's teaching | Filipinas Heritage Library; English version inside `reminiscences` |
| `own-story` | Rizal, José. *Rizal's Own Story of His Life.* Edited by Austin Craig. Manila: National Book Company, 1918. | Childhood and school years in Rizal's own words (English) | Project Gutenberg eBook #48438: https://www.gutenberg.org/ebooks/48438 |
| `noli` | Rizal, José. *Noli Me Tangere.* Berlin: Berliner Buchdruckerei-Actien-Gesellschaft, 1887. English: *The Social Cancer*, translated by Charles Derbyshire. Manila: Philippine Education Company, 1912. | The novel itself (Berlin stop, items) | Project Gutenberg eBook #6737: https://www.gutenberg.org/ebooks/6737 |
| `fili` | Rizal, José. *El Filibusterismo.* Gent: Boekdrukkerij F. Meyer-Van Loo, Vlaanderenstraat 66, 1891. English: *The Reign of Greed*, translated by Charles Derbyshire. Manila: Philippine Education Company, 1912. | The novel itself (Ghent stop, items) | Spanish: Project Gutenberg #30903 (https://www.gutenberg.org/ebooks/30903). English: Project Gutenberg #10676 (https://www.gutenberg.org/ebooks/10676) |
| `morga-1890` | Morga, Antonio de. *Sucesos de las Islas Filipinas … nuevamente sacada á luz y anotada por José Rizal y precedida de un prólogo del Prof. Fernando Blumentritt.* Paris: Librería de Garnier Hermanos, 1890. | London 1888 and Paris 1889 stops | University of Michigan digitized copy: https://name.umdl.umich.edu/ahz9387.0001.001 |
| `ra-1425` | Republic Act No. 1425 (Rizal Law), approved 12 June 1956. *Official Gazette* vol. 52, no. 6, p. 2971. | Why the course exists (intro and credits text, not stop facts) | Senate Legislative Reference: https://ldr.senate.gov.ph/legislative%2Bissuances/Republic%20Act%20No.%201425 · Supreme Court E-Library: https://elibrary.judiciary.gov.ph/thebookshelf/showdocs/2/14242 |

**Tier 2 — Scholarly biographies**

| sourceId | Citation | Use it for | Where to read |
|---|---|---|---|
| `guerrero` | Guerrero, León Ma. *The First Filipino: A Biography of José Rizal.* Introduction by Carlos Quirino. Manila: National Heroes Commission, 1963. xxiii, 549 pp. Later editions: Guerrero Publishing, 2007 and 2010. (First prize, Rizal Biography Contest, José Rizal National Centennial Commission, 1961.) | Main narrative for every stop | Most Philippine university libraries; in print from Guerrero Publishing |
| `zaide` | Zaide, Gregorio F., and Sonia M. Zaide. *José Rizal: Life, Works and Writings of a Genius, Writer, Scientist and National Hero.* 2nd ed. Quezon City: All-Nations Publishing, 1999 (reprinted 2006, 2008). | Dates, places and names for every stop; the standard course textbook | Widely available; check which printing you use and cite it |
| `coates` | Coates, Austin. *Rizal: Philippine Nationalist and Martyr.* Hong Kong: Oxford University Press, 1968. 378 pp. | Europe and Hong Kong years; second opinion on dates | Philippine university libraries |
| `retana` | Retana, W. E. *Vida y escritos del Dr. José Rizal.* Prologue by Javier Gómez de la Serna; epilogue by Miguel de Unamuno. Madrid: Librería General de Victoriano Suárez, 1907. 512 pp. | Early documents (Spanish); first full biography | HathiTrust page images (listed by The Online Books Page, University of Pennsylvania) |
| `palma` | Palma, Rafael. *The Pride of the Malay Race: A Biography of José Rizal.* Translated by Roman Ozaeta. New York: Prentice-Hall, 1949. | Second opinion on dates and events | Philippine university libraries |
| `craig-1913` | Craig, Austin. *Lineage, Life and Labors of José Rizal, Philippine Patriot.* Introduction by James Alexander Robertson. Manila, 1913. | Family background, Calamba, early photographs | Project Gutenberg eBook #6867: https://www.gutenberg.org/ebooks/6867 |
| `russell-rodriguez` | Russell, Charles Edward, and E. B. Rodriguez. *The Hero of the Filipinos: The Story of José Rizal, Poet, Patriot and Martyr.* New York: The Century Co., 1923. | Readable overview; period photographs | Project Gutenberg eBook #73848: https://www.gutenberg.org/ebooks/73848 |
| `ocampo-overcoat` | Ocampo, Ambeth R. *Rizal Without the Overcoat.* Pasig: Anvil Publishing, 1990 (expanded editions 2000, 2012, 2018, 2022). | Myths versus facts; everyday details (1990 National Book Award for the essay) | In print from Anvil Publishing |
| `hu-berlin-2011` | Houben, Vincent, Ambeth Ocampo, and Bernhard Dahm. *José Rizal, Connecting the Philippines and Germany: An Overview of a Symposium Held in Berlin on 14 June 2011.* Southeast Asian Studies Working Paper No. 45. Berlin: Humboldt-Universität zu Berlin. | Rizal in Germany (Heidelberg, Wilhelmsfeld, Berlin); the annotated Morga | https://www.iaaw.hu-berlin.de (Working Papers, Southeast Asia) |
| `guillermo-2009` | Guillermo, Ramon. Translation and Revolution: A Study of Jose Rizal's Guillermo Tell. Quezon City: Ateneo de Manila University Press, 2009. | Leipzig 1886: when and where the Tagalog Wilhelm Tell was made | Philippine university libraries; Ateneo de Manila University Press |

**Tier 2 — Official and institutional sources**

| sourceId | Citation | Use it for | Link |
|---|---|---|---|
| `nhcp-viola` | Palafox, Quennie Ann J. "Dr. Maximo S. Viola: The Man Who First Read the Noli Me Tangere." National Historical Commission of the Philippines. | Berlin 1887: Viola paid for the printing; 2,000 copies in 1887; the May–June 1887 tour | http://nhcp.gov.ph/dr-maximo-s-viola-the-man-who-first-read-the-noli-me-tangere/ |
| `ncca-revolution` | Guerrero, Milagros C., Emmanuel N. Encarnacion, and Ramon N. Villegas. Article on the 1896 Revolution and the Katipunan. National Commission for Culture and the Arts, 16 June 2003. | La Liga Filipina (3 July 1892, house of Doroteo Ongjunco, Ilaya St., Tondo); arrest on 6 July 1892; exile to Dapitan | https://ncca.gov.ph/?p=1766 |
| `nhcp-dapitan-1973` | *The Rizal Shrine at Dapitan City.* Manila: National Historical Commission, 1973. | Dapitan houses, school, clinic, water system | Filipinas Heritage Library |
| `nhi-dapitan-1993` | *The Rizal Shrine–Dapitan, Dapitan City, Zamboanga del Norte.* Manila: National Historical Institute, c1993. | Same as above (later guide) | Filipinas Heritage Library |
| `ucm-paraninfo` | Universidad Complutense de Madrid. "Paraninfo de la Universidad Complutense de Madrid." | Madrid 1882: the old Universidad Central at Calle de San Bernardo 49 and its classical façade | https://www.ucm.es/cultura/paraninfo-de-la-universidad-complutense-de |
| `ucm-relaciones` | Universidad Complutense de Madrid. "Escuela Profesional de Relaciones Laborales" (history of the San Bernardo building). | Madrid scene: university rooms around two former cloisters on San Bernardo | https://www.ucm.es/cultura/escuela-profesional-de-relaciones-laborales |
| `fhl-ateneo` | Filipinas Heritage Library. Photograph records "Ateneo de Manila," call nos. AR00479, AR00516 and AR00707 (main entrance), Intramuros. | Intramuros 1872 scene; the school on Calle del Arzobispo | https://www.filipinaslibrary.org.ph/biblio/2626 · /biblio/2663 · /biblio/2854 |
| `eh-plaque` | English Heritage. "RIZAL, Dr José (1861–1896)." Blue Plaques (plaque erected 1983 by the Greater London Council, 37 Chalcot Crescent). | London 1888–89: lodging with the Beckett family; research at the British Museum | https://www.english-heritage.org.uk/visit/blue-plaques/jose-rizal/ |
| `wilhelmsfeld-flyer` | Gemeinde Wilhelmsfeld. "Dr. José Rizal in Heidelberg and Wilhelmsfeld" (English visitor flyer). | Wilhelmsfeld 1886: the stay with Pastor Ullmer; local memorials | https://www.wilhelmsfeld.de/fileadmin/Dateien/Dateien/Publisher-Flyer-EN-final_englisch.pdf |
| `hk-plaque` | Presidential Communications (RTVM). "Hong Kong SAR, People's Republic of China" — text of the Hong Kong government plaque at 5 D'Aguilar Street, 9 April 2018. | Hong Kong 1891–92: clinic at 5 D'Aguilar Street | https://rtvm.gov.ph/?p=53074 |
| `intramuros-ultimo` | Intramuros Administration. Rizal Shrine, Fort Santiago — exhibit text on the alcohol stove and Mi Último Adiós. | Fort Santiago 1896: the alcohol stove that hid the poem | https://intramuros.gov.ph/mnr/ |
| `intramuros-execution` | Intramuros Administration. Rizal Shrine, Fort Santiago — exhibit text on Rizal's last day. | Bagumbayan 1896: time of the execution (about 7:03 a.m.) | https://intramuros.gov.ph/?p=7130 |
| `filipinas-last-hours` | Filipinas Heritage Library. "Rizal's Last Hours." | Fort Santiago and Bagumbayan 1896: trial 26 Dec; moved to the death cell 29 Dec; the poem | https://www.filipinaslibrary.org.ph/?p=1341 |

**Tier 3 — Reputable journalism and essays**

| sourceId | Citation | Use it for | Link |
|---|---|---|---|
| `ocampo-conversation` | Ocampo, Ambeth R. "Conversation with Rizal." *Philippine Daily Inquirer*, Looking Back column. | Why the Calamba house was painted green (from "ricial") | https://opinion.inquirer.net/54859/conversation-with-rizal |
| `philstar-chartreuse` | "The New Chartreuse House." *The Philippine Star*, 30 May 2009. | Date of the green repaint; the NHI's reason | https://www.philstar.com/lifestyle/modern-living/2009/05/30/472292/new-chartreuse-house |
| `ocampo-letters` | Ocampo, Ambeth R. "The Letters of a 'Conscious Hero'." *Philippine Daily Inquirer*. | How Rizal's letters were published (Epistolario 1930–1938; 1961 Centennial volumes) | https://opinion.inquirer.net/103694/letters-conscious-hero |
| `ocampo-binan` | Ocampo, Ambeth R. "'Tears in Biñan'." *Philippine Daily Inquirer*. | Biñan 1869: Rizal's memories of school there | https://opinion.inquirer.net/60425/tears-in-binan |
| `ocampo-agrarian` | Ocampo, Ambeth R. "Rizal's Agrarian Dispute." *Philippine Daily Inquirer*. | Calamba 1887: the land dispute | https://opinion.inquirer.net/54539/rizals-agrarian-dispute |
| `ocampo-brook` | Ocampo, Ambeth R. "The Murmur of a Brook in Dapitan." *Philippine Daily Inquirer*. | Dapitan: lottery, Talisay land, the letter describing his three houses | https://opinion.inquirer.net/?p=105560 |
| `inq-retracing` | "Retracing Rizal's Steps." *Inquirer Business*. | Calamba house shops; Dapitan (Casa Real, Talisay, reservoir, school, clinic) | https://business.inquirer.net/272607/retracing-rizals-steps |
| `inq-viola` | Quodala, Schatzi. "Did You Know: Maximo Viola." *Philippine Daily Inquirer*, 22 Oct 2013. | Viola's ₱300 loan; 2,000 copies | https://newsinfo.inquirer.net/511565/did-you-know-maximo-viola |
| `inq-ateneo` | "Did You Know: Ateneo Municipal de Manila." *Philippine Daily Inquirer*. | Ateneo founding (1865) and first site in Intramuros | https://newsinfo.inquirer.net/544173/did-you-know-ateneo-municipal-de-manila |
| `inq-scholars` | Hidalgo, Vanessa B. "Scholars of the Past, Torchbearers of the Future." *Inquirer Business*. | First Ateneo building at the corner of Arzobispo and Anda streets | https://business.inquirer.net/?p=216703 |
| `inq-liga` | Medina, Marielle. "Did You Know: Rizal Founded La Liga Filipina." *Philippine Daily Inquirer*, 3 July 2018. | La Liga date and place | https://newsinfo.inquirer.net/1006343/did-you-know-604 |
| `inq-fili-first` | *Inquirer Plus* feature on the first edition of *El Filibusterismo* (Ghent, 1891). | Ghent 1891: Meyer-Van Loo on Vlaanderenstraat; Valentin Ventura's help | https://plus.inquirer.net/?p=374601 |
| `mb-morga` | "Rizal Annotates Antonio de Morga." *Manila Bulletin*, 18 March 2021. | London 1888: research in the British Museum; Paris 1890 edition | https://mb.com.ph/2021/3/18/rizal-annotates-antonio-de-morga |
| `rappler-talisay` | *Rappler*, article on Rizal's Talisay estate in Dapitan (protected landscape). | Arrival in Dapitan on 17 July 1892; Talisay land bought for ₱4,000 | https://www.rappler.com/?p=1552163 |
| `uoft-noli` | University of Toronto Libraries, Spatial Humanities exhibit "José Rizal's Noli Me Tangere." | Pointer to Guerrero's account of the printing (it cites Guerrero, pp. 148–149; confirm the edition) | https://spatial-humanities.library.utoronto.ca/exhibits/show/jose-rizal---s-noli-me-tangere/technology |
| `mb-barcelona` | "A Walk to Greatness." Manila Bulletin, 5 January 2022. | Barcelona 1882: arrival on 16 June 1882 and the Fonda de España (today Hotel España) | https://mb.com.ph/2022/1/5/a-walk-to-greatness |
| `inq-why-return` | "Why Did Dr. Jose Rizal Return to the Philippines?" Inquirer Global Nation. | Paris and Heidelberg training; return in 1887 and his mother's cataract | https://globalnation.inquirer.net/?p=114720 |
| `inq-heidelberg` | "Heidelberg Still Celebrates Jose Rizal's Birthday." Lifestyle.INQ, Philippine Daily Inquirer. | Heidelberg 1886: lectures under Becker and Kuehne | https://lifestyle.inquirer.net/?p=3928 |
| `inq-wilhelmsfeld` | Ocampo, Ambeth R. "Rizal in Wilhelmsfeld." Philippine Daily Inquirer, Looking Back column. | Heidelberg and Wilhelmsfeld 1886; why he could attend without enrolling | https://opinion.inquirer.net/?p=101681 |
| `mb-litomerice` | "Eating Adobo in Litoměřice." Manila Bulletin, 11 June 2021. | Leitmeritz 1887: visit of 13–17 May; the Blumentritt family at the station | https://mb.com.ph/2021/06/11/eating-adobo-in-litomerice |
| `inq-litomerice` | "Rizal and His 'BFF': My Finds in Czechoslovakia." Lifestyle.INQ, Philippine Daily Inquirer. | Leitmeritz 1887: Rizal and Viola's signatures in the city memorial book, 16 May 1887 | https://lifestyle.inquirer.net/?p=261765 |
| `ocampo-japan` | Ocampo, Ambeth R. "Rizal in Japan." Philippine Daily Inquirer, Looking Back column. | Japan 1888: impressions of Japan; Usui Seiko | https://opinion.inquirer.net/102447/rizal-in-japan |
| `ocampo-us` | Ocampo, Ambeth R. "Rizal: Unimpressed by the US." Philippine Daily Inquirer, Looking Back column. | USA 1888: route and dates from his diary (28 Apr–16 May 1888) | https://opinion.inquirer.net/?p=140435 |
| `inq-quarantine` | "Rizal's Experience with Quarantine, 1888." Philippine Daily Inquirer, Opinion. | USA 1888: the quarantine in San Francisco Bay | https://opinion.inquirer.net/?p=127176 |
| `foundsf-sobredo` | Sobredo, James. "José Rizal's Quarantine and the Nightmare of Imperialism." FoundSF (excerpted from Reclaiming San Francisco, City Lights). | USA 1888: Rizal's letter on the quarantine and the Palace Hotel | https://foundsf.org/Jos%C3%A9_Rizal%27s_Quarantine_and_the_Nightmare_of_Imperialism |
| `gma-paris` | "Who Called Jose Rizal 'Little Bad Boy'?" GMA News Online, special feature. | Paris 1889: the Kidlat Club and the Buffalo Bill show at the Exposition | https://gmanetwork.com/news/specials/content/32/who-called-jose-rizal-little-bad-boy |
| `inq-belgium` | Ocampo, Ambeth R. "Rizal in Belgium." Philippine Daily Inquirer, Looking Back column. | Brussels 1890: why he left Paris; writing the Fili | https://opinion.inquirer.net/181719/rizal-in-belgium |
| `scmp-rednaxela` | "Stories Behind Hong Kong Street Names: Rednaxela Terrace and Its Famous Resident." South China Morning Post. | Hong Kong 1891–92: home at 2 Rednaxela Terrace, Dec 1891–June 1892 | https://www.scmp.com/lifestyle/travel-leisure/article/1987092/stories-behind-hong-kong-street-names-rednaxela-terrace-and |

**Art references (for drawing scenes, not for facts)**

| sourceId | What | Link |
|---|---|---|
| `fhl-ateneo` | Period photographs of the Ateneo in Intramuros (above) | Filipinas Heritage Library |
| `craig-1913` | Plate "Birthplace of José Rizal, from a photograph," portraits | Project Gutenberg #6867 |
| `russell-rodriguez` | Plates of the Calamba house, the Ateneo, the original *Noli* cover | Project Gutenberg #73848 |
| `morga-1890` | 1890 title page and typography (Paris stop props) | University of Michigan scan |

### 14.3 Which sources to check for each stop

| # | Stop | Check against | Already confirmed in a credible source |
|---|---|---|---|
| 1 | calamba-1861 | `memorias`, `reminiscences`, `own-story`, `guerrero`, `zaide`, `craig-1913`, `russell-rodriguez` | House type and shop openings (`inq-retracing`); the reconstruction and green repaint (`ocampo-conversation`, `philstar-chartreuse`) |
| 2 | binan-1869 | `memorias`, `reminiscences`, `own-story`, `ocampo-binan`, `guerrero`, `zaide`, `craig-1913`, `russell-rodriguez` | His school memories of Biñan (`ocampo-binan`); teacher, Paciano, painter Carrera (`craig-1913` ch. IV, `russell-rodriguez` ch. II) |
| 3 | ateneo-1872 | `memorias`, `guerrero`, `zaide`, `fhl-ateneo`, `craig-1913`, `russell-rodriguez` | School on Calle del Arzobispo, corner of Anda (`fhl-ateneo`, `inq-scholars`); renamed Ateneo Municipal in 1865 (`inq-ateneo`) |
| 4 | ust-1877 | `memorias`, `own-story`, `guerrero`, `zaide`, `craig-1913`, `russell-rodriguez` | Entered UST after his bachelor's degree (`craig-1913` ch. V); the 1879 Liceo prize poem |
| 5 | barcelona-1882 | `reminiscences`, `epistolario`, `mb-barcelona`, `guerrero`, `zaide`, `craig-1913`, `russell-rodriguez` | Arrived 16 June 1882; Fonda de España (`mb-barcelona`) |
| 6 | madrid-1882 | `reminiscences`, `epistolario`, `guerrero`, `zaide`, `ucm-paraninfo`, `craig-1913`, `russell-rodriguez` | The Universidad Central building on Calle de San Bernardo 49 (`ucm-paraninfo`, `ucm-relaciones`) |
| 7 | paris-1885 | `epistolario`, `guerrero`, `coates`, `inq-why-return`, `craig-1913`, `russell-rodriguez` | Trained in Paris under de Wecker (`craig-1913` ch. VI; `inq-why-return`) |
| 8 | heidelberg-1886 | `rizal-blumentritt`, `guerrero`, `hu-berlin-2011`, `inq-heidelberg`, `wilhelmsfeld-flyer`, `craig-1913`, `russell-rodriguez` | Becker's eye clinic and lectures (`inq-heidelberg`, `wilhelmsfeld-flyer`); first letter to Blumentritt, Heidelberg, 31 July 1886 (`rizal-blumentritt`, letter 1) |
| 9 | wilhelmsfeld-1886 | `guerrero`, `hu-berlin-2011`, `inq-wilhelmsfeld`, `wilhelmsfeld-flyer`, `zaide`, `craig-1913` | Finished the *Noli* in Wilhelmsfeld (`hu-berlin-2011`, `inq-wilhelmsfeld`, `wilhelmsfeld-flyer`) |
| 10 | leipzig-1886 | `rizal-blumentritt`, `guerrero`, `zaide`, `guillermo-2009`, `craig-1913`, `russell-rodriguez` | Leipzig in 1886 (`russell-rodriguez` ch. IV); Tell translation dated 1886 (`guillermo-2009`) |
| 11 | berlin-1887 | `rizal-blumentritt`, `noli`, `guerrero`, `zaide`, `nhcp-viola`, `craig-1913`, `russell-rodriguez` | Viola paid for the printing; 2,000 copies in 1887 (`nhcp-viola`, `inq-viola`); ₱300 loan (`inq-viola`) |
| 12 | leitmeritz-1887 | `rizal-blumentritt`, `nhcp-viola`, `mb-litomerice`, `inq-litomerice`, `guerrero`, `craig-1913`, `russell-rodriguez` | Visit 13–17 May 1887; family at the station (`mb-litomerice`); memorial book signed 16 May 1887 (`inq-litomerice`); tour with Viola (`nhcp-viola`) |
| 13 | calamba-1887 | `epistolario`, `guerrero`, `ocampo-agrarian`, `inq-why-return`, `zaide`, `craig-1913`, `russell-rodriguez` | Return and his mother's eyes (`inq-why-return`); bodyguard and Terrero (`russell-rodriguez` ch. VII); land dispute (`ocampo-agrarian`) |
| 14 | japan-1888 | `reminiscences`, `ocampo-japan`, `guerrero`, `coates`, `craig-1913`, `russell-rodriguez` | Six weeks in Japan; Usui Seiko (`ocampo-japan`) |
| 15 | usa-1888 | `reminiscences`, `ocampo-us`, `inq-quarantine`, `foundsf-sobredo`, `guerrero`, `craig-1913`, `russell-rodriguez` | Dates and route, 28 Apr–16 May 1888 (`ocampo-us`); quarantine (`inq-quarantine`, `foundsf-sobredo`) |
| 16 | london-1888 | `morga-1890`, `rizal-blumentritt`, `eh-plaque`, `mb-morga`, `guerrero`, `craig-1913`, `russell-rodriguez` | Research for the Morga at the British Museum (`mb-morga`); Beckett family, 37 Chalcot Crescent (`eh-plaque`) |
| 17 | paris-1889 | `morga-1890`, `guerrero`, `hu-berlin-2011`, `zaide`, `gma-paris`, `craig-1913`, `russell-rodriguez` | Morga edition: Paris, Garnier Hermanos, 1890 (`morga-1890`); Kidlat Club and Buffalo Bill show (`gma-paris`) |
| 18 | brussels-1890 | `epistolario`, `guerrero`, `zaide`, `inq-belgium`, `craig-1913`, `russell-rodriguez` | Moved to Brussels to write the *Fili* (`inq-belgium`); the indolence essay (`russell-rodriguez` ch. X) |
| 19 | biarritz-1891 | `epistolario`, `rizal-blumentritt`, `guerrero`, `zaide`, `craig-1913` | — (all from `epistolario`, `rizal-blumentritt`, `guerrero`, `zaide`; check the 29 March 1891 letter) |
| 20 | ghent-1891 | `fili`, `guerrero`, `zaide`, `inq-fili-first`, `craig-1913`, `russell-rodriguez` | Printer F. Meyer-Van Loo, Vlaanderenstraat 66, Ghent, 1891 (`fili`); Valentin Ventura's help (`inq-fili-first`) |
| 21 | hongkong-1891 | `epistolario`, `guerrero`, `coates`, `hk-plaque`, `scmp-rednaxela`, `craig-1913`, `russell-rodriguez` | Clinic at 5 D'Aguilar Street (`hk-plaque`); home at 2 Rednaxela Terrace, Dec 1891–June 1892 (`scmp-rednaxela`); Borneo plan (`russell-rodriguez` ch. XIII) |
| 22 | manila-1892 | `ncca-revolution`, `inq-liga`, `guerrero`, `zaide`, `craig-1913`, `russell-rodriguez` | Founded 3 July 1892 in Doroteo Ongjunco's house, Ilaya St., Tondo; Rizal arrested 6 July 1892 (`ncca-revolution`) |
| 23 | dapitan-1892 | `rizal-blumentritt`, `nhcp-dapitan-1973`, `guerrero`, `zaide`, `craig-1913`, `russell-rodriguez` | Arrival 17 July 1892 and Talisay land for ₱4,000 (`rappler-talisay`); three houses of bamboo, wood and nipa (`ocampo-brook`); reservoir, school and clinic (`inq-retracing`) |
| 24 | fortsantiago-1896 | `guerrero`, `zaide`, `coates`, `intramuros-ultimo`, `filipinas-last-hours`, `craig-1913`, `russell-rodriguez` | Trial 26 Dec; death cell 29 Dec; poem in the alcohol stove (`filipinas-last-hours`, `intramuros-ultimo`) |
| 25 | bagumbayan-1896 | `guerrero`, `zaide`, `coates`, `intramuros-execution`, `filipinas-last-hours`, `craig-1913`, `russell-rodriguez` | Execution at about 7:03 a.m. on 30 Dec 1896 (`intramuros-execution`) |

### 14.3b Chapters in the online biographies
Both books are free on Project Gutenberg. Page numbers differ between editions, so cite the chapter.

| Stop | Craig, *Lineage, Life and Labors* (1913) — gutenberg.org/ebooks/6867 | Russell & Rodriguez, *The Hero of the Filipinos* (1923) — gutenberg.org/ebooks/73848 |
|---|---|---|
| calamba-1861 | ch. IV, "Rizal's Early Childhood" | ch. II, "School-Days and First Impressions" |
| binan-1869 | ch. IV, "Rizal's Early Childhood" | ch. II, "School-Days and First Impressions" |
| ateneo-1872 | ch. V, "Jagor's Prophecy" | ch. III, "First Contacts with the Enemy" |
| ust-1877 | ch. V, "Jagor's Prophecy" | ch. III, "First Contacts with the Enemy" |
| barcelona-1882 | ch. VI, "The Period of Preparation" | ch. IV, "Voices of Prophecy" |
| madrid-1882 | ch. VI, "The Period of Preparation" | ch. IV, "Voices of Prophecy" |
| paris-1885 | ch. VI, "The Period of Preparation" | ch. IV, "Voices of Prophecy" |
| heidelberg-1886 | ch. VI, "The Period of Preparation" | ch. IV, "Voices of Prophecy" |
| wilhelmsfeld-1886 | ch. VI, "The Period of Preparation" | — |
| leipzig-1886 | ch. VI, "The Period of Preparation" | ch. IV, "Voices of Prophecy" |
| berlin-1887 | ch. VI, "The Period of Preparation" | ch. VII, "Again in the Philippines" |
| leitmeritz-1887 | ch. VI, "The Period of Preparation" | ch. VII, "Again in the Philippines" |
| calamba-1887 | ch. VII, "The Period of Propaganda" | ch. VII, "Again in the Philippines" |
| japan-1888 | ch. VII, "The Period of Propaganda" | ch. VII, "Again in the Philippines" |
| usa-1888 | ch. VII, "The Period of Propaganda" | ch. VII, "Again in the Philippines" |
| london-1888 | ch. VII, "The Period of Propaganda" | ch. VII, "Again in the Philippines" |
| paris-1889 | ch. VII, "The Period of Propaganda" | ch. VII (Paris, Juan Luna) and ch. X (the 1889 Exposition) |
| brussels-1890 | ch. VII, "The Period of Propaganda" | ch. X, "Filipino Indolence" |
| biarritz-1891 | ch. VII, "The Period of Propaganda" | — |
| ghent-1891 | ch. VII, "The Period of Propaganda" | ch. VIII, "The Grapes of Wrath"; ch. XIII, "The Safe-Conduct" |
| hongkong-1891 | ch. VIII, "Despujol's Duplicity" | ch. XIII, "The Safe-Conduct" |
| manila-1892 | chs. VIII–IX, "Despujol's Duplicity" and "The Deportation to Dapitan" | ch. XIII (La Liga) and ch. XIV (arrest) |
| dapitan-1892 | ch. IX, "The Deportation to Dapitan" | ch. XIV, "The Exile of Dapitan" |
| fortsantiago-1896 | ch. X, "Consummatum Est"; ch. XI (the poem found) | ch. XV, "The Katipunan"; ch. XVI, "I Came from Martyrdom unto this Peace" |
| bagumbayan-1896 | ch. X, "Consummatum Est" | ch. XVI, "I Came from Martyrdom unto this Peace" |

Rizal's own childhood memoir (`own-story`, Project Gutenberg #48438) covers Calamba and Biñan in the section "My Boyhood" (chapters I–III, which he wrote in 1878).

### 14.4 Disagreements found so far
| Topic | What sources say | What to do |
|---|---|---|
| Day the *Noli* came off the press | Course summaries give 21, 27 or 29 March 1887. Several say a copy went to Blumentritt with a letter dated 21 March 1887 (not yet checked in the letter itself). | Check the 21 March letter in `rizal-blumentritt` and Guerrero's account. Until then, the game says "March 1887". |
| Arrest date, 1892 | The NCCA gives 6 July 1892; some summaries give 7 July (the day his deportation was ordered). | Use 6 July for the arrest and say "days later" for the deportation, as the seed text already does. |
| Calamba house color | Today's green dates from the 2009 repaint (`philstar-chartreuse`); Ocampo dates the decision to 2008 (`ocampo-conversation`). | Do not use green for the 1860s scene. The original color is still an open question (§13). |
| When Viola reached Berlin | December 1886 appears only in an auction-house note (not a credible source). | Confirm in `guerrero` or `zaide` before writing a month. |
| When Rizal left Biñan | Zaide gives Saturday 17 December 1870 (17 Dec 1870 was a Saturday); a Manila Bulletin feature gives 1871; Ocampo says 1870. | Use "late 1870" (as the seed does) until `memorias` is checked. |
| Date of "A las flores de Heidelberg" | Most textbooks give 22 April 1886; some give 12 April. | Say "spring 1886" in the game; confirm the date on the manuscript or in `reminiscences`. |
| Where the Tagalog *Wilhelm Tell* was made | Course summaries put it in Leipzig; others link it to Heidelberg and Wilhelmsfeld; Guillermo dates it to 1886. | The seed says he "worked on" it in Leipzig and that historians disagree. Check `guillermo-2009`. |
| Leaving Leitmeritz | 16 May (some summaries) or 17 May 1887 (Manila Bulletin: visit 13–17 May). | The seed says "four days" and gives only the arrival and the memorial-book dates. |
| Mother's cataract operation | Some accounts say he operated in Calamba in 1887; others say the cataracts were not yet "ripe" and he only treated her; Zaide says he operated on her left eye in Hong Kong. | The seed says he *treated* her in 1887 and *operated* in Hong Kong. Confirm in `epistolario`. |
| Length of the 1888 quarantine | Six days (Inquirer Global Nation, Ocampo webinar) or seven days (Sobredo). | The seed says he landed on 4 May (both agree) and does not give a number. |
| Where the *Fili* was finished | Biarritz, 29 March 1891 (Rizal's letter to Blumentritt, per Zaide); Ocampo says he finished the clean copy in Brussels in April 1891. | The seed says he finished the *manuscript* in Biarritz. Add Ocampo's point to Read more after checking. |
| Who took *Mi Último Adiós* out of the stove | Most sources: his sister Trinidad carried the stove home and the family found the poem. Craig (1913, ch. XI) mentions a Dapitan schoolboy. | The seed names only Trinidad and "the family". |
| Arrival in Hong Kong | Evening of 19 November 1891 (chronologies) or 20 November. | The seed uses 20 November; confirm in `epistolario`. |
| Names of the Ateneo "empires" (v2.3) | Rizal's memoir (Craig's 1918 translation) says Romans and Greeks; Zaide and most textbooks say Romans and Carthaginians. | The story names both and uses the difference in a source question. |
| Prize for *El consejo de los dioses* (1880) (v2.3) | Russell & Rodriguez: taken from him once the judges learned he was Filipino; Zaide: he received it, amid Spanish resentment. | The story gives both accounts. |
| Year of the Liceo poetry prize (v2.3) | Most sources 1879; Craig (1913) 1877. | Use 1879. |
| Age when sent to Biñan (v2.3) | Rizal's memoir: nine; the usual date (June 1869) makes him about eight. | The story gives the year only. |
| Where *El Filibusterismo* was begun (v2.3) | Craig: Calamba, October 1887. Some summaries: London, 1888. | The story follows Craig; confirm in `epistolario`. |
| Date in the *Fili* dedication (v2.3) | The printed dedication says the three priests were executed on 28 February 1872; the execution was on 17 February. | The Ghent stop teaches this as a source slip (spot-the-error question). |
| Who carried the stove home (v2.3) | Most sources: Trinidad. Craig (1913, ch. XI): a Dapitan schoolboy brought it to the family. | The story says the family found the poem at home. |

### 14.5 What still needs a person
- Page numbers for every book citation (the books are print-only).
- Reading the Spanish originals (`epistolario`, `retana`, `memorias`) for any quote used in the game. Quote a published English translation where one exists, and cite it.
- Confirming which edition of Guerrero and of Zaide the team uses, and citing that one.
- Reading each stop's `verifyNotes` (2–4 per stop) and deciding each one; then removing the note and setting `status: "verified"`.
- Deciding on the dramatized dialogue lines: they are marked `dramatized: true`, but a teacher should agree that each one is fair to the record.

---

*End of SRS.*
