# Content to-do

Content the game needs that is missing or still marked `[TO WRITE]`. Each line names the stop (or file) and the field.

The team's standing open items are in SRS §13 and in each stop's `verifyNotes`. This list holds only new gaps found while building.

- All 25 stops › `scene.notes` — FR-55 asks for three short "what you see" notes per scene for the scene gallery. The seed has none, so the gallery shows `[TO WRITE]`. Add up to three notes per stop in `public/content/stops.json` (they describe the picture, so check them against `scene.alt` and the art).
- Credits › team members — FR-72 lists "team members"; no names are in content. The Credits page shows `[TO WRITE]` until the team adds them (then move the text from `src/i18n/en.json` `credits.teamToWrite`).
- `i18n/fil.stops.json` › every stop › `story` — the Filipino file has no translation of the 100–150-word summary, so Read more stays in English in Filipino mode. Add `"story"` to each stop to translate it.
- `src/i18n/fil.json` — 206 of 334 UI strings have no Filipino yet and show in English (`npm run i18n-missing` lists them). `passport.stamps` ("Stamps") and `settings.resetConfirm` ("Yes, reset") need a Filipino string that fits how the app uses them; the seed's strings for those keys meant something else.
- `i18n/fil.*.json` › `status` — all three are `"draft"`, so the "Draft translation" badge shows. A fluent Filipino teacher should review them, then set `"status": "reviewed"` (SRS §3.10, §13).
- `stops.json` — writing-rule warnings from `npm run validate-content` (SRS §6.4b): ust-1877 has no "spot the error" question; heidelberg-1886 and biarritz-1891 have no "order" or "match" question; wilhelmsfeld-1886 and ghent-1891 chapter 4 have 4 paragraphs (aim for 1–3).
- `guide.json` › tour `t4` (and `i18n/fil.guide.json`) — the text says "Slide through the years", but the map no longer has a timeline slider; the step now points at the "See the whole timeline" link in the side panel. Reword it, e.g. to invite the player to open the whole timeline.
- `assets/maps/world.png` (U9 landing) — copied from the U9 reference pack; `art-tools/` has no script that makes it yet. Add one (SRS §7) so the world map can be remade like the region maps.
