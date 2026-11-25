# Lakbay Rizal

A pixel-art web game about José Rizal's life (1861–1896). Players follow him stop by stop across the Philippines, Asia, Europe and America: each stop has a scene, a short dialogue, a two-question quiz and a passport stamp. One stop, Dapitan, has a small town-builder game.

It is a static site: no server, no accounts, no tracking. Progress is saved in the player's browser, and after one visit the game works offline.

The full requirements are in [SRS.md](SRS.md). Judgment calls made while building are in [docs/DECISIONS.md](docs/DECISIONS.md); content still to write or check is in [docs/CONTENT_TODO.md](docs/CONTENT_TODO.md).

---

## Quick start

You need **Node.js 22 or newer**.

```bash
npm install
npx playwright install chromium   # once, for the browser tests and Lighthouse
npm run dev                       # http://localhost:5173
```

In development every stop is shown, including drafts.

## Everyday commands

| Command                    | What it does                                                                                                                                                                 |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run dev`              | Local site with live reload.                                                                                                                                                 |
| `npm run lint`             | ESLint (including accessibility rules) and Prettier check. `npm run format` fixes formatting.                                                                                |
| `npm run typecheck`        | TypeScript, strict.                                                                                                                                                          |
| `npm test`                 | Unit tests (Vitest). Checks the content first.                                                                                                                               |
| `npm run build`            | Production build in `dist/`. Checks the content first. Shows **verified stops only**.                                                                                        |
| `npm run build:drafts`     | Production build that also shows draft stops (classroom testing, previews).                                                                                                  |
| `npm run preview`          | Serves `dist/` at http://localhost:4173.                                                                                                                                     |
| `npm run test:e2e`         | Browser tests (Playwright) at 1440 px and 360 px, including the SRS §12 journey, accessibility scans, offline play and every stop played end to end. Builds the site itself. |
| `npm run validate-content` | Checks `public/content/*.json` (including content v3 and the Filipino files) and every image it points to.                                                                   |
| `npm run i18n-missing`     | Lists the UI strings that have no Filipino yet (they show in English).                                                                                                       |
| `npm run lighthouse [url]` | Lighthouse Performance + Accessibility, mobile and desktop, median of 3 runs. Start a server first (`npm run build:drafts && npm run preview`). Reports go to `lighthouse/`. |

Before you commit, run the same checks as CI:

```bash
npm run lint && npm run typecheck && npm test && npm run build
```

## Where things are

```
public/content/      the game's text and data — edit these (see below)
assets/              all pixel art (source of truth; copied to public/assets/ on dev/build)
art-tools/           Python scripts that drew the art; use them for new scenes (SRS §7.9)
content/             the original seed the content was converted from (keep for reference)
reference/mockup/    the approved screen designs
src/                 the React app
  app/               routes, layout, loading/error/404 screens
  components/        reusable pieces (map, pins, dialogue box, passport stamps…)
  features/          one folder per screen (map, stop, quiz, passport, builder…)
  content/           Zod schemas, content checks, loader, selectors
  store/             saved progress (localStorage) and its migrations
  i18n/              every piece of UI text: en.json (English) and fil.json (Filipino)
e2e/                 Playwright tests
scripts/             build helpers (content checks, asset copy, Lighthouse…)
docs/                DECISIONS.md and CONTENT_TODO.md
```

## Editing content

All historical text, dates, quiz questions and coordinates live in **`public/content/`**. No historical text is written in the code, so content changes never need a programmer.

| File                | Holds                                                                                      |
| ------------------- | ------------------------------------------------------------------------------------------ |
| `stops.json`        | The 25 stops: place, story, scene, dialogue, quiz, rewards, sources, status, verify notes. |
| `sources.json`      | The bibliography (SRS §14), referred to by `sourceId`.                                     |
| `characters.json`   | Speakers: name and sprite.                                                                 |
| `items.json`        | Keepsake items: name, one-line description, icon.                                          |
| `regions.json`      | Map images, projection bounds, the Manila inset, the America rail route.                   |
| `builder.json`      | Dapitan builder: start materials, costs and the fact shown for each project.               |
| `guide.json`        | What Rizal says as the guide: the tour, tips and quiz reactions (SRS §3.7).                |
| `gamification.json` | XP, ranks and achievements (SRS §3.8).                                                     |
| `i18n/fil.*.json`   | The Filipino translation of the stops, guide and gamification files (SRS §3.10).           |

After any edit, run **`npm run validate-content`**. It explains every problem with the file, stop and field, for example:

```
ERROR stops.json › berlin-1887 › quiz[0].answer: "e" does not match any option id (a, b, c, d)
```

The build and the tests run the same check, so broken content can never be published.

### From draft to verified

Every stop has a `status`: `outline` → `draft` → `verified`. **The public site shows only `verified` stops.** All 25 stops are `draft` today, so the public site shows "Content coming soon" until the team verifies them.

To verify a stop (SRS §13–§14):

1. Check every date and fact in the stop against **two sources, at least one Tier 1 or Tier 2** (Tier 1 = Rizal's own writings, Tier 2 = scholarly biographies and official bodies).
2. Fill in `pages` for every book in the stop's `sources` (`"pages": "148–149"`).
3. Work through each line in `verifyNotes`, then delete the notes you have resolved. A verified stop must have none left.
4. Check the dialogue: a line may have `recorded` only if its words are quoted from the cited source; every other line is shown as Dramatized and a teacher must approve it.
5. Set `"status": "verified"` and run `npm run validate-content`. It refuses a verified stop that is missing any of the above.

Writing rules (SRS §6.4b): 600–800 words of narration in 4 chapters, plain English, old place name first; at most 4 lines of 25 words or fewer per chapter; 5 quiz questions per stop whose answers are in the chapter text, each with a hint and an explanation; a 100–150-word summary for Read more.

### Filipino

The game has an EN | FIL switch in the top bar and in Settings. A new player gets Filipino if the browser's language is Filipino or Tagalog. Filipino text comes from `public/content/i18n/fil.*.json` (content) and `src/i18n/fil.json` (buttons and labels). Any string that has no Filipino yet shows in English, one string at a time.

The Filipino files are drafts (`"status": "draft"`), so a "Draft translation" badge shows next to the switch. When a fluent teacher has checked a file, set its `"status"` to `"reviewed"`; the badge goes when all three are reviewed. `npm run validate-content` checks that each Filipino stop has the same chapters, paragraphs, lines, facts, questions and choices as the English one.

### Content still missing

See [docs/CONTENT_TODO.md](docs/CONTENT_TODO.md). The game shows `[TO WRITE]` wherever content is missing, for example the scene gallery's "What you see" notes (`scene.notes`, up to three per stop) and the team names on the Credits page.

## Art

- Put new or changed art in **`assets/`** — never in `public/assets/`, which is regenerated on every dev/build run.
- Follow the art bible (SRS §7): scenes 384 × 216, stamp and item icons 26 × 26, scenes 60 KB or less. `validate-content` checks sizes.
- New scenes are drawn with the scripts in `art-tools/` (see `art-tools/README.md`). The app icons come from `python art-tools/app_icons.py`.
- No AI-generated images, stock photos or other games' art.

## Showing drafts: preview and classroom builds

- **Development** (`npm run dev`) always shows drafts.
- **`npm run build:drafts`** (or `INCLUDE_DRAFTS=true npm run build`) makes a full production build that includes drafts. Use it for classroom testing.
- **`?preview=1`** at the end of any page address shows drafts on the public site for that browser tab (`?preview=0` turns it off). Useful for team review without a separate build.

## Deploying

The site is plain static files in `dist/`. Every host needs one rule: **all paths load `index.html`**, so links like `/stop/berlin-1887` work after a refresh. This is already set up for three hosts.

- **Netlify** — `netlify.toml` is ready. Connect the repository; the production site shows verified stops only, while **deploy previews and branch deploys include drafts**.
- **Vercel** — `vercel.json` is ready. To show drafts on preview deployments, add `INCLUDE_DRAFTS = true` under _Settings → Environment Variables → Preview_.
- **GitHub Pages** — run the _Deploy to GitHub Pages_ workflow from the Actions tab (first set _Settings → Pages → Source_ to _GitHub Actions_). Tick _include drafts_ for a test site. The build sets `BASE_PATH` so the site works at `https://<user>.github.io/<repository>/`, and writes `404.html` for deep links.

`.github/workflows/ci.yml` runs lint, type checks, unit tests, the build and the browser tests on every push and pull request.

### Offline and updates

After the first visit a service worker keeps the whole game (pages, art, fonts, content) on the device, so it works without a connection. When a new version is deployed, open pages pick it up and reload once. Hosts must not cache `sw.js` for long; the Netlify and Vercel configs already set this.

## Saved progress

Progress is stored in the browser under the key `lakbay-rizal:v1` (store version 2 since v2.3; older saves are upgraded automatically). If a save cannot be read, the game keeps a copy under `lakbay-rizal:v1:corrupt`, starts fresh and tells the player. To change what is saved, bump the version and add a migration in `src/store/migrations.ts`. Players can reset everything from **Settings → Reset progress**, and copy their progress to another device (or keep a backup) with **Settings → Save code** (a short code or a `.lakbay` file). The game warns before leaving the page only in the middle of a quiz.

## Quality checks (last run 25 November 2026)

| Check                                  | Result                                                                                                                                   |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Unit tests                             | 158 passing                                                                                                                              |
| Browser tests (1440 px and 360 px)     | All passing: SRS §12 journey, every stop end to end, offline play, production "Content coming soon", accessibility scans of every screen |
| Accessibility (axe, WCAG 2.1 AA)       | No serious or critical issues on any screen                                                                                              |
| Lighthouse (median of 3, drafts build) | Performance 94–99 and Accessibility 100 on mobile and desktop for the map, a stop and the passport                                       |
| First-load JavaScript                  | about 85 KB gzipped (budget 300 KB)                                                                                                      |

Lighthouse's mobile test simulates a slow 4G phone; under it the largest image appears after about 2.6–3.0 seconds. On a real mid-range phone over normal 4G it is faster.

## Licences and credits

Pixel art: original, by the RIZLIFE team. Font: VT323 by Peter Hull (SIL Open Font License), self-hosted. Map coastlines: the `global-land-mask` package (GLOBE 1-km data). The in-game Credits page lists every source.
