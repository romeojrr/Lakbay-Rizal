# Content to-do

Content the game needs that is missing or still marked `[TO WRITE]`. Each line names the stop (or file) and the field.

The team's standing open items are in SRS §13 and in each stop's `verifyNotes`. This list holds only new gaps found while building.

- `fortsantiago-1896` › `dialogue.dramatized` — Rizal speaks a line ("There is something inside.") but the dialogue is marked `dramatized: false`. Either confirm it is a documented quote and cite where it comes from, or set `dramatized: true` so the "Dramatized" tag shows (SRS §3.6, §6.4). Found by `npm run validate-content` (warning).
- All 25 stops › `scene.notes` — FR-55 asks for three short "what you see" notes per scene for the scene gallery. The seed has none, so the gallery shows `[TO WRITE]`. Add up to three notes per stop in `public/content/stops.json` (they describe the picture, so check them against `scene.alt` and the art).
- Credits › team members — FR-72 lists "team members"; no names are in content. The Credits page shows `[TO WRITE]` until the team adds them (then move the text from `src/i18n/en.json` `credits.teamToWrite`).
